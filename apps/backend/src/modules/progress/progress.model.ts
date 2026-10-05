import {
  Schema,
  model,
  models,
} from "mongoose";

import {
  IProgress,
  ProgressModel,
} from "./progress.types";

import {
  PROGRESS_STATUS,
  COMPLETION_SOURCE,
} from "./progress.constants";

/**
 * Progress Schema
 */
const progressSchema = new Schema<
  IProgress,
  ProgressModel
>(
  {
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },

    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(
        PROGRESS_STATUS
      ),
      default:
        PROGRESS_STATUS.NOT_STARTED,
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPosition: {
      type: Number,
      default: 0,
      min: 0,
    },

    quizScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    completionSource: {
      type: String,
      enum: Object.values(
        COMPLETION_SOURCE
      ),
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    lastAccessedAt: {
      type: Date,
      default: null,
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
 * One Progress Record
 * Per Enrollment + Lesson
 */
progressSchema.index(
  {
    enrollment: 1,
    lesson: 1,
  },
  {
    unique: true,
  }
);

/**
 * Frequently Used Filters
 */
progressSchema.index({
  status: 1,
});

progressSchema.index({
  lesson: 1,
});

progressSchema.index({
  enrollment: 1,
});

/**
 * Recent Learning Activity
 */
progressSchema.index({
  lastAccessedAt: -1,
});

/**
 * Export Model
 */
export const Progress =
  models.Progress ||
  model<IProgress, ProgressModel>(
    "Progress",
    progressSchema
  );