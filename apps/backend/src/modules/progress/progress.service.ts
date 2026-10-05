import { Types } from "mongoose";

import { AppError } from "../../errors";

import { Enrollment } from "../enrollment/enrollment.model";
import { Lesson } from "../lesson/lesson.model";

import { Progress } from "./progress.model";
import { IProgress } from "./progress.types";
import { enrollmentService } from "../enrollment/enrollment.service";

import {
  COMPLETION_SOURCE,
  PROGRESS_STATUS,
} from "./progress.constants";

import { USER_ROLES, UserRole } from "../../constants";

class ProgressService {
  /**
   * Create Progress
   */
  async createProgress(
    payload: Pick<IProgress, "enrollment" | "lesson">,
    userId: string,
    role: UserRole
  ) {
    const enrollment =
      await Enrollment.findById(
        payload.enrollment
      );

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    /**
     * Ownership Check
     *
     * Student can create progress
     * only for their own enrollment.
     *
     * Admin can access any enrollment.
     */
    if (
      role !== USER_ROLES.ADMIN &&
      enrollment.user.toString() !== userId
    ) {
      throw new AppError(
        "You are not authorized to access this enrollment.",
        403
      );
    }

    const lesson =
      await Lesson.findById(
        payload.lesson
      );

    if (!lesson) {
      throw new AppError(
        "Lesson not found.",
        404
      );
    }

    const existingProgress =
      await Progress.findOne({
        enrollment:
          payload.enrollment,
        lesson:
          payload.lesson,
      });

    if (existingProgress) {
      throw new AppError(
        "Progress already exists for this lesson.",
        409
      );
    }

    return Progress.create({
      enrollment:
        new Types.ObjectId(
          payload.enrollment
        ),

      lesson:
        new Types.ObjectId(
          payload.lesson
        ),

      status:
        PROGRESS_STATUS.NOT_STARTED,

      progressPercentage: 0,

      timeSpent: 0,

      lastPosition: 0,

      startedAt: null,

      lastAccessedAt: null,

      completedAt: null,

      completionSource: null,
    });
  }

  /**
   * Get Progress By Enrollment
   */
  async getProgressByEnrollment(
    enrollmentId: string,
    userId: string,
    role: UserRole
  ) {
    const enrollment =
      await Enrollment.findById(
        enrollmentId
      );

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    /**
     * Ownership Check
     */
    if (
      role !== USER_ROLES.ADMIN &&
      enrollment.user.toString() !== userId
    ) {
      throw new AppError(
        "You are not authorized to access this enrollment.",
        403
      );
    }

    return Progress.find({
      enrollment: enrollmentId,
    })
      .populate(
        "lesson",
        "title slug order"
      )
      .sort({
        createdAt: 1,
      });
  }

  /**
 * Get Progress Summary
 */
/**
 * Get Progress Summary
 */
async getProgressSummary(
  enrollmentId: string,
  userId: string,
  role: UserRole
) {
  const enrollment =
    await Enrollment.findById(
      enrollmentId
    );

  if (!enrollment) {
    throw new AppError(
      "Enrollment not found.",
      404
    );
  }

  /**
   * Ownership Check
   */
  if (
    role !== USER_ROLES.ADMIN &&
    enrollment.user.toString() !== userId
  ) {
    throw new AppError(
      "You are not authorized to access this enrollment.",
      403
    );
  }

  /**
   * Fetch Progress Records
   */
  const progressRecords =
    await Progress.find({
      enrollment: enrollmentId,
    })
      .populate(
        "lesson",
        "title slug order estimatedDuration"
      )
      .sort({
        createdAt: 1,
      });

  /**
   * Total Published Lessons
   */
  const totalLessons =
    await Lesson.countDocuments({
      course: enrollment.course,
      status: "PUBLISHED",
    });

  /**
   * Lesson Status Counts
   */
  const completedLessons =
    progressRecords.filter(
      (progress) =>
        progress.status ===
        PROGRESS_STATUS.COMPLETED
    ).length;

  const inProgressLessons =
    progressRecords.filter(
      (progress) =>
        progress.status ===
        PROGRESS_STATUS.IN_PROGRESS
    ).length;

  const notStartedLessons =
    progressRecords.filter(
      (progress) =>
        progress.status ===
        PROGRESS_STATUS.NOT_STARTED
    ).length;

  const trackedLessons =
    progressRecords.length;

  const untrackedLessons =
    Math.max(
      0,
      totalLessons - trackedLessons
    );

  /**
   * Overall Course Progress
   */
  const overallPercentage =
    totalLessons > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (completedLessons /
                totalLessons) *
                100
            )
          )
        )
      : 0;

  /**
   * Average Lesson Progress
   */
  const averageProgressPercentage =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce(
            (total, progress) =>
              total +
              progress.progressPercentage,
            0
          ) /
            progressRecords.length
        )
      : 0;

  const normalizedAverageProgress =
    Math.min(
      100,
      Math.max(
        0,
        averageProgressPercentage
      )
    );

  /**
   * Total Time Spent
   */
  const totalTimeSpent =
    progressRecords.reduce(
      (total, progress) =>
        total + progress.timeSpent,
      0
    );

  /**
   * Completion Rate
   */
  const completionRate =
    totalLessons > 0
      ? Math.round(
          (completedLessons /
            totalLessons) *
            100
        )
      : 0;

  /**
   * Last Accessed Lesson
   */
  const lastAccessedProgress =
    progressRecords
      .filter(
        (progress) =>
          progress.lastAccessedAt
      )
      .sort(
        (a, b) =>
          new Date(
            b.lastAccessedAt!
          ).getTime() -
          new Date(
            a.lastAccessedAt!
          ).getTime()
      )[0];

  /**
   * Lesson Progress Breakdown
   */
  const lessonProgress =
    progressRecords.map(
      (progress) => ({
        lesson: progress.lesson,
        status: progress.status,
        progressPercentage:
          progress.progressPercentage,
        timeSpent:
          progress.timeSpent,
        lastPosition:
          progress.lastPosition,
        quizScore:
          progress.quizScore,
        completedAt:
          progress.completedAt,
      })
    );

  /**
   * Enrollment Stored Progress
   */
  const enrollmentProgress =
    Math.min(
      100,
      Math.max(
        0,
        enrollment.progress
      )
    );

  return {
    enrollmentId,

    totalLessons,

    trackedLessons,

    completedLessons,

    inProgressLessons,

    notStartedLessons,

    untrackedLessons,

    overallPercentage,

    enrollmentProgress,

    averageProgressPercentage:
      normalizedAverageProgress,

    completionRate,

    totalTimeSpent,

    lessonProgress,

    lastAccessedLesson:
      lastAccessedProgress?.lesson ||
      null,
  };
}

/**
 * Get Progress Analytics
 */
async getProgressAnalytics(
  enrollmentId: string,
  userId: string,
  role: UserRole
) {
  const enrollment =
    await Enrollment.findById(
      enrollmentId
    );

  if (!enrollment) {
    throw new AppError(
      "Enrollment not found.",
      404
    );
  }

  /**
   * Ownership Check
   */
  if (
    role !== USER_ROLES.ADMIN &&
    enrollment.user.toString() !== userId
  ) {
    throw new AppError(
      "You are not authorized to access this enrollment.",
      403
    );
  }

  const progressRecords =
    await Progress.find({
      enrollment: enrollmentId,
    })
      .populate(
        "lesson",
        "title slug order estimatedDuration"
      )
      .sort({
        "lesson.order": 1,
      });

  const totalLessons =
    await Lesson.countDocuments({
      course: enrollment.course,
      status: "PUBLISHED",
    });

  const completed =
    progressRecords.filter(
      (progress) =>
        progress.status ===
        PROGRESS_STATUS.COMPLETED
    ).length;

  const inProgress =
    progressRecords.filter(
      (progress) =>
        progress.status ===
        PROGRESS_STATUS.IN_PROGRESS
    ).length;

  const notStarted =
    Math.max(
      0,
      totalLessons -
        completed -
        inProgress
    );

  const totalTimeSpent =
    progressRecords.reduce(
      (total, progress) =>
        total + progress.timeSpent,
      0
    );

  const overallProgress =
    totalLessons > 0
      ? Math.round(
          (completed /
            totalLessons) *
            100
        )
      : 0;

  const averageLessonProgress =
    progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce(
            (total, progress) =>
              total +
              progress.progressPercentage,
            0
          ) /
            progressRecords.length
        )
      : 0;

  const completionRate =
    totalLessons > 0
      ? Math.round(
          (completed /
            totalLessons) *
            100
        )
      : 0;

  const completedTime =
    progressRecords
      .filter(
        (progress) =>
          progress.status ===
          PROGRESS_STATUS.COMPLETED
      )
      .reduce(
        (total, progress) =>
          total + progress.timeSpent,
        0
      );

  const averageTimePerCompletedLesson =
    completed > 0
      ? Math.round(
          completedTime / completed
        )
      : 0;

  return {
    enrollmentId,

    totalLessons,

    completedLessons: completed,

    inProgressLessons: inProgress,

    notStartedLessons: notStarted,

    overallProgress,

    averageLessonProgress,

    completionRate,

    totalTimeSpent,

    averageTimePerCompletedLesson,

    enrollmentProgress:
      enrollment.progress,

    enrollmentStatus:
      enrollment.status,
  };
}

  /**
   * Get Progress By ID
   */
  async getProgressById(
    id: string,
    userId: string,
    role: UserRole
  ) {
    const progress =
      await Progress.findById(id)
        .populate("lesson")
        .populate("enrollment");

    if (!progress) {
      throw new AppError(
        "Progress not found.",
        404
      );
    }

    /**
     * Enrollment Ownership Check
     */
    const enrollment =
      await Enrollment.findById(
        progress.enrollment
      );

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    if (
      role !== USER_ROLES.ADMIN &&
      enrollment.user.toString() !== userId
    ) {
      throw new AppError(
        "You are not authorized to access this progress.",
        403
      );
    }

    return progress;
  }

  /**
   * Update Progress
   */
 async updateProgress(
  id: string,
  payload: Partial<IProgress>,
  userId: string,
  role: UserRole
) {
  const progress =
    await Progress.findById(id);

  if (!progress) {
    throw new AppError(
      "Progress not found.",
      404
    );
  }

  /**
   * Find Enrollment
   */
  const enrollment =
    await Enrollment.findById(
      progress.enrollment
    );

  if (!enrollment) {
    throw new AppError(
      "Enrollment not found.",
      404
    );
  }

  /**
   * Ownership Check
   */
  if (
    role !== USER_ROLES.ADMIN &&
    enrollment.user.toString() !== userId
  ) {
    throw new AppError(
      "You are not authorized to update this progress.",
      403
    );
  }

  /**
   * Prevent changing protected references
   */
  if (
    payload.enrollment !== undefined
  ) {
    throw new AppError(
      "Enrollment cannot be changed.",
      400
    );
  }

  if (
    payload.lesson !== undefined
  ) {
    throw new AppError(
      "Lesson cannot be changed.",
      400
    );
  }

  if (
  payload.completionSource !== undefined &&
  payload.completionSource !==
    progress.completionSource
) {
  throw new AppError(
    "Completion source cannot be changed manually.",
    400
  );
}

if (
  payload.quizScore !== undefined
) {
  throw new AppError(
    "Quiz score cannot be changed manually.",
    400
  );
}


if (
  payload.startedAt !== undefined
) {
  throw new AppError(
    "Started time cannot be changed manually.",
    400
  );
}

if (
  payload.completedAt !== undefined
) {
  throw new AppError(
    "Completed time cannot be changed manually.",
    400
  );
}
if (
  payload.lastAccessedAt !== undefined
) {
  throw new AppError(
    "Last accessed time cannot be changed manually.",
    400
  );
}
  

  /**
   * Validate percentage from incoming payload
   */
  if (
    payload.progressPercentage !==
      undefined &&
    (
      payload.progressPercentage < 0 ||
      payload.progressPercentage > 100
    )
  ) {
    throw new AppError(
      "Progress percentage must be between 0 and 100.",
      400
    );
  }

 

  if (
  payload.status ===
    PROGRESS_STATUS.IN_PROGRESS &&
  payload.progressPercentage === 100
) {
  throw new AppError(
    "In-progress status cannot have 100% progress.",
    400
  );
}

  /**
 * Time & Position Integrity
 */
if (
  payload.timeSpent !== undefined &&
  payload.timeSpent < progress.timeSpent
) {
  throw new AppError(
    "Time spent cannot be decreased.",
    400
  );
}

if (
  payload.lastPosition !== undefined &&
  payload.lastPosition < progress.lastPosition
) {
  throw new AppError(
    "Last position cannot be decreased.",
    400
  );
}
  /**
   * Apply update
   */
  Object.assign(
    progress,
    payload
  );

  /**
   * First Lesson Access
   */
  if (
    progress.progressPercentage > 0 &&
    !progress.startedAt
  ) {
    progress.startedAt =
      new Date();
  }

  /**
   * Automatic Status Management
   */
  if (
    progress.progressPercentage === 0
  ) {
    progress.status =
      PROGRESS_STATUS.NOT_STARTED;

    progress.completedAt =
      null;

    progress.completionSource =
      null;
  }

  if (
    progress.progressPercentage > 0 &&
    progress.progressPercentage < 100
  ) {
    progress.status =
      PROGRESS_STATUS.IN_PROGRESS;

    progress.completedAt =
      null;
  }

  /**
   * Automatic Completion
   */
  if (
  progress.progressPercentage >= 100
) {
  progress.progressPercentage = 100;

  progress.status =
    PROGRESS_STATUS.COMPLETED;

  progress.completedAt =
    progress.completedAt ||
    new Date();

  if (
    !progress.completionSource
  ) {
    progress.completionSource =
      COMPLETION_SOURCE.SYSTEM;
  }
}
  /**
   * Last Access Time
   */
  progress.lastAccessedAt =
    new Date();

  /**
   * Final consistency validation
   */
  if (
    progress.status ===
      PROGRESS_STATUS.COMPLETED &&
    progress.progressPercentage !== 100
  ) {
    throw new AppError(
      "Completed progress must have 100% progress.",
      400
    );
  }

  
  /**
   * Sync Enrollment
   */
await progress.save();

// console.log(
//   "SYNCING ENROLLMENT:",
//   progress.enrollment.toString(),
//   progress.lesson.toString(),
//   progress.status
// );

await enrollmentService.syncLessonCompletion(
  progress.enrollment.toString(),
  progress.lesson.toString(),
  progress.status === PROGRESS_STATUS.COMPLETED
);

// console.log("ENROLLMENT SYNC COMPLETED");

return progress;
}

  /**
   * Delete Progress
   */
 async deleteProgress(
  id: string,
  _userId: string,
  role: UserRole
) {
  const session =
    await Progress.startSession();

  try {
    session.startTransaction();

    const progress =
      await Progress.findById(id).session(
        session
      );

    if (!progress) {
      throw new AppError(
        "Progress not found.",
        404
      );
    }

    const enrollment =
      await Enrollment.findById(
        progress.enrollment
      ).session(session);

    if (!enrollment) {
      throw new AppError(
        "Enrollment not found.",
        404
      );
    }

    /**
     * Only Admin Can Delete
     */
    if (
      role !== USER_ROLES.ADMIN
    ) {
      throw new AppError(
        "You are not authorized to delete progress.",
        403
      );
    }

    await progress.deleteOne({
      session,
    });

    await enrollmentService.syncLessonCompletion(
      progress.enrollment.toString(),
      progress.lesson.toString(),
      false,
      session
    );

    await session.commitTransaction();

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
}

export const progressService =
  new ProgressService();