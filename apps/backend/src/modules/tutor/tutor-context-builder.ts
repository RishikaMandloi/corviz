import { ckrService } from "../../engines/ckr/ckr.service";
import { topicRegistry } from "../topic/topic.registry";
import { pipelineService } from "../pipeline/pipeline.service";
import { ITutorContext, ITutorAskRequest } from "./tutor.types";

export class TutorContextBuilder {
  build(request: ITutorAskRequest): ITutorContext {
    topicRegistry.getMetadata(request.topicId);
    const ckr = ckrService.getCkr(request.topicId);
    const canonicalRules = ckr.invariants.map((rule) => rule.rule);

    const pipeline = request.pipelineId ? pipelineService.getPipelineById(request.pipelineId) : undefined;
    const currentState = pipeline?.stateTrace.finalState;
    const transition = pipeline?.stateTrace.transitions.at(-1);
    const previousState = transition?.previousState ?? pipeline?.stateTrace.initialState;
    const relatedStep = transition?.stepIndex ?? pipeline?.stateTrace.transitions.length;
    const lastScene = pipeline?.sceneGraph.scenes.at(-1);
    const dryRunRow = pipeline?.dryRun.rows.at(-1);

    return {
      topicId: request.topicId,
      topicConcept: ckr.definition,
      canonicalRules,
      currentState,
      previousState,
      currentOperation: transition?.operation,
      transitionExplanation: transition?.explanation,
      verifiedScene: lastScene ? {
        id: lastScene.id,
        title: lastScene.title,
        semanticIntent: lastScene.semanticIntent,
      } : undefined,
      dryRunRow,
      verificationReport: pipeline?.verificationReport,
      narrationContext: pipeline?.narrationScript.at(-1)?.text,
      relatedStep,
      quizQuestions: pipeline?.quiz.questions ?? [],
      conversation: request.conversation,
    };
  }
}

export const tutorContextBuilder = new TutorContextBuilder();
