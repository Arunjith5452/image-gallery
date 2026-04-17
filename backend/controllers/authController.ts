import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../services/interfaces/IAuthService';
import { HttpStatus } from '../constants/HttpStatus';

@injectable()

export class AuthController {
  private _authService: IAuthService;

  constructor(@(inject(TYPES.IAuthService) as ParameterDecorator) authService: IAuthService) {
    this._authService = authService;
  }

  /**
   * Registers a new user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authResult = await this._authService.register(req.body);
      res.status(HttpStatus.CREATED).json(authResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticates a user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authResult = await this._authService.login(req.body);
      res.status(HttpStatus.OK).json(authResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resets a user's password.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resetResult = await this._authService.resetPassword(req.body);
      res.status(HttpStatus.OK).json(resetResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifies a user's email.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verificationToken = String(req.params.token);
      const verificationResult = await this._authService.verifyEmail(verificationToken);
      res.status(HttpStatus.OK).json(verificationResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Triggers a forgot password email.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const forgotPasswordResult = await this._authService.forgotPassword(email);
      res.status(HttpStatus.OK).json(forgotPasswordResult);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resets password using a verification token.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next function.
   */
  resetPasswordWithToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resetToken = String(req.params.token);
      const { newPassword } = req.body;
      const resetResult = await this._authService.resetPasswordWithToken(resetToken, newPassword);
      res.status(HttpStatus.OK).json(resetResult);
    } catch (error) {
      next(error);
    }
  };
}
