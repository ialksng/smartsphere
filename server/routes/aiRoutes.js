import express from 'express';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { askGrok, summarizeDocument } from '../services/grokService.js';

const router = express.Router();
router.use(protect);

// @desc    Chat with Grok AI
// @route   POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], docContent = '', fileId } = req.body;

    if (!message && !docContent) {
      return res.status(400).json({ message: 'Prompt message is required' });
    }

    let contextualPrompt = message || 'Please analyze this document.';
    if (docContent && !contextualPrompt.includes(docContent.slice(0, 50))) {
      contextualPrompt = `Document Content:\n"""\n${docContent.slice(0, 6000)}\n"""\n\nQuestion: ${message}`;
    }

    // Save user message to history
    await ChatMessage.create({
      userId: req.user._id,
      role: 'user',
      text: message || 'Document query',
    });

    const reply = await askGrok(contextualPrompt, history);

    // Save AI response to history
    await ChatMessage.create({
      userId: req.user._id,
      role: 'ai',
      text: reply,
    });

    return res.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ message: error.message || 'Error processing AI chat' });
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

