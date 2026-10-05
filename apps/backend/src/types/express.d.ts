import { AuthenticatedUser } from "../shared/types/authenticated-user.types";

declare global {
  namespace Express {
    interface Request {
      user?:{ 
        id: string;
        role: UserRole;
      };
    }
  }
}

export {};