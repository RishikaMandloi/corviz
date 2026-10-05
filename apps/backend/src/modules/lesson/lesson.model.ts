import {
  Schema,
  model,
  models,
} from "mongoose";

import {
  ILesson,
} from "./lesson.types";

import {
  LESSON_CONTENT_TYPE,
  LESSON_STATUS,
} from "./lesson.constants";

/**
 * Lesson Resource Schema
 */
const lessonResourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const lessonSchema = new Schema<ILesson>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    content: {
      type: String,
      required: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    estimatedDuration: {
      type: Number,
      required: true,
      min: 1,
    },

    contentType: {
      type: String,
      enum: Object.values(
        LESSON_CONTENT_TYPE
      ),
      required: true,
    },

    resources: {
      type: [lessonResourceSchema],
      default: [],
    },

    status: {
      type: String,
      enum: Object.values(
        LESSON_STATUS
      ),
      default: LESSON_STATUS.DRAFT,
    },

    isFreePreview: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Compound Unique Index
 *
 * Same slug can exist
 * in different courses.
 */
lessonSchema.index(
  {
    course: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

/**
 * Lesson Ordering
 */
lessonSchema.index({
  course: 1,
  order: 1,
});

/**
 * Search
 */
lessonSchema.index({
  title: "text",
  shortDescription: "text",
});

export const Lesson =
  models.Lesson ||
  model<ILesson>(
    "Lesson",
    lessonSchema
  );