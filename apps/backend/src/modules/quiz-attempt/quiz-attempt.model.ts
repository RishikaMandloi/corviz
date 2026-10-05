import {
  Schema,
  model,
  models,
} from "mongoose";

// //import {
//   IQuizAttempt,
// } from "./quiz-attempt.types";

import {
  QUIZ_ATTEMPT_STATUS,
  QUIZ_ATTEMPT_RESULT,
} from "./quiz-attempt.constants";

/**
 * Submitted Answer Schema
 */
const quizAttemptAnswerSchema =
  new Schema(
    {
      /**
       * MongoDB _id of the quiz question
       */
      questionId: {
        type: Schema.Types.ObjectId,
        required: true,
      },

      /**
       * Option IDs selected by the user.
       *
       * Quiz option IDs are strings,
       * not MongoDB ObjectIds.
       */
      selectedAnswers: {
        type: [String],
        default: [],
      },

      /**
       * Set by backend after evaluation.
       */
      isCorrect: {
        type: Boolean,
        default: undefined,
      },

      /**
       * Set by backend after evaluation.
       */
      marksObtained: {
        type: Number,
        min: 0,
        default: undefined,
      },
    },
    {
      _id: false,
    }
  );

/**
 * Quiz Attempt Schema
 */
const quizAttemptSchema =
  new Schema(
    {
      quiz: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
        required: true,
        index: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      enrollment: {
        type: Schema.Types.ObjectId,
        ref: "Enrollment",
        required: true,
        index: true,
      },

      answers: {
        type: [quizAttemptAnswerSchema],
        default: [],
      },

      status: {
        type: String,
        enum: Object.values(
          QUIZ_ATTEMPT_STATUS
        ),
        default:
          QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
        required: true,
        index: true,
      },

      score: {
        type: Number,
        min: 0,
      },

      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },

      result: {
        type: String,
        enum: Object.values(
          QUIZ_ATTEMPT_RESULT
        ),
      },

      startedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },

      submittedAt: {
        type: Date,
      },

      evaluatedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

/**
 * Query indexes
 */
quizAttemptSchema.index({
  user: 1,
  quiz: 1,
});

quizAttemptSchema.index({
  enrollment: 1,
  createdAt: -1,
});

/**
 * Quiz Attempt Model
 */
export const QuizAttempt =
  models.QuizAttempt ||
  model(
    "QuizAttempt",
    quizAttemptSchema
  );