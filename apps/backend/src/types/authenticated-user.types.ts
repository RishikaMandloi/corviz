import { UserRole } from "../constants";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}