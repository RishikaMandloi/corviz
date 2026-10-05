import { AppError } from "../../errors";
import { User } from "./user.model";
import { ChangePasswordDto, UpdateCurrentUserDto } from "./user.types";

class UserService {

  
  /**
   * Get Current Authenticated User
   */
  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return user;
  }


  /**
 * Update Current Authenticated User
 */
async updateCurrentUser(
  userId: string,
  data: UpdateCurrentUserDto
) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (data.firstName !== undefined) {
    user.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    user.lastName = data.lastName;
  }

  await user.save();

  return user;
}


/**
 * Change Current User Password
 */
async changePassword(
  userId: string,
  data: ChangePasswordDto
) {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isPasswordValid = await user.comparePassword(
    data.currentPassword
  );

  if (!isPasswordValid) {
    throw new AppError(
      "Current password is incorrect.",
      400
    );
  }

  user.password = data.newPassword;

  /**
   * Password hashing automatically
   * happens inside user.model.ts pre("save") hook.
   */
  await user.save();

  return null;
}

/**
 * Get All Users (Admin)
 */
async getAllUsers() {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  return users;
}
}

export const userService = new UserService();

