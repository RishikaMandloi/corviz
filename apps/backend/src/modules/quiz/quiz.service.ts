import { AppError } from "../../errors";

import { Lesson } from "../lesson/lesson.model";

import { Quiz } from "./quiz.model";
import { IQuiz } from "./quiz.types";

class QuizService {
  /**
   * Validate Quiz Questions
   */
  private validateQuestions(
    questions: IQuiz["questions"]
  ): void {
    const uniqueQuestions =
      new Set<string>();

    for (const question of questions) {
      /**
       * Question text
       */
      const normalizedQuestion =
        question.question
          .trim()
          .toLowerCase();

      if (
        uniqueQuestions.has(
          normalizedQuestion
        )
      ) {
        throw new AppError(
          "Duplicate quiz question found.",
          400
        );
      }

      uniqueQuestions.add(
        normalizedQuestion
      );

      /**
       * Minimum options
       */
      if (question.options.length < 2) {
        throw new AppError(
          "Each question must contain at least 2 options.",
          400
        );
      }

      /**
       * Validate option IDs
       */
      const optionIds =
        question.options.map(
          (option) => option.id
        );

      const uniqueOptionIds =
        new Set(optionIds);

      if (
        uniqueOptionIds.size !==
        optionIds.length
      ) {
        throw new AppError(
          "Option IDs must be unique within a question.",
          400
        );
      }

      /**
       * Correct answers required
       */
      if (
        question.correctAnswers.length === 0
      ) {
        throw new AppError(
          "Each question must contain at least one correct answer.",
          400
        );
      }

      /**
       * Validate correct answer IDs
       */
      for (
        const correctAnswerId
        of question.correctAnswers
      ) {
        if (
          !uniqueOptionIds.has(
            correctAnswerId
          )
        ) {
          throw new AppError(
            "A correct answer does not match any option in the question.",
            400
          );
        }
      }

      /**
       * SINGLE_CHOICE
       */
      if (
        question.questionType ===
        "SINGLE_CHOICE"
      ) {
        if (
          question.correctAnswers.length !== 1
        ) {
          throw new AppError(
            "Single choice questions must have exactly one correct answer.",
            400
          );
        }
      }

      /**
       * MULTIPLE_CHOICE
       */
      if (
        question.questionType ===
        "MULTIPLE_CHOICE"
      ) {
        if (
          question.correctAnswers.length < 1
        ) {
          throw new AppError(
            "Multiple choice questions must have at least one correct answer.",
            400
          );
        }
      }
    }
  }

  /**
   * Create Quiz
   */
  async createQuiz(
    payload: IQuiz
  ) {
    /**
     * Verify Lesson
     */
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

    /**
     * One Quiz Per Lesson
     */
    const existingQuiz =
      await Quiz.findOne({
        lesson: payload.lesson,
      });

    if (existingQuiz) {
      throw new AppError(
        "A quiz already exists for this lesson.",
        409
      );
    }

    /**
     * Validate Questions
     */
    this.validateQuestions(
      payload.questions
    );

    /**
     * Create Quiz
     */
    return await Quiz.create(
      payload
    );
  }

  /**
   * Get All Quizzes
   */
  async getQuizzes() {
    return await Quiz.find()
      .populate(
        "lesson",
        "title slug"
      )
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Get Quiz By ID
   */
  async getQuizById(
    id: string
  ) {
    const quiz =
      await Quiz.findById(id)
        .populate(
          "lesson",
          "title slug"
        );

    if (!quiz) {
      throw new AppError(
        "Quiz not found.",
        404
      );
    }

    return quiz;
  }

  /**
   * Update Quiz
   */
  async updateQuiz(
    id: string,
    payload: Partial<IQuiz>
  ) {
    const quiz =
      await Quiz.findById(id);

    if (!quiz) {
      throw new AppError(
        "Quiz not found.",
        404
      );
    }

    /**
     * Lesson validation
     */
    if (payload.lesson) {
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

      /**
       * Prevent duplicate quiz
       */
      const duplicateQuiz =
        await Quiz.findOne({
          lesson: payload.lesson,
          _id: {
            $ne: id,
          },
        });

      if (duplicateQuiz) {
        throw new AppError(
          "Another quiz already exists for this lesson.",
          409
        );
      }
    }

    /**
     * Question validation
     */
    if (payload.questions) {
      this.validateQuestions(
        payload.questions
      );
    }

    /**
     * createdBy cannot be changed
     */
    if (
      payload.createdBy !== undefined
    ) {
      throw new AppError(
        "createdBy cannot be updated.",
        400
      );
    }

    Object.assign(
      quiz,
      payload
    );

    await quiz.save();

    return quiz;
  }

  /**
   * Delete Quiz
   */
  async deleteQuiz(
    id: string
  ) {
    const quiz =
      await Quiz.findById(id);

    if (!quiz) {
      throw new AppError(
        "Quiz not found.",
        404
      );
    }

    await quiz.deleteOne();
  }
}

export const quizService =
  new QuizService();