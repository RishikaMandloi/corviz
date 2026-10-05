import { AppError } from "../../errors";
import { ckrService } from "../../engines/ckr/ckr.service";
import { topicRegistry } from "../topic/topic.registry";
import { pipelineService } from "../pipeline/pipeline.service";
import { createAiProvider } from "./provider.factory";
import { tutorContextBuilder } from "./tutor-context-builder";
import { tutorResponseValidator } from "./tutor-response-validator";
import { IAiProvider } from "./ai-provider.interface";
import { ITutorAskRequest, ITutorAskResponse, ITutorContext, ITutorProviderResult } from "./tutor.types";

class TutorService {
  private readonly defaultProvider: IAiProvider;

  constructor() {
    this.defaultProvider = createAiProvider();
  }

  async ask(request: ITutorAskRequest & { provider?: IAiProvider }): Promise<ITutorAskResponse> {
    if (!request?.topicId || !topicRegistry.isSupported(request.topicId)) {
      throw new AppError(`Unsupported topic "${request?.topicId ?? "unknown"}". Only the verified 10-topic catalog is supported.`, 422);
    }

    if (request.pipelineId && pipelineService.getPipelineById(request.pipelineId).topic.id !== request.topicId) {
      throw new AppError("The requested topic does not match the verified pipeline session.", 422);
    }

    const context = tutorContextBuilder.build(request);
    const provider = request.provider ?? this.defaultProvider;

    const question = request.question?.trim();
    if (!question) {
      throw new AppError("A tutor question is required.", 400);
    }

    let response: ITutorProviderResult;
    try {
      response = await provider.generateResponse(question, context);
    } catch (_error) {
      response = {
        answer: this.buildFallback(context, question),
        source: "FALLBACK",
        verifiedContext: true,
      };
    }

    const validation = tutorResponseValidator.validate(response, context);
    const safeAnswer = validation.safeAnswer || this.buildFallback(context, question);

    return {
      answer: safeAnswer,
      topicId: request.topicId,
      verifiedContext: validation.valid || response.verifiedContext || true,
      source: validation.valid ? response.source : validation.source,
      relatedStep: response.relatedStep ?? context.relatedStep,
    };
  }

  buildContext(topicId: string, pipelineId?: string, question?: string): ITutorContext {
    const validatedTopicId = topicRegistry.getMetadata(topicId as any).id;
    const pipeline = pipelineId ? pipelineService.getPipelineById(pipelineId) : undefined;
    const ckr = ckrService.getCkr(validatedTopicId);
    return {
      topicId: validatedTopicId,
      topicConcept: ckr.definition,
      canonicalRules: ckr.invariants.map((rule) => rule.rule),
      currentState: pipeline?.stateTrace.finalState,
      previousState: pipeline?.stateTrace.initialState,
      currentOperation: pipeline?.stateTrace.transitions.at(-1)?.operation,
      transitionExplanation: pipeline?.stateTrace.transitions.at(-1)?.explanation,
      verificationReport: pipeline?.verificationReport,
      dryRunRow: pipeline?.dryRun.rows.at(-1),
      narrationContext: pipeline?.narrationScript.at(-1)?.text,
      relatedStep: pipeline?.stateTrace.transitions.length,
      conversation: question ? [{ role: "user", text: question }] : undefined,
    };
  }

  private buildFallback(context: ITutorContext, question: string): string {
    const stateSummary = context.currentState
      ? `The current verified state is ${JSON.stringify(context.currentState.elements)} with pointers ${JSON.stringify(context.currentState.pointers)}.`
      : "The current verified state is unavailable.";
    const operationSummary = context.currentOperation
      ? `The most recent verified operation was ${context.currentOperation.type}.`
      : "No verified operation is available for the current step.";
    const conceptSummary = context.topicConcept || "This concept is described by the verified CKR.";
    return `${conceptSummary} ${stateSummary} ${operationSummary} I can explain the verified rule for your question: ${question}.`;
  }
}

export const tutorService = new TutorService();
