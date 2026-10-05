import { Schema, model } from "mongoose";

import {
  COURSE_DIFFICULTY,
  COURSE_STATUS,
  COURSE_VISIBILITY,
} from "./course.constants";

import { ICourse } from "./course.types";

import { models } from "mongoose";



  /**
 * Learning Objective Schema
 */
const learningObjectiveSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
  },
  {
    _id: false,
  }
);


/**
 * Course Prerequisite Schema
 */
const prerequisiteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
  },
  {
    _id: false,
  }
);

const courseSchema = new Schema<ICourse>(
  {
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
      unique: true,
      trim: true,
      lowercase: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: Object.values(COURSE_DIFFICULTY),
      required: true,
    },

    estimatedDuration: {
      type: Number,
      required: true,
      min: 1,
    },

    learningObjectives: {
  type: [learningObjectiveSchema],
  default: [],
},

    prerequisites: {
  type: [prerequisiteSchema],
  default: [],
},

    status: {
      type: String,
      enum: Object.values(COURSE_STATUS),
      default: COURSE_STATUS.DRAFT,
    },

    visibility: {
      type: String,
      enum: Object.values(COURSE_VISIBILITY),
      default: COURSE_VISIBILITY.PRIVATE,
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

// /**
//  * Database Indexes
//  */

// // Unique slug
// courseSchema.index(
//   { slug: 1 },
//   {
//     unique: true,
//   }
// );



// Frequently used filters
courseSchema.index({
  category: 1,
  difficulty: 1,
  status: 1,
});

// Search optimization
courseSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
});

export const Course =
  models.Course ||
  model<ICourse>("Course", courseSchema);