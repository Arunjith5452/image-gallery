import express from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types';
import { ImageController } from '../controllers/imageController';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

const imageController = container.get<ImageController>(TYPES.ImageController);

router.use(protect); 

router.route('/')
  .get(imageController.getImages);

router.post('/bulk', upload.array('images', 20), imageController.uploadImages);
router.put('/reorder', imageController.reorderImages);

router.route('/:id')
  .put(upload.single('image'), imageController.updateImage)
  .delete(imageController.deleteImage);

export default router;
