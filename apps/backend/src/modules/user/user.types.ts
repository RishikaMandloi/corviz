import { HydratedDocument, Model } from "mongoose";
import type { UserRole } from "../../constants";
/**
 * User Roles
 */
// export enum UserRole {
//   USER = "USER",
//   ADMIN = "ADMIN",
// }

/**
 * User Properties
 */
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
}

/**
 * Update Current User DTO
 */
export interface UpdateCurrentUserDto {
  firstName?: string;
  lastName?: string;
}

/**
 * Instance Methods
 */
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Document Type
 */
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

/**
 * User Model Type
 */
export interface UserModel extends Model<IUser, {}, IUserMethods> {}

/**
 * Change Password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}