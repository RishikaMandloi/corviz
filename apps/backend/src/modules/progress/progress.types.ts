import {
  HydratedDocument,
  Model,
  Types,
} from "mongoose";

import {
  CompletionSource,
  ProgressStatus,
} from "./progress.constants";

/**
 * Progress Properties
 */
export interface IProgress {
  /**
   * Enrollment Reference
   */
  enrollment: Types.ObjectId;

  /**
   * Lesson Reference
   */
  lesson: Types.ObjectId;

  /**
   * Current Progress Status
   */
  status: ProgressStatus;

  /**
   * Lesson Completion %
   */
  progressPercentage: number;

  /**
   * Total Time Spent (seconds)
   */
  timeSpent: number;

  /**
   * Last Video Position (seconds)
   */
  lastPosition: number;

  /**
   * Quiz Score (0-100)
   */
  quizScore?: number;

  /**
   * Completion Source
   */
  completionSource?: CompletionSource;

  /**
   * Started Time
   */
  startedAt?: Date;

  /**
   * Last Access Time
   */
  lastAccessedAt?: Date;

  /**
   * Completion Time
   */
  completedAt?: Date;
}

/**
 * Progress Document
 */
export type ProgressDocument =
  HydratedDocument<IProgress>;

/**
 * Progress Model
 */
export interface ProgressModel
  extends Model<IProgress> {}