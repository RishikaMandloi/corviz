import { HydratedDocument, Model, Types } from "mongoose";

import {
  LessonContentType,
  LessonStatus,
} from "./lesson.constants";

/**
 * Lesson Resource
 */
export interface ILessonResource {
  title: string;
  url: string;
}

/**
 * Lesson Properties
 */
export interface ILesson {
  course: Types.ObjectId;

  title: string;

  slug: string;

  shortDescription: string;

  content: string;

  order: number;

  estimatedDuration: number;

  contentType: LessonContentType;

  resources: ILessonResource[];

  status: LessonStatus;

  isFreePreview: boolean;

  createdBy: Types.ObjectId;

  updatedBy?: Types.ObjectId;
}

/**
 * Lesson Document
 */
export type LessonDocument =
  HydratedDocument<ILesson>;

  /**
 * Lesson Model
 */
export interface LessonModel
  extends Model<ILesson> {}