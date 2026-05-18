import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// Configure multer to use memory storage (good for serverless environments)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and pdfs
  if (file.mimetype.startsWith('image') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Not a valid file format. Please upload only images or PDFs.', 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
