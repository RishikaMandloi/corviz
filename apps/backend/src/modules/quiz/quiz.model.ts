import {
  Schema,
  model,
  models,
} from "mongoose";

import {
  IQuiz,
} from "./quiz.types";

import {
  QUIZ_STATUS,
  QUESTION_TYPE,
  QUESTION_DIFFICULTY,
  BLOOM_LEVEL,
} from "./quiz.constants";

/**
 * Quiz Option Schema
 */
const optionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
  },
  {
    _id: false,
  }
);

/**
 * Quiz Question Schema
 */
const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    explanation: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: Object.values(
        QUESTION_DIFFICULTY
      ),
      default:
        QUESTION_DIFFICULTY.MEDIUM,
    },

    bloomLevel: {
      type: String,
      enum: Object.values(
        BLOOM_LEVEL
      ),
      default:
        BLOOM_LEVEL.UNDERSTAND,
    },

    questionType: {
      type: String,
      enum: Object.values(
        QUESTION_TYPE
      ),
      default:
        QUESTION_TYPE.SINGLE_CHOICE,
    },

    options: {
      type: [optionSchema],
      default: [],
    },

    correctAnswers: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  }
);

/**
 * Quiz Schema
 */
const quizSchema =
  new Schema<IQuiz>(
    {
      lesson: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      passingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },

      timeLimit: {
        type: Number,
        required: true,
        min: 1,
      },

      shuffleQuestions: {
        type: Boolean,
        default: false,
      },

      shuffleOptions: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        enum: Object.values(
          QUIZ_STATUS
        ),
        default: QUIZ_STATUS.DRAFT,
      },

      questions: {
        type: [questionSchema],
        default: [],
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
 * One Quiz Per Lesson
 */
quizSchema.index(
  {
    lesson: 1,
  },
  {
    unique: true,
  }
);

/**
 * Search
 */
quizSchema.index({
  title: "text",
  description: "text",
});

/**
 * Quiz Model
 */
export const Quiz =
  models.Quiz ||
  model<IQuiz>(
    "Quiz",
    quizSchema
  );