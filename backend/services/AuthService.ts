import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IAuthService } from './interfaces/IAuthService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { RegisterDto } from '../dtos/RegisterDto';
import { LoginDto } from '../dtos/LoginDto';
import { ResetPasswordDto } from '../dtos/ResetPasswordDto';
import { AuthResponse } from '../interfaces/auth';
import EmailService from '../utils/EmailService';
import { AUTH_MESSAGES } from '../constants/messages';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errorClasses';

@injectable()
export class AuthService implements IAuthService {
  private _userRepository: IUserRepository;

  constructor(@(inject(TYPES.IUserRepository) as ParameterDecorator) userRepository: IUserRepository) {
    this._userRepository = userRepository;
  }

  private _generateToken(id: string): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
    return jwt.sign({ id }, secret, {
      expiresIn: '30d',
    });
  }

  async register(registrationPayload: RegisterDto): Promise<AuthResponse> {
    const { email, phone, password } = registrationPayload;

    if (!email || !phone || !password) {
      throw new BadRequestError(AUTH_MESSAGES.ALL_FIELDS_REQUIRED);
    }

    const userExists = await this._userRepository.findOne({ email });

    if (userExists) {
      throw new BadRequestError(AUTH_MESSAGES.USER_EXISTS);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await this._userRepository.create({
      email,
      phone,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
    });

    if (newUser) {
      await EmailService.sendVerificationEmail(email, verificationToken);

      return {
        _id: newUser._id.toString(),
        email: newUser.email,
        phone: newUser.phone,
        message: AUTH_MESSAGES.REGISTRATION_SUCCESS,
      };
    } else {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_USER_DATA);
    }
  }

  async login(loginPayload: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginPayload;

    const userAccount = await this._userRepository.findOne({ email });

    if (!userAccount) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!userAccount.isVerified) {
      throw new UnauthorizedError(AUTH_MESSAGES.NOT_VERIFIED);
    }

    if (userAccount.password && (await bcrypt.compare(password!, userAccount.password))) {
      const userId = userAccount._id.toString();
      return {
        _id: userId,
        email: userAccount.email,
        phone: userAccount.phone,
        token: this._generateToken(userId),
      };
    } else {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
  }

  async resetPassword(resetPayload: ResetPasswordDto): Promise<{ message: string }> {
    const { email, phone, newPassword } = resetPayload;

    const userAccount = await this._userRepository.findOne({ email, phone });

    if (!userAccount) {
      throw new NotFoundError(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if (!userAccount.isVerified) {
      throw new BadRequestError(AUTH_MESSAGES.EMAIL_VERIFY_FIRST);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword!, salt);

    await this._userRepository.updateById(userAccount._id.toString(), { password: hashedPassword });

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const userAccount = await this._userRepository.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!userAccount) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_VERIFY_TOKEN);
    }

    await this._userRepository.updateById(userAccount._id.toString(), {
      isVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
    });

    return { message: AUTH_MESSAGES.EMAIL_VERIFIED };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const userAccount = await this._userRepository.findOne({ email });

    if (!userAccount) {
      return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SENT };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this._userRepository.updateById(userAccount._id.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: resetTokenExpiry,
    });

    await EmailService.sendPasswordResetEmail(email, resetToken);

    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SENT };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
    const userAccount = await this._userRepository.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: new Date() }
    });

    if (!userAccount) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_RESET_TOKEN);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this._userRepository.updateById(userAccount._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordTokenExpiry: undefined,
    });

    return { message: AUTH_MESSAGES.RESET_PASSWORD_TOKEN_SUCCESS };
  }
}
