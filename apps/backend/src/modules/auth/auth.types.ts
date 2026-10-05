// import { UserRole } from "../user";
import { UserRole } from "../../constants";
/**
 * Registration Request Payload
 */
export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Login Request Payload
 */
export interface LoginUserDto {
  email: string;
  password: string;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  userId: string;
  role: UserRole;
}

/**
 * Authentication Response
 */
export interface AuthResponse {
  accessToken: string;
}