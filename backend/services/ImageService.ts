import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import { TYPES } from '../types';
import { IImageService } from './interfaces/IImageService';
import { IImageRepository } from '../repositories/interfaces/IImageRepository';
import { IImage } from '../models/Image';
import { UpdateQuery } from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { IMAGE_MESSAGES, AUTH_MESSAGES } from '../constants/messages';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errorClasses';

@injectable()
export class ImageService implements IImageService {
  private _imageRepository: IImageRepository;

  constructor(@(inject(TYPES.IImageRepository) as ParameterDecorator) imageRepository: IImageRepository) {
    this._imageRepository = imageRepository;
  }

  async getImages(userId: string): Promise<IImage[]> {
    return this._imageRepository.findUserImages(userId);
  }

  async uploadImages(uploadFiles: Express.Multer.File[], titlesMap: Record<string, string>, userId: string): Promise<IImage[]> {
    if (!uploadFiles || uploadFiles.length === 0) {
      throw new BadRequestError(IMAGE_MESSAGES.NO_IMAGES);
    }

    let currentOrder = await this._imageRepository.findHighestOrderForUser(userId);
    currentOrder = currentOrder !== -1 ? currentOrder + 1 : 0;

    const uploadPromises = uploadFiles.map(async (file) => {
      const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'image-gallery',
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );
        uploadStream.end(file.buffer);
      });

      return {
        title: titlesMap[file.originalname] || file.originalname.split('.')[0],
        cloudinaryPublicId: uploadResult.public_id,
        imageUrl: uploadResult.secure_url,
        mimetype: file.mimetype,
        order: currentOrder++,
        user: new mongoose.Types.ObjectId(userId),
      };
    });

    const imageMetadataList = await Promise.all(uploadPromises);
    const createdImages = await this._imageRepository.bulkCreate(imageMetadataList);
    return createdImages;
  }

  async updateImage(imageId: string, userId: string, newTitle?: string, newFile?: Express.Multer.File): Promise<IImage | null> {
    const existingImage = await this._imageRepository.findById(imageId);

    if (!existingImage) {
      throw new NotFoundError(IMAGE_MESSAGES.IMAGE_NOT_FOUND);
    }

    if (existingImage.user.toString() !== userId) {
      throw new UnauthorizedError(AUTH_MESSAGES.UNAUTHORIZED);
    }

    const updatePayload: UpdateQuery<IImage> = {};
    if (newTitle) updatePayload.title = newTitle;

    if (newFile) {
      await cloudinary.uploader.destroy(existingImage.cloudinaryPublicId);

      const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'image-gallery',
            public_id: existingImage.cloudinaryPublicId,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );
        uploadStream.end(newFile.buffer);
      });

      updatePayload.cloudinaryPublicId = uploadResult.public_id;
      updatePayload.imageUrl = uploadResult.secure_url;
      updatePayload.mimetype = newFile.mimetype;
    }

    const updatedImage = await this._imageRepository.updateById(imageId, updatePayload);
    return updatedImage;
  }

  async deleteImage(imageId: string, userId: string): Promise<void> {
    const existingImage = await this._imageRepository.findById(imageId);

    if (!existingImage) {
      throw new NotFoundError(IMAGE_MESSAGES.IMAGE_NOT_FOUND);
    }

    if (existingImage.user.toString() !== userId) {
      throw new UnauthorizedError(AUTH_MESSAGES.UNAUTHORIZED);
    }

    await cloudinary.uploader.destroy(existingImage.cloudinaryPublicId);

    await this._imageRepository.deleteById(imageId);
  }

  async reorderImages(reorderItems: { id: string; order: number }[], userId: string): Promise<void> {
    if (!reorderItems || !reorderItems.length) {
      throw new BadRequestError(IMAGE_MESSAGES.NO_ITEMS_REORDER);
    }

    const itemsWithUserContext = reorderItems.map(item => ({ ...item, userId }));
    await this._imageRepository.bulkUpdateOrder(itemsWithUserContext);
  }
}
