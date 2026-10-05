import { Types } from "mongoose";

import {
  CourseDifficulty,
  CourseStatus,
  CourseVisibility,
} from "./course.constants";

/**
 * Course Learning Objective
 */
export interface CourseLearningObjective {
  title: string;
}

/**
 * Course Prerequisite
 */
export interface CoursePrerequisite {
  title: string;
}

/**
 * Course Domain Model
 */
export interface ICourse {
  title: string;

  slug: string;

  shortDescription: string;

  description: string;

  thumbnail: string;

  category: string;

  difficulty: CourseDifficulty;

  estimatedDuration: number;

  learningObjectives: CourseLearningObjective[];

  prerequisites: CoursePrerequisite[];

  status: CourseStatus;

  visibility: CourseVisibility;

  createdBy: Types.ObjectId;

  updatedBy?: Types.ObjectId;
}