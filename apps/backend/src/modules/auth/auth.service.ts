import jwt, { Secret, SignOptions } from "jsonwebtoken";

import { User } from "../user";
import {
  AuthResponse,
  JwtPayload,
  LoginUserDto,
  RegisterUserDto,
} from "./auth.types";
import {AppError } from "../../errors";

const JWT_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];


export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterUserDto): Promise<AuthResponse> {
    const existingUser = await User.findOne({
      email: data.email,
    });

    if (existingUser) {
      throw new AppError("User already exists.");
    }

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });

    const accessToken = this.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    return {
      accessToken,
    };
  }

  /**
   * Login existing user
   */
  async login(data: LoginUserDto): Promise<AuthResponse> {
    const user = await User.findOne({
      email: data.email,
    }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password.");
    }

    const isPasswordValid = await user.comparePassword(data.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password.");
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    return {
      accessToken,
    };
  }

  /**
   * Generate JWT Access Token
   */
  private generateAccessToken(payload: JwtPayload): string {
  const secret: Secret = process.env.JWT_SECRET!;

    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN,
    };

  return jwt.sign(payload, secret, options);
}
}

export const authService = new AuthService();