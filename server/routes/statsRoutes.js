import express from 'express';
import Document from '../models/Document.js';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// @desc    Get dashboard summary statistics
// @route   GET /api/stats
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    const [docsCount, favoritesCount, chatsCount, totalStorage] = await Promise.all([
      Document.countDocuments({ userId, isTrashed: false }),
      Document.countDocuments({ userId, isFavorite: true, isTrashed: false }),
      ChatMessage.countDocuments({ userId }),
      Document.aggregate([
        { $match: { userId, isTrashed: false } },
        { $group: { _id: null, totalBytes: { $sum: '$size' } } },
      ]),
    ]);

    const bytes = totalStorage[0]?.totalBytes || 0;
    const storageFormatted =
      bytes > 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${(bytes / 1024).toFixed(1)} KB`;

    return res.json({
      docs: docsCount,
      favorites: favoritesCount,
      chats: chatsCount,
      storage: storageFormatted,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: error.message || 'Error fetching stats' });
  }
});

export default router;

