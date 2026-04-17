import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { Response, NextFunction } from 'express';
import { IImageService } from '../services/interfaces/IImageService';
import { HttpStatus } from '../constants/HttpStatus';
import { AuthRequest } from '../middleware/auth';
import { IMAGE_MESSAGES } from '../constants/messages';

@injectable()
export class ImageController {
  private _imageService: IImageService;

  constructor(@(inject(TYPES.IImageService) as ParameterDecorator) imageService: IImageService) {
    this._imageService = imageService;
  }

  /**
   * Retrieves all images for the authenticated user.
   * @param req - AuthRequest containing user info.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  getImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userImages = await this._imageService.getImages(req.user?.id as string);
      res.status(HttpStatus.OK).json(userImages);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Uploads one or more images.
   * @param req - AuthRequest containing files and user info.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  uploadImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let imageTitlesMap: Record<string, string> = {};
      if (req.body.titles) {
        try {
          imageTitlesMap = JSON.parse(req.body.titles);
        } catch (parseError) {
          console.error("Could not parse image titles", parseError);
        }
      }

      const uploadFiles = req.files as Express.Multer.File[];
      const customCreatedImages = await this._imageService.uploadImages(uploadFiles, imageTitlesMap, req.user?.id as string);
      res.status(HttpStatus.CREATED).json(customCreatedImages);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates an existing image.
   * @param req - AuthRequest containing image ID, title, file, and user info.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  updateImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updatedImageDoc = await this._imageService.updateImage(
        req.params.id as string,
        req.user?.id as string,
        req.body.title,
        req.file
      );
      res.status(HttpStatus.OK).json(updatedImageDoc);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes an image.
   * @param req - AuthRequest containing image ID and user info.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  deleteImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const imageToDeleteId = req.params.id as string;
      await this._imageService.deleteImage(imageToDeleteId, req.user?.id as string);
      res.status(HttpStatus.OK).json({ id: imageToDeleteId });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reorders multiple images.
   * @param req - AuthRequest containing reorder items and user info.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  reorderImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reorderPayload = req.body.items;
      await this._imageService.reorderImages(reorderPayload, req.user?.id as string);
      res.status(HttpStatus.OK).json({ message: IMAGE_MESSAGES.REORDER_SUCCESS });
    } catch (error) {
      next(error);
    }
  };
}
