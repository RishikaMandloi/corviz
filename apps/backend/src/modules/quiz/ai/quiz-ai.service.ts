import { IQuizAIService } from "./quiz-ai-interface";

class QuizAIService implements IQuizAIService {
  async generateQuiz(): Promise<void> {
    // Concrete quiz generation is now orchestrated deterministically via quizGeneratorService
    return Promise.resolve();
  }
}

export const quizAIService =
  new QuizAIService();