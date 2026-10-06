import { ITutorContext, ITutorProviderResult } from "./tutor.types";

export class TutorResponseValidator {
  validate(response: ITutorProviderResult, context: ITutorContext, question?: string): { valid: boolean; safeAnswer: string; source: ITutorProviderResult["source"] } {
    const answer = response.answer ?? "";
    const currentState = context.currentState;
    const currentOperation = context.currentOperation;
    const rules = context.canonicalRules ?? [];
    const isQuizQuestion = !!question && /(?:give me|ask me|quiz me|test my knowledge|more quiz|more questions|another question|another quiz|question)/i.test(question) && /(?:quiz|question|test|more)/i.test(question);

    const topValue = currentState?.elements.at(-1);
    const stackTopClaims = [...answer.matchAll(/\b(?:the\s+)?top(?:\s+of\s+the\s+stack)?\s*(?:is|=|:)\s*([\w-]+)|\b([\w-]+)\s+(?:is|sits|remains)\s+(?:currently\s+)?(?:on\s+top|at\s+the\s+top)\b/gi)];
    const unsupportedStackTopClaim = context.topicId === "STACK" && topValue !== undefined && stackTopClaims.some((claim) => {
      const claimedValue = claim[1] ?? claim[2];
      if (claimedValue === undefined || claimedValue === String(topValue)) {
        return false;
      }

      const matchIndex = claim.index ?? 0;
      const contextWindow = answer.slice(Math.max(0, matchIndex - 80), Math.min(answer.length, matchIndex + 80));
      const isHypotheticalExample = /if\s+the\s+stack\s+contains|for\s+example|suppose|example/i.test(contextWindow);
      return !isHypotheticalExample;
    });

    const contradictsInvariant = rules.some((rule) => {
      const lower = rule.toLowerCase();
      if (lower.includes("last-in") || lower.includes("lifo")) {
        return /(?:top|remove|pop).*(?:bottom|first element)|(?:bottom|first element).*(?:top|remove|pop)/i.test(answer);
      }
      return false;
    });

    const contradictsOperation = currentOperation && /pushed|added|inserted|removed|deleted|dequeued|enqueued/i.test(answer) && currentOperation.type && !answer.toLowerCase().includes(currentOperation.type.toLowerCase().replace(/_/g, " ")) && !answer.toLowerCase().includes(String((currentOperation.payload as Record<string, unknown> | undefined)?.value ?? ""));

    if (!answer.trim()) {
      return { valid: false, safeAnswer: "The current execution state is unavailable for that explanation.", source: "FALLBACK" };
    }

    if (!isQuizQuestion && (unsupportedStackTopClaim || contradictsInvariant || contradictsOperation)) {
      return {
        valid: false,
        safeAnswer: this.buildFallback(context),
        source: "FALLBACK",
      };
    }

    return { valid: true, safeAnswer: answer, source: response.source };
  }

  private buildFallback(context: ITutorContext): string {
    const stateSummary = context.currentState
      ? `The current verified state is ${JSON.stringify(context.currentState.elements)} with pointers ${JSON.stringify(context.currentState.pointers)}.`
      : "The current verified state is unavailable.";
    const operationSummary = context.currentOperation ? `The most recent operation was ${context.currentOperation.type}.` : "No current operation is available.";
    return `${stateSummary} ${operationSummary} I can explain the verified rule without guessing.`;
  }
}

export const tutorResponseValidator = new TutorResponseValidator();
