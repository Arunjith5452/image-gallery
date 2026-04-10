import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../constants/HttpStatus';

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new AppError(
      `Invalid file type: ${file.mimetype}. Only images are allowed (JPEG, PNG, GIF, WebP, SVG, BMP).`,
      HttpStatus.BAD_REQUEST
    ));
    return;
  }

  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new AppError(
      `Invalid file extension: ${ext}. Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, BMP).`,
      HttpStatus.BAD_REQUEST
    ));
    return;
  }

  cb(null, true);
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024
  }
});
