import { IAiProvider } from "./ai-provider.interface";
import { ITutorContext, ITutorProviderResult } from "./tutor.types";

export class NoopAiProvider implements IAiProvider {
  async generateResponse(_question: string, context: ITutorContext): Promise<ITutorProviderResult> {
    const currentStateText = context.currentState ? JSON.stringify(context.currentState) : "current state unavailable";
    const answer = `I can explain the verified context for ${context.topicId}. The current state is ${currentStateText}. Please ask a question about the verified concept or the current step.`;
    return {
      answer,
      source: "AI_WITH_VERIFIED_CONTEXT",
      verifiedContext: true,
      relatedStep: context.relatedStep,
    };
  }
}

export const createAiProvider = (): IAiProvider => new NoopAiProvider();
