import multer from 'multer';

// Use memory storage so we can parse buffer (PDF / text) and store directly
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
});

