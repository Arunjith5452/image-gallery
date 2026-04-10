import { injectable } from 'inversify';
import { BaseRepository } from './BaseRepository';
import { IImageRepository } from './interfaces/IImageRepository';
import Image, { IImage } from '../models/Image';

@injectable()
export class ImageRepository extends BaseRepository<IImage> implements IImageRepository {
  protected model = Image;

  async findUserImages(userId: string): Promise<IImage[]> {
    return this.model.find({ user: userId }).sort({ order: 1, createdAt: -1 }).exec();
  }

  async bulkCreate(images: Partial<IImage>[]): Promise<IImage[]> {
    return this.model.insertMany(images) as unknown as IImage[]; // Casting due to mongoose typing inconsistencies with insertMany returning mongoose documents
  }

  async bulkUpdateOrder(items: { id: string; order: number; userId: string }[]): Promise<void> {
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, user: item.userId },
        update: { order: item.order },
      },
    }));

    await this.model.bulkWrite(bulkOps);
  }

  async findHighestOrderForUser(userId: string): Promise<number> {
    const lastImage = await this.model.findOne({ user: userId }).sort({ order: -1 }).exec();
    return lastImage && lastImage.order !== undefined ? lastImage.order : -1;
  }
}
