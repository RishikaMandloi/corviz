import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import { USER_ROLES } from "../../constants";
import {
  IUser,
  IUserMethods,
  UserDocument,
  UserModel,
  //UserRole,
} from "./user.types";

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
      minlength: [2, "First name must be at least 2 characters."],
      maxlength: [50, "First name cannot exceed 50 characters."],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters."],
      maxlength: [50, "Last name cannot exceed 50 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Hash password before saving
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return ;
  }

  this.password = await bcrypt.hash(this.password, 12);

  ;
});

/**
 * Compare password
 */
userSchema.method(
  "comparePassword",
  async function (
    this: UserDocument,
    candidatePassword: string
  ): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
);

export const User = model<IUser, UserModel>("User", userSchema);