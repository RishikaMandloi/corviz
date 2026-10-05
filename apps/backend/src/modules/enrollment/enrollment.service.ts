import { Types , ClientSession} from "mongoose";

import { AppError } from "../../errors";

import { Course } from "../course/course.model";

import { Enrollment } from "./enrollment.model";
import { Lesson } from "../lesson/lesson.model";
import { IEnrollment } from "./enrollment.types";

class EnrollmentService {
  /**
   * Create Enrollment
   */
  async createEnrollment(
    userId: string,
    payload: Pick<IEnrollment, "course">
  ) {
    const course = await Course.findById(
      payload.course
    );

    if (!course) {
      throw new AppError(
        "Course not found.",
        404
      );
    }

    const existingEnrollment =
      await Enrollment.findOne({
        user: userId,
        course: payload.course,
      });

    if (existingEnrollment) {
      throw new AppError(
        "You are already enrolled in this course.",
        409
      );
    }

    return Enrollment.create({
      user: new Types.ObjectId(userId),
      course: payload.course,
      status: "ENROLLED",
      progress: 0,
      completedLessons: [],
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
    });
  }

  /**
   * Get Current User Enrollments
   */
  async getMyEnrollments(
    userId: string
  ) {
    return Enrollment.find({
      user: userId,
    })
      .populate(
        "course",
        "title slug thumbnail difficulty"
      )
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Get Enrollment By Id
   */
  async getEnrollmentById(
    id: string
  ) {
    const enrollment =
      await Enrollment.findById(id)
        .populate(
          "course"
        )
        .populate(
          "user",
          "firstName lastName email"
        );

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    return enrollment;
  }

  /**
   * Update Enrollment
   */
  async updateEnrollment(
    id: string,
    payload: Partial<IEnrollment>
  ) {
    const enrollment =
      await Enrollment.findById(id);

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    Object.assign(
      enrollment,
      payload
    );

    /**
     * Auto Complete
     */
    if (
      enrollment.progress >= 100
    ) {
      enrollment.progress = 100;
      enrollment.status =
        "COMPLETED";
      enrollment.completedAt =
        new Date();
    }

    enrollment.lastAccessedAt =
      new Date();

    await enrollment.save();

    return enrollment;
  }

  /**
   * Delete Enrollment
   */
  async deleteEnrollment(
    id: string
  ) {
    const enrollment =
      await Enrollment.findById(id);

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    await enrollment.deleteOne();
  }

  /**
 * Sync Lesson Completion
 */
async syncLessonCompletion(
  enrollmentId: string,
  lessonId: string,
  isCompleted: boolean,
  session?: ClientSession
) {
  if (
    !Types.ObjectId.isValid(enrollmentId) ||
    !Types.ObjectId.isValid(lessonId)
  ) {
    throw new AppError(
      "Invalid enrollment or lesson ID.",
      400
    );
  }

  const enrollmentQuery =
    Enrollment.findById(enrollmentId);

  if (session) {
    enrollmentQuery.session(session);
  }

  const enrollment =
    await enrollmentQuery;

  if (!enrollment) {
    throw new AppError(
      "Enrollment not found.",
      404
    );
  }

  const lessonQuery =
    Lesson.findById(lessonId);

  if (session) {
    lessonQuery.session(session);
  }

  const lesson =
    await lessonQuery;

  if (!lesson) {
    throw new AppError(
      "Lesson not found.",
      404
    );
  }

  if (
    enrollment.course.toString() !==
    lesson.course.toString()
  ) {
    throw new AppError(
      "Lesson does not belong to this course.",
      400
    );
  }

  const completedLessonIds =
    new Set<string>(
      enrollment.completedLessons.map(
        (id: Types.ObjectId | string) =>
          id.toString()
      )
    );

  if (isCompleted) {
    completedLessonIds.add(lessonId);
  } else {
    completedLessonIds.delete(lessonId);
  }

  enrollment.completedLessons =
    Array.from(completedLessonIds).map(
      (id) => new Types.ObjectId(id)
    );

  const totalLessons =
    await Lesson.countDocuments({
      course: enrollment.course,
      status: "PUBLISHED",
    }).session(session || null);

  const completedLessons =
    enrollment.completedLessons.length;

  enrollment.progress =
    totalLessons > 0
      ? Math.min(
          100,
          Math.round(
            (completedLessons /
              totalLessons) *
              100
          )
        )
      : 0;

  enrollment.lastAccessedAt =
    new Date();

  if (
    totalLessons > 0 &&
    completedLessons >= totalLessons
  ) {
    enrollment.progress = 100;
    enrollment.status = "COMPLETED";
    enrollment.completedAt =
      enrollment.completedAt ||
      new Date();
  } else {
    enrollment.status = "ENROLLED";
    enrollment.completedAt = null;
  }

  await enrollment.save(
    session
      ? { session }
      : undefined
  );

  return enrollment;
}
}

export const enrollmentService =
  new EnrollmentService();