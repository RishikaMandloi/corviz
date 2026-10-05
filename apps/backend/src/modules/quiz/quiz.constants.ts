// import { Request, Response } from "express";

// import { asyncHandler, sendResponse } from "../../utils";

// import { quizService } from "./quiz.service";
// import { IQuiz } from "./quiz.types";

// class QuizController {
//   /**
//    * Create Quiz
//    */
//   createQuiz = asyncHandler(
//     async (req: Request, res: Response) => {
//       const payload = req.body as IQuiz;

//       const quiz = await quizService.createQuiz(payload);

//       sendResponse(res, {
//         statusCode: 201,
//         success: true,
//         message: "Quiz created successfully.",
//         data: quiz,
//       });
//     }
//   );

//   /**
//    * Get All Quizzes
//    */
//   getQuizzes = asyncHandler(
//     async (_req: Request, res: Response) => {
//       const quizzes = await quizService.getQuizzes();

//       sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Quizzes fetched successfully.",
//         data: quizzes,
//       });
//     }
//   );

//   /**
//    * Get Quiz By ID
//    */
//   getQuizById = asyncHandler(
//     async (req: Request, res: Response) => {
//       const quiz = await quizService.getQuizById(
//         req.params.id as string
//       );

//       sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Quiz fetched successfully.",
//         data: quiz,
//       });
//     }
//   );

//   /**
//    * Update Quiz
//    */
//   updateQuiz = asyncHandler(
//     async (req: Request, res: Response) => {
//       const payload = req.body as Partial<IQuiz>;

//       const quiz = await quizService.updateQuiz(
//         req.params.id as string,
//         payload
//       );

//       sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Quiz updated successfully.",
//         data: quiz,
//       });
//     }
//   );

//   /**
//    * Delete Quiz
//    */
//   deleteQuiz = asyncHandler(
//     async (req: Request, res: Response) => {
//       await quizService.deleteQuiz(
//         req.params.id as string
//       );

//       sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: "Quiz deleted successfully.",
//         data: null,
//       });
//     }
//   );
  
// }

// export const quizController = new QuizController();

// export const QUIZ_STATUS = {
//   DRAFT: "DRAFT",
//   REVIEW: "REVIEW",
//   PUBLISHED: "PUBLISHED",
//   ARCHIVED: "ARCHIVED",
// } as const;

// export const QUESTION_TYPE = {
//   SINGLE_CHOICE: "SINGLE_CHOICE",
//   MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
// } as const;

// export const QUESTION_DIFFICULTY = {
//   EASY: "EASY",
//   MEDIUM: "MEDIUM",
//   HARD: "HARD",
// } as const;

// export const BLOOM_LEVEL = {
//   REMEMBER: "REMEMBER",
//   UNDERSTAND: "UNDERSTAND",
//   APPLY: "APPLY",
//   ANALYZE: "ANALYZE",
//   EVALUATE: "EVALUATE",
//   CREATE: "CREATE",
// } as const;

/**
 * Quiz Status
 */
export const QUIZ_STATUS = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type QuizStatus =
  (typeof QUIZ_STATUS)[keyof typeof QUIZ_STATUS];
/**
 * Question Type
 */
export const QUESTION_TYPE = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
} as const;
export type QuestionType =
  (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];


/**
 * Question Difficulty
 */
export const QUESTION_DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;
export type QuestionDifficulty =
  (typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY];

/**
 * Bloom's Taxonomy Levels
 */
export const BLOOM_LEVEL = {
  REMEMBER: "REMEMBER",
  UNDERSTAND: "UNDERSTAND",
  APPLY: "APPLY",
  ANALYZE: "ANALYZE",
  EVALUATE: "EVALUATE",
  CREATE: "CREATE",
} as const;

export type BloomLevel =
  (typeof BLOOM_LEVEL)[keyof typeof BLOOM_LEVEL];