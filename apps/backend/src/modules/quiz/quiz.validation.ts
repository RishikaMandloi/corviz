import { z } from "zod";

import {
  BLOOM_LEVEL,
  QUESTION_DIFFICULTY,
  QUESTION_TYPE,
  QUIZ_STATUS,
} from "./quiz.constants";

/**
 * Quiz Option Validation
 */
const optionSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Option ID is required.")
    .max(100, "Option ID cannot exceed 100 characters."),

  text: z
    .string()
    .trim()
    .min(1, "Option text is required.")
    .max(
      300,
      "Option text cannot exceed 300 characters."
    ),
});

/**
 * Quiz Question Validation
 */
const questionSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(
        10,
        "Question must be at least 10 characters."
      )
      .max(
        1000,
        "Question cannot exceed 1000 characters."
      ),

    explanation: z
      .string()
      .trim()
      .min(
        10,
        "Explanation must be at least 10 characters."
      )
      .max(
        2000,
        "Explanation cannot exceed 2000 characters."
      ),

    difficulty: z.enum([
      QUESTION_DIFFICULTY.EASY,
      QUESTION_DIFFICULTY.MEDIUM,
      QUESTION_DIFFICULTY.HARD,
    ]),

    bloomLevel: z.enum([
      BLOOM_LEVEL.REMEMBER,
      BLOOM_LEVEL.UNDERSTAND,
      BLOOM_LEVEL.APPLY,
      BLOOM_LEVEL.ANALYZE,
      BLOOM_LEVEL.EVALUATE,
      BLOOM_LEVEL.CREATE,
    ]),

    questionType: z.enum([
      QUESTION_TYPE.SINGLE_CHOICE,
      QUESTION_TYPE.MULTIPLE_CHOICE,
    ]),

    options: z
      .array(optionSchema)
      .min(
        2,
        "Each question must have at least 2 options."
      )
      .max(
        8,
        "Maximum 8 options are allowed."
      ),

    correctAnswers: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Correct answer ID is required.")
      )
      .min(
        1,
        "At least one correct answer is required."
      ),
  })
  .superRefine((question, ctx) => {
    /**
     * Option IDs must be unique
     */
    const optionIds = question.options.map(
      (option) => option.id
    );

    const uniqueOptionIds =
      new Set(optionIds);

    if (
      uniqueOptionIds.size !== optionIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message:
          "Option IDs must be unique within a question.",
      });
    }

    /**
     * Every correct answer must
     * reference an existing option
     */
    for (
      const correctAnswer of
      question.correctAnswers
    ) {
      if (
        !uniqueOptionIds.has(
          correctAnswer
        )
      ) {
        ctx.addIssue({
          code: "custom",
          path: [
            "correctAnswers",
          ],
          message:
            "Every correct answer must match an option ID.",
        });
      }
    }

    /**
     * Single choice must have
     * exactly one correct answer
     */
    if (
      question.questionType ===
        QUESTION_TYPE.SINGLE_CHOICE &&
      question.correctAnswers.length !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: [
          "correctAnswers",
        ],
        message:
          "Single choice questions must have exactly one correct answer.",
      });
    }
  });

/**
 * Create Quiz Validation
 *
 * lesson is intentionally NOT included here.
 *
 * The lesson comes from:
 * /lessons/:lessonId/quiz
 *
 * The controller adds it after authentication.
 */
export const createQuizSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        5,
        "Title must be at least 5 characters."
      )
      .max(
        150,
        "Title cannot exceed 150 characters."
      ),

    description: z
      .string()
      .trim()
      .min(
        20,
        "Description must be at least 20 characters."
      )
      .max(
        500,
        "Description cannot exceed 500 characters."
      ),

    passingScore: z
      .number()
      .min(
        0,
        "Passing score cannot be negative."
      )
      .max(
        100,
        "Passing score cannot exceed 100."
      ),

    timeLimit: z
      .number()
      .int(
        "Time limit must be an integer."
      )
      .positive(
        "Time limit must be greater than zero."
      ),

    shuffleQuestions:
      z.boolean().default(false),

    shuffleOptions:
      z.boolean().default(false),

    status: z
      .enum([
        QUIZ_STATUS.DRAFT,
        QUIZ_STATUS.REVIEW,
        QUIZ_STATUS.PUBLISHED,
        QUIZ_STATUS.ARCHIVED,
      ])
      .default(
        QUIZ_STATUS.DRAFT
      ),

    questions: z
      .array(questionSchema)
      .min(
        1,
        "Quiz must contain at least one question."
      ),
  });

/**
 * Update Quiz Validation
 *
 * lesson is also excluded because
 * lesson association should not be changed
 * through normal quiz update.
 */
export const updateQuizSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        5,
        "Title must be at least 5 characters."
      )
      .max(
        150,
        "Title cannot exceed 150 characters."
      )
      .optional(),

    description: z
      .string()
      .trim()
      .min(
        20,
        "Description must be at least 20 characters."
      )
      .max(
        500,
        "Description cannot exceed 500 characters."
      )
      .optional(),

    passingScore: z
      .number()
      .min(
        0,
        "Passing score cannot be negative."
      )
      .max(
        100,
        "Passing score cannot exceed 100."
      )
      .optional(),

    timeLimit: z
      .number()
      .int(
        "Time limit must be an integer."
      )
      .positive(
        "Time limit must be greater than zero."
      )
      .optional(),

    shuffleQuestions:
      z.boolean().optional(),

    shuffleOptions:
      z.boolean().optional(),

    status: z
      .enum([
        QUIZ_STATUS.DRAFT,
        QUIZ_STATUS.REVIEW,
        QUIZ_STATUS.PUBLISHED,
        QUIZ_STATUS.ARCHIVED,
      ])
      .optional(),

    questions: z
      .array(questionSchema)
      .min(
        1,
        "Quiz must contain at least one question."
      )
      .optional(),
  });