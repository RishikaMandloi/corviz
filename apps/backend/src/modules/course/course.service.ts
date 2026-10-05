//import { FilterQuery } from "mongoose";

import { AppError } from "../../errors";
import { Course } from "./course.model";
import { ICourse } from "./course.types";

class CourseService {
  /**
 * Create Course
 */
async createCourse(
  payload: ICourse
) {
  const existingCourse =
    await Course.findOne({
      slug: payload.slug,
    });

  if (existingCourse) {
    throw new AppError(
      "Course slug already exists.",
      409
    );
  }

  const course =
    await Course.create(payload);

  return course;
}

  /**
 * Get All Courses
 */
async getCourses(
  filter: Record<string, unknown> ={}
) {
  return Course.find(filter)
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .sort({
      createdAt: -1,
    });
}

  /**
 * Get Course By Slug
 */
async getCourseBySlug(
  slug: string
) {
  const course =
    await Course.findOne({
      slug,
    }).populate(
      "createdBy",
      "firstName lastName email"
    );

  if (!course) {
    throw new AppError(
      "Course not found.",
      404
    );
  }

  return course;
}

  /**
 * Update Course
 */
async updateCourse(
  id: string,
  payload: Partial<ICourse>
) {
  const course = await Course.findById(id);

  if (!course) {
    throw new AppError("Course not found.", 404);
  }

  /**
   * Slug cannot be updated.
   */
  if (payload.slug !== undefined) {
    throw new AppError(
      "Course slug cannot be updated.",
      400
    );
  }

  /**
   * createdBy cannot be updated.
   */
  if (payload.createdBy !== undefined) {
    throw new AppError(
      "createdBy cannot be updated.",
      400
    );
  }

  Object.assign(course, payload);

  await course.save();

  return course;
}

 /**
 * Delete Course
 */
async deleteCourse(
  id: string
) {
  const course = await Course.findById(id);

  if (!course) {
    throw new AppError(
      "Course not found.",
      404
    );
  }

  await course.deleteOne();

  return;
}
}

export const courseService = new CourseService();
