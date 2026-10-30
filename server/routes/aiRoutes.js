import express from 'express';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  askGroq,
  summarizeDocument,
  answerSearchQuery,
  askWithDocAwareness,
} from '../services/groqService.js';

const router = express.Router();
router.use(protect);

// @desc    Chat with AI Assistant (Full workspace document awareness & context awareness)
// @route   POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], docContent = '', fileId, fileName } = req.body;

    if (!message && !docContent) {
      return res.status(400).json({ message: 'Prompt message is required' });
    }

    // Retrieve active document if specified
    let activeDoc = null;
    if (fileId) {
      activeDoc = await Document.findOne({ _id: fileId, userId: req.user._id });
    } else if (docContent) {
      activeDoc = {
        filename: fileName || 'Active Document',
        content: docContent,
        summary: '',
      };
    }

    // Scan all active documents across the workspace for deep context awareness
    const workspaceDocs = await Document.find({
      userId: req.user._id,
      isTrashed: false,
    })
      .select('filename summary content updatedAt')
      .sort({ updatedAt: -1 })
      .limit(12);

    // Save user message to history
    await ChatMessage.create({
      userId: req.user._id,
      role: 'user',
      text: message || 'Document query',
      fileName: activeDoc?.filename || undefined,
    });

    const reply = await askWithDocAwareness({
      prompt: message || 'Please analyze this document.',
      history,
      activeDoc,
      workspaceDocs,
    });

    // Save AI response to history
    await ChatMessage.create({
      userId: req.user._id,
      role: 'ai',
      text: reply,
      fileName: activeDoc?.filename || undefined,
    });

    return res.json({
      reply,
      activeDoc: activeDoc ? { id: activeDoc._id, filename: activeDoc.filename } : null,
      scannedDocsCount: workspaceDocs.length,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ message: error.message || 'Error processing AI chat' });
  }
});

// @desc    AI Search Insight across all workspace documents
// @route   GET /api/ai/search-insight
router.get('/search-insight', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({ answer: '', documents: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    // Scan through all documents in the user's workspace
    const matchingDocs = await Document.find({
      userId: req.user._id,
      isTrashed: false,
      $or: [{ filename: regex }, { content: regex }, { summary: regex }],
    })
      .select('filename summary content cloudProvider updatedAt')
      .sort({ updatedAt: -1 })
      .limit(6);

    const answer = await answerSearchQuery(q.trim(), matchingDocs);

    return res.json({
      answer,
      documents: matchingDocs.map((d) => ({
        _id: d._id,
        filename: d.filename,
        summary: d.summary,
        cloudProvider: d.cloudProvider,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (error) {
    console.error('AI search insight error:', error);
    return res.status(500).json({ message: error.message || 'Error generating search insight' });
  }
});

// @desc    Get user chat history
// @route   GET /api/ai/chat/history
router.get('/chat/history', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .limit(50);

    const formatted = messages.map((m) => ({
      _id: m._id,
      role: m.role,
      text: m.text,
      fileName: m.fileName,
      type: m.type,
      createdAt: m.createdAt,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    return res.status(500).json({ message: error.message || 'Error retrieving chat history' });
  }
});

// @desc    Upload file for AI reading & summarization
// @route   POST /api/ai/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let extractedText = '';
    const mimeType = req.file.mimetype || 'text/plain';

    if (mimeType === 'application/pdf') {
      try {
        const parsed = await pdfParse(req.file.buffer);
        extractedText = parsed.text || '';
      } catch (pdfErr) {
        console.warn('PDF parse error:', pdfErr.message);
        extractedText = '[Scanned or protected PDF content]';
      }
    } else {
      extractedText = req.file.buffer.toString('utf-8');
    }

    // Generate summary with Grok AI
    const summary = await summarizeDocument(req.file.originalname, extractedText);

    // Save as Document in database
    const doc = await Document.create({
      userId: req.user._id,
      filename: req.file.originalname,
      content: extractedText,
      summary,
      mimeType,
      size: req.file.size,
    });

    return res.json({
      text: extractedText,
      summary,
      doc,
    });
  } catch (error) {
    console.error('AI upload error:', error);
    return res.status(500).json({ message: error.message || 'Error parsing file for AI' });
  }
});

export default router;

