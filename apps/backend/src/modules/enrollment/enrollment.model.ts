import {
  Schema,
  model,
  models,
} from "mongoose";

import {
  IEnrollment,
  EnrollmentModel,
} from "./enrollment.types";

import {
  ENROLLMENT_STATUS,
} from "./enrollment.constants";

/**
 * Enrollment Schema
 */
const enrollmentSchema = new Schema<
  IEnrollment,
  EnrollmentModel
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(
        ENROLLMENT_STATUS
      ),
      default:
        ENROLLMENT_STATUS.ENROLLED,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedLessons: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Lesson",
        },
      ],
      default: [],
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * One Enrollment Per User Per Course
 */
enrollmentSchema.index(
  {
    user: 1,
    course: 1,
  },
  {
    unique: true,
  }
);

/**
 * Frequently Used Filters
 */
enrollmentSchema.index({
  status: 1,
  progress: 1,
});

/**
 * Recent Activity
 */
enrollmentSchema.index({
  lastAccessedAt: -1,
});

/**
 * Export Model
 */
export const Enrollment =
  models.Enrollment ||
  model<IEnrollment, EnrollmentModel>(
    "Enrollment",
    enrollmentSchema
  );