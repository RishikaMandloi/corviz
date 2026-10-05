import {
  HydratedDocument,
  Model,
  Types,
} from "mongoose";

import {
  QuizAttemptResult,
  QuizAttemptStatus,
} from "./quiz-attempt.constants";

/**
 * Submitted Answer
 */
export interface IQuizAttemptAnswer {
  questionId: Types.ObjectId;

  selectedAnswers: Types.ObjectId[];

  isCorrect?: boolean;

  marksObtained?: number;
}

/**
 * Quiz Attempt Properties
 */
export interface IQuizAttempt {
  quiz: Types.ObjectId;

  user: Types.ObjectId;

  enrollment: Types.ObjectId;

  answers: IQuizAttemptAnswer[];

  status: QuizAttemptStatus;

  score?: number;

  percentage?: number;

  result?: QuizAttemptResult;

  startedAt: Date;

  submittedAt?: Date;

  evaluatedAt?: Date;
}

/**
 * Quiz Attempt Document
 */
export type QuizAttemptDocument =
  HydratedDocument<IQuizAttempt>;

/**
 * Quiz Attempt Model
 */
export interface QuizAttemptModel
  extends Model<IQuizAttempt> {}