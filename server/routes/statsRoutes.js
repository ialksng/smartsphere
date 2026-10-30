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

    const LOCAL_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024; // 100 MB
    const bytes = totalStorage[0]?.totalBytes || 0;
    const usedMB = (bytes / (1024 * 1024)).toFixed(1);
    const storageFormatted = `${usedMB} / 100 MB`;
    const percentUsed = Math.min(100, Math.round((bytes / LOCAL_STORAGE_LIMIT_BYTES) * 100));

    return res.json({
      docs: docsCount,
      favorites: favoritesCount,
      chats: chatsCount,
      storage: storageFormatted,
      storageBytes: bytes,
      storageLimitBytes: LOCAL_STORAGE_LIMIT_BYTES,
      storageUsedMB: usedMB,
      storagePercent: percentUsed,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: error.message || 'Error fetching stats' });
  }
});

export default router;

