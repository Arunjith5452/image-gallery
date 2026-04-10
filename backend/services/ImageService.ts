import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import { TYPES } from '../types';
import { IImageService } from './interfaces/IImageService';
import { IImageRepository } from '../repositories/interfaces/IImageRepository';
import path from 'path';
import fs from 'fs';
import { IImage } from '../models/Image';
import { UpdateQuery } from 'mongoose';

@injectable()
export class ImageService implements IImageService {
  private imageRepository: IImageRepository;

  constructor(@(inject(TYPES.IImageRepository) as ParameterDecorator) imageRepository: IImageRepository) {
    this.imageRepository = imageRepository;
  }

  async getImages(userId: string): Promise<IImage[]> {
    return this.imageRepository.findUserImages(userId);
  }

  async uploadImages(files: Express.Multer.File[], titlesMap: Record<string, string>, userId: string): Promise<IImage[]> {
    if (!files || files.length === 0) {
      throw new Error('No images provided');
    }

    let currentOrder = await this.imageRepository.findHighestOrderForUser(userId);
    currentOrder = currentOrder !== -1 ? currentOrder + 1 : 0;

    const imageDocs = files.map((file) => {
      const doc = {
        title: titlesMap[file.originalname] || file.originalname.split('.')[0],
        filename: file.filename,
        mimetype: file.mimetype,
        order: currentOrder,
        user: new mongoose.Types.ObjectId(userId),
      };
      currentOrder++;
      return doc;
    });

    const createdImages = await this.imageRepository.bulkCreate(imageDocs);
    return createdImages;
  }

  async updateImage(id: string, userId: string, title?: string, newFile?: Express.Multer.File): Promise<IImage | null> {
    const image = await this.imageRepository.findById(id);

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.user.toString() !== userId) {
      throw new Error('User not authorized');
    }

    const updateData: UpdateQuery<IImage> = {};
    if (title) updateData.title = title;

    if (newFile) {
      const oldPath = path.join(__dirname, '../uploads', image.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      updateData.filename = newFile.filename;
      updateData.mimetype = newFile.mimetype;
    }

    const updatedImage = await this.imageRepository.updateById(id, updateData);
    return updatedImage;
  }

  async deleteImage(id: string, userId: string): Promise<void> {
    const image = await this.imageRepository.findById(id);

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.user.toString() !== userId) {
      throw new Error('User not authorized');
    }

    const filePath = path.join(__dirname, '../uploads', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.imageRepository.deleteById(id);
  }

  async reorderImages(items: { id: string; order: number }[], userId: string): Promise<void> {
    if (!items || !items.length) {
      throw new Error('No items provided for reordering');
    }

    const itemsWithUserId = items.map(item => ({ ...item, userId }));
    await this.imageRepository.bulkUpdateOrder(itemsWithUserId);
  }
}
