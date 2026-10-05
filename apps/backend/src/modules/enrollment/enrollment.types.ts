import {
  HydratedDocument,
  Model,
  Types,
} from "mongoose";

import {
  EnrollmentStatus,
} from "./enrollment.constants";

/**
 * Enrollment Properties
 */
export interface IEnrollment {
  user: Types.ObjectId;

  course: Types.ObjectId;

  status: EnrollmentStatus;

  progress: number;

  completedLessons: Types.ObjectId[];

  enrolledAt: Date;

  lastAccessedAt?: Date;

  completedAt?: Date;
}

/**
 * Enrollment Document
 */
export type EnrollmentDocument =
  HydratedDocument<IEnrollment>;

/**
 * Enrollment Model
 */
export interface EnrollmentModel
  extends Model<IEnrollment> {}