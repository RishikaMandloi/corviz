import { z } from "zod";

import { objectIdSchema } from "../../shared/validators/object-id.validator";

/**
 * Submitted Answer Validation
 */
const submittedAnswerSchema = z.object({
  questionId: objectIdSchema,

  selectedAnswers: z
    .array(
      z
        .string()
        .trim()
        .min(
          1,
          "Selected answer ID is required."
        )
    )
    .min(
      1,
      "At least one answer must be selected."
    ),
});

/**
 * Submit Quiz Attempt Validation
 */
export const submitQuizAttemptSchema =
  z.object({
    answers: z
      .array(submittedAnswerSchema)
      .min(
        1,
        "At least one answer is required."
      ),
  });