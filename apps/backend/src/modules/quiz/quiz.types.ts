import {
  HydratedDocument,
  Model,
  Types,
} from "mongoose";

import {
  BloomLevel,
  QuestionDifficulty,
  QuestionType,
  QuizStatus,
} from "./quiz.constants";

/**
 * Quiz Option
 */
export interface IQuestionOption {
  id: string;
  text: string;
}

/**
 * Quiz Question
 */
export interface IQuizQuestion {
  _id?: Types.ObjectId;

  question: string;

  explanation: string;

  difficulty: QuestionDifficulty;

  bloomLevel: BloomLevel;

  questionType: QuestionType;

  options: IQuestionOption[];

  correctAnswers: string[];
}

/**
 * Quiz Properties
 */
export interface IQuiz {
  lesson: Types.ObjectId;

  title: string;

  description: string;

  passingScore: number;

  timeLimit: number;

  shuffleQuestions: boolean;

  shuffleOptions: boolean;

  status: QuizStatus;

  questions: IQuizQuestion[];

  createdBy: Types.ObjectId;

  updatedBy?: Types.ObjectId;
}

/**
 * Quiz Document
 */
export type QuizDocument = HydratedDocument<IQuiz>;

/**
 * Quiz Model
 */
export interface QuizModel extends Model<IQuiz> {}