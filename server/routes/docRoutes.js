import express from 'express';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { summarizeDocument } from '../services/groqService.js';

const router = express.Router();

// Apply auth protection to all doc routes
router.use(protect);

// @desc    Search documents
// @route   GET /api/dochub/search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const allDocs = await Document.find({
        userId: req.user._id,
        isTrashed: false,
      }).sort({ updatedAt: -1 });
      return res.json(allDocs);
    }

    const regex = new RegExp(q, 'i');
    const docs = await Document.find({
      userId: req.user._id,
      isTrashed: false,
      $or: [{ filename: regex }, { content: regex }, { summary: regex }],
    }).sort({ updatedAt: -1 });

    return res.json(docs);
  } catch (error) {
    console.error('Doc search error:', error);
    return res.status(500).json({ message: error.message || 'Error searching documents' });
  }
});

// @desc    Get documents (supports parentId, view=all|favorites|trash)
// @route   GET /api/dochub
router.get('/', async (req, res) => {
  try {
    const { parentId, view } = req.query;

    const filter = { userId: req.user._id };

    if (view === 'favorites') {
      filter.isFavorite = true;
      filter.isTrashed = false;
    } else if (view === 'trash') {
      filter.isTrashed = true;
    } else {
      filter.isTrashed = false;
    }

    // If parentId parameter is present (even if null or "null" or empty)
    if (parentId !== undefined) {
      const parsedParent =
        parentId === 'null' || parentId === '' ? null : parentId;
      filter.parentId = parsedParent;

      // When querying a folder view (like in MyStorage), combine folders and files
      const [folders, files] = await Promise.all([
        Folder.find({
          userId: req.user._id,
          parentId: parsedParent,
          isTrashed: false,
        }).sort({ createdAt: -1 }),
        Document.find(filter).sort({ createdAt: -1 }),
      ]);

      const formattedFolders = folders.map((f) => ({
        _id: f._id,
        filename: f.name,
        name: f.name,
        type: 'folder',
        parentId: f.parentId,
        size: 0,
        createdAt: f.createdAt,
      }));

      const formattedFiles = files.map((doc) => doc.toJSON());

      return res.json([...formattedFolders, ...formattedFiles]);
    }

    const docs = await Document.find(filter).sort({ updatedAt: -1 });
    return res.json(docs);
  } catch (error) {
    console.error('Fetch docs error:', error);
    return res.status(500).json({ message: error.message || 'Error fetching documents' });
  }
});

// @desc    Get document by ID
// @route   GET /api/dochub/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    return res.json(doc);
  } catch (error) {
    console.error('Get doc error:', error);
    return res.status(500).json({ message: error.message || 'Error retrieving document' });
  }
});

// @desc    Create a new empty or written document
// @route   POST /api/dochub/file
router.post('/file', async (req, res) => {
  try {
    const { filename, content = '', parentId = null } = req.body;

    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    let summary = '';
    if (content && content.trim().length > 20) {
      try {
        summary = await summarizeDocument(filename, content);
      } catch (sumErr) {
        console.warn('Auto-summary warning on create:', sumErr.message);
      }
    }

    const doc = await Document.create({
      userId: req.user._id,
      filename,
      content,
      summary,
      size: Buffer.byteLength(content || '', 'utf-8'),
      parentId: parentId || null,
      mimeType: filename.endsWith('.json')
        ? 'application/json'
        : filename.endsWith('.md')
        ? 'text/markdown'
        : 'text/plain',
    });

    return res.status(201).json(doc);
  } catch (error) {
    console.error('Create doc error:', error);
    return res.status(500).json({ message: error.message || 'Error creating document' });
  }
});

// @desc    Upload file to DocHub
// @route   POST /api/dochub/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Enforce 100 MB local workspace quota
    const currentUsage = await Document.aggregate([
      { $match: { userId: req.user._id, isTrashed: false } },
      { $group: { _id: null, total: { $sum: '$size' } } },
    ]);
    const totalBytes = (currentUsage[0]?.total || 0) + req.file.size;
    if (totalBytes > 100 * 1024 * 1024) {
      return res.status(400).json({
        message: 'Local storage quota exceeded (100 MB limit). Please delete old documents or connect Google Drive for additional space.',
      });
    }

    const { parentId } = req.body;
    let extractedContent = '';
    const mimeType = req.file.mimetype || 'text/plain';

    if (mimeType === 'application/pdf') {
      try {
        const parsed = await pdfParse(req.file.buffer);
        extractedContent = parsed.text || '';
      } catch (pdfErr) {
        console.warn('PDF parse warning:', pdfErr.message);
        extractedContent = '[PDF Document Content]';
      }
    } else {
      // Treat as UTF-8 text if textual or fallback
      extractedContent = req.file.buffer.toString('utf-8');
    }

    // Generate summary with Grok
    let summary = '';
    try {
      summary = await summarizeDocument(req.file.originalname, extractedContent);
    } catch (sumErr) {
      console.warn('Summary warning:', sumErr.message);
      summary = 'Document uploaded successfully.';
    }

    const doc = await Document.create({
      userId: req.user._id,
      filename: req.file.originalname,
      content: extractedContent,
      summary,
      mimeType,
      size: req.file.size,
      parentId: parentId || null,
    });

    return res.status(201).json(doc);
  } catch (error) {
    console.error('Upload doc error:', error);
    return res.status(500).json({ message: error.message || 'Error uploading document' });
  }
});

// @desc    Update document or folder (rename, content update, favorite, trash)
// @route   PUT /api/dochub/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, filename, content, isFavorite, isTrashed, parentId } = req.body;

    const updateFields = {};
    if (filename !== undefined) updateFields.filename = filename;
    if (name !== undefined) updateFields.filename = name; // handle rename
    if (content !== undefined) {
      updateFields.content = content;
      updateFields.size = Buffer.byteLength(content || '', 'utf-8');
      if (content.trim().length > 30) {
        try {
          updateFields.summary = await summarizeDocument(filename || name || 'Document', content);
        } catch (sumErr) {
          console.warn('Auto-summary update warning:', sumErr.message);
        }
      }
    }
    if (isFavorite !== undefined) updateFields.isFavorite = isFavorite;
    if (isTrashed !== undefined) updateFields.isTrashed = isTrashed;
    if (parentId !== undefined) updateFields.parentId = parentId;

    let doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateFields },
      { new: true }
    );

    // If not found in Document, check if it's a Folder being renamed or updated
    if (!doc) {
      const folderUpdate = {};
      if (name || filename) folderUpdate.name = name || filename;
      if (isTrashed !== undefined) folderUpdate.isTrashed = isTrashed;

      const folder = await Folder.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: folderUpdate },
        { new: true }
      );

      if (folder) {
        return res.json(folder);
      }

      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json(doc);
  } catch (error) {
    console.error('Update doc error:', error);
    return res.status(500).json({ message: error.message || 'Error updating document' });
  }
});

// @desc    Move document to trash
// @route   DELETE /api/dochub/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isTrashed: true } },
      { new: true }
    );

    if (!doc) {
      // Check folder
      const folder = await Folder.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $set: { isTrashed: true } },
        { new: true }
      );
      if (!folder) {
        return res.status(404).json({ message: 'Item not found' });
      }
      return res.json({ message: 'Folder moved to trash', folder });
    }

    return res.json({ message: 'Document moved to trash', doc });
  } catch (error) {
    console.error('Trash doc error:', error);
    return res.status(500).json({ message: error.message || 'Error moving document to trash' });
  }
});

// @desc    Permanently delete document
// @route   DELETE /api/dochub/:id/permanent
router.delete('/:id/permanent', async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!doc) {
      const folder = await Folder.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });
      if (!folder) {
        return res.status(404).json({ message: 'Item not found' });
      }
      return res.json({ message: 'Folder permanently deleted' });
    }

    return res.json({ message: 'Document permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return res.status(500).json({ message: error.message || 'Error deleting document' });
  }
});

export default router;

