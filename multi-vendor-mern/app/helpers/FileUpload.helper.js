import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.util.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'app/uploads/products');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|gif|webp)$/i;
  if (allowedExt.test(path.extname(file.originalname))) {
    return cb(null, true);
  }
  cb(new ApiError(400, 'Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 5);

// Wrapper that calls multer and catches its errors, forwarding them to next()
export const uploadProductImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError) return next(err);
      // Multer-specific errors (like file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large. Maximum size is 5 MB.'));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, 'Too many files. Maximum is 5.'));
      }
      return next(new ApiError(500, err.message));
    }
    next();
  });
};