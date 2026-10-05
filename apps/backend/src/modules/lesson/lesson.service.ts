import { Lesson } from "./lesson.model";
import { ILesson } from "./lesson.types";
import { AppError } from "../../errors";
import { Course } from "../course/course.model";

class LessonService {

/**
 * Create Lesson
 */
async createLesson(payload: ILesson) {
 const course = await Course.findById(payload.course);

if (!course) {
  throw new AppError(
    "Course not found.",
    404
  );
}
    
  const existingSlug =
    await Lesson.findOne({
      course: payload.course,
      slug: payload.slug,
    });

  if (existingSlug) {
    throw new AppError(
      "Lesson slug already exists in this course.",
      409
    );
  }

  const existingOrder =
    await Lesson.findOne({
      course: payload.course,
      order: payload.order,
    });

  if (existingOrder) {
    throw new AppError(
      "Lesson order already exists in this course.",
      409
    );
  }

  return Lesson.create(payload);
}

/**
 * Get Lessons
 */
async getLessons(courseId?: string) {
  const filter = courseId
    ? { course: courseId }
    : {};

  return Lesson.find(filter)
    .populate(
      "course",
      "title slug"
    )
    .sort({
      order: 1,
    });
}

/**
 * Get Lesson
 */
async getLesson(
  courseId: string,
  slug: string
) {
  const lesson =
    await Lesson.findOne({
      course: courseId,
      slug,
    });

  if (!lesson) {
    throw new AppError(
      "Lesson not found.",
      404
    );
  }

  return lesson;
}


/**
 * Update Lesson
 */
async updateLesson(
  id: string,
  payload: Partial<ILesson>
) {
  const lesson =
    await Lesson.findById(id);

  if (!lesson) {
    throw new AppError(
      "Lesson not found.",
      404
    );
  }

  if (payload.slug !== undefined) {
    throw new AppError(
      "Lesson slug cannot be updated.",
      400
    );
  }

  Object.assign(lesson, payload);

  await lesson.save();

  return lesson;
}

/**
 * Delete Lesson
 */
async deleteLesson(id: string) {
  const lesson =
    await Lesson.findById(id);

  if (!lesson) {
    throw new AppError(
      "Lesson not found.",
      404
    );
  }

  await lesson.deleteOne();
}


}

export const lessonService =
  new LessonService();