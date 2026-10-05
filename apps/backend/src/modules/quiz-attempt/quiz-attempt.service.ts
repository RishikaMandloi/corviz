import { Types } from "mongoose";

import { AppError } from "../../errors";

import { Quiz } from "../quiz/quiz.model";
import { Lesson } from "../lesson/lesson.model";
import { Enrollment } from "../enrollment/enrollment.model";
import { QuizAttempt } from "./quiz-attempt.model";

import {
  QUIZ_ATTEMPT_STATUS,
  QUIZ_ATTEMPT_RESULT,
} from "./quiz-attempt.constants";

import {
  IQuizAttemptAnswer,
} from "./quiz-attempt.types";

import {
  IQuizQuestion,
} from "../quiz/quiz.types";

class QuizAttemptService {
  /**
   * Start Quiz Attempt
   */
  async startQuizAttempt(
    quizId: string,
    userId: string
  ) {
    if (
      !Types.ObjectId.isValid(quizId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new AppError(
        "Invalid quiz or user ID.",
        400
      );
    }

    const quiz =
      await Quiz.findById(quizId);

    if (!quiz) {
      throw new AppError(
        "Quiz not found.",
        404
      );
      
    }
    if (quiz.status !== "PUBLISHED") {
  throw new AppError(
    "This quiz is not available for attempting.",
    403
  );
}

    const lesson =
      await Lesson.findById(quiz.lesson);

    if (!lesson) {
      throw new AppError(
        "Lesson associated with this quiz was not found.",
        404
      );
    }

    const enrollment =
      await Enrollment.findOne({
        user: userId,
        course: lesson.course,
        status: "ENROLLED",
      });

    if (!enrollment) {
      throw new AppError(
        "You must be enrolled in this course before attempting the quiz.",
        403
      );
    }

    const activeAttempt =
      await QuizAttempt.findOne({
        quiz: quiz._id,
        user: userId,
        status:
          QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
      });

    if (activeAttempt) {
      throw new AppError(
        "You already have an active attempt for this quiz.",
        409
      );
    }

    const attempt =
      await QuizAttempt.create({
        quiz: quiz._id,
        user: userId,
        enrollment: enrollment._id,
        answers: [],
        status:
          QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
        startedAt: new Date(),
      });

    return attempt;
  }

  /**
   * Submit Quiz Attempt
   */
  async submitQuizAttempt(
    attemptId: string,
    userId: string,
    answers: IQuizAttemptAnswer[]
  ) {
    /**
     * Validate IDs
     */
    if (
      !Types.ObjectId.isValid(attemptId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new AppError(
        "Invalid attempt or user ID.",
        400
      );
    }

    

    /**
     * Find Attempt
     */
    const attempt =
      await QuizAttempt.findById(
        attemptId
      );

    if (!attempt) {
      throw new AppError(
        "Quiz attempt not found.",
        404
      );
    }

     /**
   * Security:
   * User can submit only their own attempt.
   */
  if (
    attempt.user.toString() !== userId
  ) {
    throw new AppError(
      "You are not authorized to submit this quiz attempt.",
      403
    );
  }

  /**
   * Attempt must be active.
   */
  if (
    attempt.status !==
    QUIZ_ATTEMPT_STATUS.IN_PROGRESS
  ) {
    throw new AppError(
      "This quiz attempt is no longer active.",
      400
    );
  }


    /**
     * Ownership Check
     */
    if (
      attempt.user.toString() !==
      userId
    ) {
      throw new AppError(
        "You are not authorized to submit this quiz attempt.",
        403
      );
    }

    /**
     * Attempt Status Check
     */
    if (
      attempt.status !==
      QUIZ_ATTEMPT_STATUS.IN_PROGRESS
    ) {
      throw new AppError(
        "This quiz attempt has already been submitted.",
        409
      );
    }

    /**
     * Find Quiz
     */
    const quiz =
      await Quiz.findById(attempt.quiz);

    if (!quiz) {
      throw new AppError(
        "Quiz not found.",
        404
      );
    }

      /**
   * Validate submitted answers.
   */
  if (!answers.length) {
    throw new AppError(
      "At least one answer is required.",
      400
    );
  }

    let score = 0;

    /**
     * Evaluate Answers
     */
    const evaluatedAnswers =
      quiz.questions.map(
        (question: IQuizQuestion) => {
            const questionId = question._id;

        if (!questionId) {
         throw new AppError(
           "Quiz question ID is missing.",
           500
         );
       }
          const submittedAnswer =
            answers.find(
              (answer: IQuizAttemptAnswer) =>
                answer.questionId.toString() ===
                questionId.toString()
            );

          if (!submittedAnswer) {
            throw new AppError(
              `Answer missing for question: ${questionId}`,
              400
            );
          }

          const correctAnswers =
            question.correctAnswers
              .map((answer:string) =>
                answer.toString()
              )
              .sort();

          const selectedAnswers =
            submittedAnswer.selectedAnswers
              .map(
              (answer: Types.ObjectId) =>
                answer.toString()
              )
              .sort();

          /**
           * Compare selected answers
           * with correct answers
           */
          const isCorrect =
            correctAnswers.length ===
              selectedAnswers.length &&
            correctAnswers.every(
              (
              answer: string,
              index: number
            ) =>
              answer ===
              selectedAnswers[index]
          );

          /**
           * Increase score
           */
          if (isCorrect) {
            score++;
          }

          return {
            questionId,

            selectedAnswers:
              submittedAnswer.selectedAnswers,

            isCorrect,

            marksObtained:
              isCorrect ? 1 : 0,
          };
        }
      );

    /**
     * Calculate Percentage
     */
    const totalQuestions =
    quiz.questions.length;

  const percentage =
    totalQuestions > 0
      ? (score / totalQuestions) * 100
      : 0;

/**
   * Determine Result
   */
  const result =
  percentage >= quiz.passingScore
    ? QUIZ_ATTEMPT_RESULT.PASS
    : QUIZ_ATTEMPT_RESULT.FAIL;

    /**
     * Update Attempt
     */
    attempt.answers =
      evaluatedAnswers;

    attempt.score = score;

    attempt.percentage =
      percentage;

    attempt.result =
      result;

    attempt.status =
      QUIZ_ATTEMPT_STATUS.SUBMITTED;

    attempt.submittedAt =
      new Date();

    attempt.evaluatedAt =
      new Date();

    /**
     * Save Attempt
     */
    await attempt.save();

    return attempt;
  }

  /**
 * Get Current User's Quiz Attempts
 */
async getMyQuizAttempts(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(
      "Invalid user ID.",
      400
    );
  }

  return await QuizAttempt.find({
    user: userId,
  })
    .populate("quiz", "title description passingScore")
    .populate(
      "enrollment",
      "course status progress"
    )
    .sort({
      createdAt: -1,
    });
}

/**
 * Get Single Quiz Attempt
 */
async getQuizAttemptById(
  attemptId: string,
  userId: string,
  role: string
) {
  if (
    !Types.ObjectId.isValid(attemptId)
  ) {
    throw new AppError(
      "Invalid quiz attempt ID.",
      400
    );
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(
      "Invalid user ID.",
      400
    );
  }

  const attempt =
    await QuizAttempt.findById(attemptId)
      .populate(
        "quiz",
        "title description passingScore timeLimit"
      )
      .populate(
        "enrollment",
        "course status progress"
      );

  if (!attempt) {
    throw new AppError(
      "Quiz attempt not found.",
      404
    );
  }

  /**
   * Ownership Check
   *
   * USER:
   * Can access only their own attempt.
   *
   * ADMIN:
   * Can access any attempt.
   */
  if (
    role !== "ADMIN" &&
    attempt.user.toString() !== userId
  ) {
    throw new AppError(
      "You are not authorized to access this quiz attempt.",
      403
    );
  }

  return attempt;
}

/**
 * Get Active Quiz Attempt
 */
async getActiveQuizAttempt(
  quizId: string,
  userId: string
) {
  if (
    !Types.ObjectId.isValid(quizId) ||
    !Types.ObjectId.isValid(userId)
  ) {
    throw new AppError(
      "Invalid quiz or user ID.",
      400
    );
  }

  const attempt =
    await QuizAttempt.findOne({
      quiz: quizId,
      user: userId,
      status:
        QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
    })
      .populate(
        "quiz",
        "title description passingScore timeLimit questions"
      )
      .populate(
        "enrollment",
        "course status progress"
      );

  if (!attempt) {
    throw new AppError(
      "No active quiz attempt found.",
      404
    );
  }

  return attempt;
}
}
export const quizAttemptService =
  new QuizAttemptService();