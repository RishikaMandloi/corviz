import { randomUUID } from "crypto";
import { AppError } from "../../errors";
import {
  IPipelineGenerateRequest,
  IPipelineGenerateResponse,
  IPipelineInteractionRequest,
  IPipelineInteractionResponse,
  ISceneGraph,
  IStateExecutionTrace,
  IStateTransition,
  IVerificationResult,
  SupportedTopicId,
} from "../../shared/contracts";
import { topicRegistry } from "../topic/topic.registry";
import { ckrService } from "../../engines/ckr/ckr.service";
import { kveService } from "../../engines/kve/kve.service";
import { stateMachineService } from "../../engines/state-machine/state-machine.service";
import { sceneBuilderService } from "../video/planner/scene-builder.service";
import { vkveService } from "../../engines/vkve/vkve.service";
import { selfHealingService } from "../../engines/self-healing/self-healing.service";
import { narrationService } from "../../engines/narration/narration.service";
import { explanationService } from "../../engines/explanation/explanation.service";
import { dryRunService } from "../../engines/dry-run/dry-run.service";
import { quizGeneratorService } from "../../engines/quiz/quiz-generator.service";

// In-memory cache for generated pipelines
const pipelineCache = new Map<string, IPipelineGenerateResponse>();
const SUPPORTED_OPERATIONS: Record<SupportedTopicId, readonly string[]> = {
  STACK: ["PUSH", "POP", "PEEK"],
  QUEUE: ["ENQUEUE", "DEQUEUE", "PEEK"],
  BINARY_SEARCH: ["SEARCH"],
  BUBBLE_SORT: ["COMPARE_AND_SWAP"],
  LINEAR_SEARCH: ["SEARCH"],
  LINKED_LIST: ["INSERT_HEAD", "DELETE_HEAD"],
  BST: ["INSERT", "SEARCH"],
  SELECTION_SORT: ["FIND_MIN_AND_SWAP"],
  TWO_POINTERS: ["SWAP_AND_ADVANCE"],
  BFS: ["VISIT_AND_EXPAND"],
};

class PipelineService {
  /**
   * End-to-end verified pipeline generation:
   * Topic -> CKR -> KVE -> State Machine -> Scene Graph -> Structural Val -> VKVE -> Self-Healing -> Narration -> Explanation -> Dry Run -> Quiz
   */
  async generatePipeline(req: IPipelineGenerateRequest): Promise<IPipelineGenerateResponse> {
    const { topicId, initialValues, operations, initializeOnly = false } = req;

    // 1. Topic Scope Guard
    if (!topicRegistry.isSupported(topicId)) {
      throw new AppError(
        `Topic "${topicId}" is unsupported. The current release is strictly bounded to the 10 approved topics: ${Object.keys(
          Object.fromEntries(topicRegistry.getAllMetadata().map((metadata) => [metadata.id, true]))
        ).join(", ")}.`,
        400
      );
    }

    const topicMeta = topicRegistry.getMetadata(topicId);
    this.validateOperations(topicId, operations ?? []);
    if (initializeOnly && operations?.length) {
      throw new AppError("initializeOnly cannot be combined with precomputed operations.", 400);
    }

    // 2. CKR Retrieval
    const ckr = ckrService.getCkr(topicId);

    // 3. KVE Conceptual Verification
    const kveReport = kveService.verifyConcept(ckr);
    if (!kveReport.valid) {
      throw new AppError(
        `KVE Conceptual Verification Failed for topic "${topicId}". Cannot proceed with invalid concept model.`,
        422
      );
    }

    // 4. Deterministic State Machine Execution
    let stateTrace: IStateExecutionTrace;
    try {
      if (initializeOnly) {
        const initialState = stateMachineService.createInitialState(topicId, initialValues ?? topicMeta.defaultInitialValues);
        stateTrace = { initialState, transitions: [], finalState: initialState };
      } else {
        stateTrace = stateMachineService.executeSequence(
          topicId,
          initialValues ?? topicMeta.defaultInitialValues,
          operations
        );
      }
    } catch (error) {
      if (error instanceof Error) throw new AppError(`Pipeline operation was rejected: ${error.message}`, 422);
      throw error;
    }
    const rejectedTransition = stateTrace.transitions.find((transition) => !transition.isValidTransition);
    if (rejectedTransition) {
      throw new AppError(
        `Pipeline operation ${rejectedTransition.stepIndex} (${rejectedTransition.operation.type}) was rejected by the deterministic state machine. ${rejectedTransition.edgeCaseTriggered ?? rejectedTransition.explanation}`,
        422
      );
    }

    // 5. Domain Scene Planning & Scene Graph Construction
    const { sceneGraph: plannedGraph } = sceneBuilderService.build(topicId, stateTrace);

    // 6. Two-Layer Verification (Structural + Semantic VKVE)
    let verificationReport = vkveService.verify(plannedGraph, stateTrace);
    let finalSceneGraph = plannedGraph;

    // 7. Targeted Self-Healing if verification detected defects
    if (!verificationReport.valid) {
      const healingResult = selfHealingService.heal(plannedGraph, stateTrace, verificationReport);
      finalSceneGraph = healingResult.sceneGraph;
      verificationReport = healingResult.finalReport;
    }
    if (!verificationReport.valid) {
      throw new AppError(
        `Generated scene graph failed VKVE after self-healing. ${verificationReport.errors.map((item) => item.message).join(" ")}`,
        422
      );
    }

    // 8. Downstream Synchronized Generation
    let narrationScript = verificationReport.valid
      ? narrationService.generateScript(finalSceneGraph, stateTrace)
      : [];
    if (verificationReport.valid) {
      verificationReport = vkveService.verify(finalSceneGraph, stateTrace);
      if (!verificationReport.valid) {
        narrationScript = [];
        finalSceneGraph.scenes.forEach((scene) => { delete scene.narration; });
      }
    } else {
      finalSceneGraph.scenes.forEach((scene) => { delete scene.narration; });
    }
    const writtenExplanation = explanationService.generateExplanation(ckr, stateTrace);
    const dryRun = dryRunService.generateDryRun(topicId, stateTrace);
    const quiz = quizGeneratorService.generateQuiz(ckr, stateTrace);

    const pipelineId = randomUUID();

    const response: IPipelineGenerateResponse = {
      success: true,
      pipelineId,
      topic: topicMeta,
      ckr,
      stateTrace,
      sceneGraph: finalSceneGraph,
      verificationReport,
      narrationScript,
      writtenExplanation,
      dryRun,
      quiz,
    };

    pipelineCache.set(pipelineId, response);
    return response;
  }

  /**
   * Handle real-time student value interactions (e.g. Push(X), Pop()).
   */
  async interactPipeline(
    req: IPipelineInteractionRequest
  ): Promise<IPipelineInteractionResponse> {
    const currentPipeline = pipelineCache.get(req.pipelineId);
    if (!currentPipeline) {
      throw new AppError("Pipeline session not found or expired. Generate the lesson again before interacting.", 404);
    }
    const topicId = currentPipeline.topic.id;
    this.validateOperations(topicId, [req.operation]);
    const currentState = currentPipeline.stateTrace.finalState;
    const stepIndex = currentPipeline.stateTrace.transitions.length + 1;
    let transition: IStateTransition;
    try {
      transition = stateMachineService.executeOperation(
        topicId,
        currentState,
        req.operation,
        stepIndex
      );
    } catch (error) {
      if (error instanceof Error) throw new AppError(`Unsupported ${topicId} operation: ${error.message}`, 422);
      throw error;
    }
    if (!transition.isValidTransition) {
      throw new AppError(
        `Interactive operation was rejected by the deterministic state machine. ${transition.edgeCaseTriggered ?? transition.explanation}`,
        422
      );
    }

    const updatedTrace: IStateExecutionTrace = {
      initialState: currentPipeline.stateTrace.initialState,
      transitions: [...currentPipeline.stateTrace.transitions, transition],
      finalState: transition.resultingState,
    };

    const { sceneGraph: plannedGraph } = sceneBuilderService.build(topicId, updatedTrace);
    let sceneGraph = plannedGraph;
    let verificationReport = vkveService.verify(sceneGraph, updatedTrace);
    if (!verificationReport.valid) {
      const healing = selfHealingService.heal(sceneGraph, updatedTrace, verificationReport);
      sceneGraph = healing.sceneGraph;
      verificationReport = healing.finalReport;
    }
    if (!verificationReport.valid) {
      throw new AppError(`Interactive scene failed verification; narration was not generated. ${verificationReport.errors.map((item) => item.message).join(" ")}`, 422);
    }

    const narrationScript = narrationService.generateScript(sceneGraph, updatedTrace);
    const finalVerification = vkveService.verify(sceneGraph, updatedTrace);
    if (!finalVerification.valid) {
      throw new AppError("Interactive scene failed verification after narration; narration was rejected.", 422);
    }

    const dryRun = dryRunService.generateDryRun(topicId, updatedTrace);
    const dryRunRow = dryRun.rows[dryRun.rows.length - 1];
    const quiz = quizGeneratorService.generateQuiz(currentPipeline.ckr, updatedTrace);
    const updatedScene = sceneGraph.scenes[sceneGraph.scenes.length - 1];
    const narration = narrationScript[narrationScript.length - 1];

    const updatedPipeline: IPipelineGenerateResponse = {
      ...currentPipeline,
      stateTrace: updatedTrace,
      sceneGraph,
      verificationReport: finalVerification,
      narrationScript,
      dryRun,
      quiz,
    };
    pipelineCache.set(req.pipelineId, updatedPipeline);

    return {
      success: true,
      updatedState: transition.resultingState,
      transition,
      updatedScene,
      verificationReport: finalVerification,
      dryRunRow,
      explanation: transition.explanation,
      narration,
      quiz,
    };
  }

  /**
   * Get cached pipeline session by ID.
   */
  getPipelineById(pipelineId: string): IPipelineGenerateResponse {
    const cached = pipelineCache.get(pipelineId);
    if (!cached) {
      throw new AppError(`Pipeline session "${pipelineId}" not found.`, 404);
    }
    return cached;
  }

  /**
   * Run standalone scene graph verification.
   */
  verifySceneGraph(sceneGraph: ISceneGraph, trace?: IStateExecutionTrace): IVerificationResult {
    return vkveService.verify(sceneGraph, trace);
  }

  private validateOperations(topicId: SupportedTopicId, operations: Array<{ type: string }>): void {
    const supported = SUPPORTED_OPERATIONS[topicId];
    for (const operation of operations) {
      if (!supported.includes(operation.type.toUpperCase())) {
        throw new AppError(`Operation "${operation.type}" is not supported for topic "${topicId}".`, 422);
      }
    }
  }
}

export const pipelineService = new PipelineService();
