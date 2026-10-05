import {
  ISceneGraph,
  IStateExecutionTrace,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
  SupportedTopicId,
} from "../../shared/contracts";
import { sceneGraphValidator } from "../../modules/video/planner/scene-graph.validator";
import { stackVkveValidator } from "./validators/stack.vkve";
import { queueVkveValidator } from "./validators/queue.vkve";
import {
  binarySearchVkveValidator,
  bubbleSortVkveValidator,
  linearSearchVkveValidator,
  selectionSortVkveValidator,
  twoPointersVkveValidator,
} from "./validators/array-algorithm.vkve";
import { linkedListVkveValidator } from "./validators/linked-list.vkve";
import { bstVkveValidator } from "./validators/bst.vkve";
import { bfsVkveValidator } from "./validators/bfs.vkve";
import { IVkveSemanticValidator } from "./vkve.types";

class VkveService {
  private semanticValidators = new Map<SupportedTopicId, IVkveSemanticValidator>();

  constructor() {
    this.registerValidator(stackVkveValidator);
    this.registerValidator(queueVkveValidator);
    this.registerValidator(binarySearchVkveValidator);
    this.registerValidator(bubbleSortVkveValidator);
    this.registerValidator(linearSearchVkveValidator);
    this.registerValidator(selectionSortVkveValidator);
    this.registerValidator(twoPointersVkveValidator);
    this.registerValidator(linkedListVkveValidator);
    this.registerValidator(bstVkveValidator);
    this.registerValidator(bfsVkveValidator);
  }

  registerValidator(validator: IVkveSemanticValidator): void {
    this.semanticValidators.set(validator.topicId, validator);
  }

  /**
   * Two-Layer Verification Pipeline:
   * Layer 1: Structural Scene Graph Validation (bounds, IDs, camera, time limits)
   * Layer 2: Semantic Visual Knowledge Verification (CS invariant, motion trajectory, target slot, state count)
   */
  verify(sceneGraph: ISceneGraph, trace?: IStateExecutionTrace): IVerificationResult {
    // ----------------------------------------------------
    // LAYER 1: Structural Validation
    // ----------------------------------------------------
    const structuralReport = sceneGraphValidator.validateWithResult(sceneGraph as any);
    if (!structuralReport.valid) {
      const mappedErrors: IVerificationIssue[] = structuralReport.errors.map((e) => ({
        code: e.code,
        message: e.message,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "STRUCTURAL_VAL",
        sceneId: e.sceneId,
        objectId: e.objectId,
        animationId: e.animationId,
      }));

      return {
        valid: false,
        status: SHARED_VERIFICATION_STATUS.FAILED,
        confidenceScore: 0,
        errors: mappedErrors,
        warnings: [],
        checkedAt: new Date().toISOString(),
      };
    }

    // If no execution trace provided, structural pass is the limit of verification
    if (!trace) {
      return {
        valid: true,
        status: SHARED_VERIFICATION_STATUS.PASSED,
        confidenceScore: 0.7,
        errors: [],
        warnings: [
          {
            code: "NO_EXECUTION_TRACE_FOR_SEMANTICS",
            message: "Scene graph passed structural validation, but semantic VKVE check skipped without execution trace.",
            severity: SHARED_VERIFICATION_SEVERITY.WARNING,
            validator: "VKVE",
          },
        ],
        checkedAt: new Date().toISOString(),
      };
    }

    // ----------------------------------------------------
    // LAYER 2: Semantic VKVE Validation
    // ----------------------------------------------------
    const semanticValidator = this.semanticValidators.get(sceneGraph.topicId);
    if (!semanticValidator) {
      return {
        valid: false,
        status: SHARED_VERIFICATION_STATUS.NEEDS_REVIEW,
        confidenceScore: 0.5,
        errors: [
          {
            code: "NO_VKVE_VALIDATOR",
            message: `No semantic VKVE validator registered for topic "${sceneGraph.topicId}".`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
          },
        ],
        warnings: [],
        checkedAt: new Date().toISOString(),
      };
    }

    return semanticValidator.validateSemanticSceneGraph(sceneGraph, trace);
  }
}

export const vkveService = new VkveService();

