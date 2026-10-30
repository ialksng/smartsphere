import express from 'express';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import { protect } from '../middleware/auth.js';
import {
  getDriveAuthUrl,
  exchangeCodeForTokens,
  listDriveFiles,
  getDriveStorage,
  downloadDriveFile,
  uploadToDrive,
} from '../services/googleDriveService.js';
import { summarizeDocument } from '../services/groqService.js';

const router = express.Router();

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || 'https://ialksng.me/work/projects/smartsphere/app';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// @desc    Initiate Google Drive OAuth linking
// @route   GET /api/cloud/google/auth
router.get('/google/auth', (req, res) => {
  try {
    const userId = req.query.userId || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to link Google Drive' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({
        message: 'Google Client ID and Secret are not configured yet in server .env',
      });
    }

    const url = getDriveAuthUrl(userId);
    return res.json({ url });
  } catch (error) {
    console.error('Google Drive Auth initiation error:', error);
    return res.status(500).json({ message: error.message || 'Error generating auth URL' });
  }
});

// @desc    Google Drive OAuth Callback
// @route   GET /api/cloud/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  const frontendUrl = getFrontendUrl();

  if (!code || !userId) {
    return res.redirect(`${frontendUrl}/cloudhub/google?error=auth_failed`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await User.findByIdAndUpdate(userId, {
      $set: { googleDriveTokens: tokens },
    });

    return res.redirect(`${frontendUrl}/cloudhub/google?connected=true`);
  } catch (error) {
    console.error('Drive OAuth callback error:', error);
    return res.redirect(`${frontendUrl}/cloudhub/google?error=${encodeURIComponent(error.message)}`);
  }
});

// All remaining endpoints require JWT authentication
router.use(protect);

// @desc    Get Google Drive storage statistics
// @route   GET /api/cloud/google/storage
router.get('/google/storage', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleDriveTokens?.access_token) {
      return res.json({
        used: 0,
        total: 0,
        connected: false,
      });
    }

    const storage = await getDriveStorage(user);
    return res.json({ ...storage, connected: true });
  } catch (error) {
    console.error('Get storage error:', error);
    return res.json({
      used: 0,
      total: 0,
      connected: false,
      error: error.message,
    });
  }
});

// @desc    List Google Drive files
// @route   GET /api/cloud/google/files
router.get('/google/files', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleDriveTokens?.access_token) {
      return res.status(400).json({
        message: 'Google Drive is not linked. Please connect your Google account first.',
      });
    }

    const { folderId = 'root', search = '' } = req.query;
    const files = await listDriveFiles(user, folderId, search);
    return res.json(files);
  } catch (error) {
    console.error('List Google Drive files error:', error);
    return res.status(500).json({ message: error.message || 'Error fetching Drive files' });
  }
});

// @desc    Import file from Google Drive to DocHub
// @route   POST /api/cloud/google/import
router.post('/google/import', async (req, res) => {
  try {
    const { fileId, fileName } = req.body;
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }

    const user = await User.findById(req.user._id);
    const driveFile = await downloadDriveFile(user, fileId);

    let summary = '';
    try {
      summary = await summarizeDocument(fileName || driveFile.name, driveFile.content);
    } catch (sumErr) {
      console.warn('Drive import summary warning:', sumErr.message);
      summary = `Imported from Google Drive: ${driveFile.name}`;
    }

    const doc = await Document.create({
      userId: req.user._id,
      filename: fileName || driveFile.name,
      content: driveFile.content,
      mimeType: driveFile.mimeType,
      size: driveFile.size,
      cloudProvider: 'google',
      externalId: fileId,
      summary: summary || `Imported from Google Drive: ${driveFile.name}`,
    });

    return res.status(201).json({ message: 'File imported successfully', file: doc, insight: doc });
  } catch (error) {
    console.error('Import Google Drive file error:', error);
    return res.status(500).json({ message: error.message || 'Error importing file' });
  }
});

// @desc    Upload DocHub document to Google Drive
// @route   POST /api/cloud/google/upload-dochub
router.post('/google/upload-dochub', async (req, res) => {
  try {
    const { fileId, fileName, mimeType, content } = req.body;

    const user = await User.findById(req.user._id);
    if (!user.googleDriveTokens?.access_token) {
      return res.status(400).json({ message: 'Google Drive is not connected' });
    }

    let fileContent = content;
    let name = fileName;
    let type = mimeType;

    if (fileId && (!fileContent || !name)) {
      const doc = await Document.findOne({ _id: fileId, userId: req.user._id });
      if (doc) {
        fileContent = fileContent || doc.content;
        name = name || doc.filename;
        type = type || doc.mimeType;
      }
    }

    const uploaded = await uploadToDrive(user, name || 'document.txt', type || 'text/plain', fileContent || '');
    return res.json({ message: 'Successfully uploaded to Google Drive', data: uploaded });
  } catch (error) {
    console.error('Upload dochub to Drive error:', error);
    return res.status(500).json({ message: error.message || 'Error uploading to Drive' });
  }
});

// @desc    Upload local file or folder item to Google Drive
// @route   POST /api/cloud/google/upload-local
router.post('/google/upload-local', async (req, res) => {
  try {
    const { itemId, type, driveFolderId = 'root' } = req.body;

    const user = await User.findById(req.user._id);
    if (!user.googleDriveTokens?.access_token) {
      return res.status(400).json({ message: 'Google Drive is not connected' });
    }

    if (type === 'folder') {
      const folder = await Folder.findOne({ _id: itemId, userId: req.user._id });
      if (!folder) return res.status(404).json({ message: 'Folder not found' });

      // Create folder in Google Drive
      const uploadedFolder = await uploadToDrive(
        user,
        folder.name,
        'application/vnd.google-apps.folder',
        Buffer.from(''),
        driveFolderId
      );
      return res.json({ message: 'Folder created in Google Drive', data: uploadedFolder });
    } else {
      const doc = await Document.findOne({ _id: itemId, userId: req.user._id });
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      const uploaded = await uploadToDrive(
        user,
        doc.filename,
        doc.mimeType || 'text/plain',
        doc.content || '',
        driveFolderId
      );
      return res.json({ message: 'File uploaded to Google Drive', data: uploaded });
    }
  } catch (error) {
    console.error('Upload local item to Drive error:', error);
    return res.status(500).json({ message: error.message || 'Error syncing to Google Drive' });
  }
});

export default router;
