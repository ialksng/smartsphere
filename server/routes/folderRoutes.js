import express from 'express';
import Folder from '../models/Folder.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// @desc    Get user folders
// @route   GET /api/folders
router.get('/', async (req, res) => {
  try {
    const parent = req.query.parent || req.query.parentId || null;
    const folders = await Folder.find({
      userId: req.user._id,
      parentId: parent === 'null' || !parent ? null : parent,
      isTrashed: false,
    }).sort({ createdAt: -1 });

    return res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    return res.status(500).json({ message: error.message || 'Error fetching folders' });
  }
});

// @desc    Create a new folder
// @route   POST /api/folders
router.post('/', async (req, res) => {
  try {
    const { name, parent, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.create({
      userId: req.user._id,
      name,
      parentId: parent || parentId || null,
    });

    return res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    return res.status(500).json({ message: error.message || 'Error creating folder' });
  }
});

// @desc    Delete folder
// @route   DELETE /api/folders/:id
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isTrashed: true } },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    return res.json({ message: 'Folder moved to trash', folder });
  } catch (error) {
    console.error('Delete folder error:', error);
    return res.status(500).json({ message: error.message || 'Error deleting folder' });
  }
});

export default router;

