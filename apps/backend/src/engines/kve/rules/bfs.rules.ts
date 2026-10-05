import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class BfsKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "BFS" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: FIFO_PROCESSING_ORDER
    const fifoInvariant = ckr.invariants.find(
      (inv) => inv.id === "FIFO_PROCESSING_ORDER" || inv.rule.toLowerCase().includes("fifo")
    );
    if (!fifoInvariant) {
      errors.push({
        code: "MISSING_FIFO_PROCESSING_INVARIANT",
        message: "BFS must declare FIFO queue processing order invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Entity Validation: bfs_queue & visited_set
    const hasQueue = ckr.entities.some((e) => e.id.includes("queue") || e.name.toLowerCase().includes("queue"));
    const hasVisited = ckr.entities.some((e) => e.id.includes("visited") || e.name.toLowerCase().includes("visited"));

    if (!hasQueue || !hasVisited) {
      errors.push({
        code: "MISSING_BFS_COMPONENTS",
        message: "BFS requires both FIFO Queue and Visited Set tracking entities.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 3. Operation Validation: VISIT_AND_EXPAND targets QUEUE_FRONT
    const op = ckr.rules.find((r) => r.operation === "VISIT_AND_EXPAND" || r.operation === "TRAVERSE");
    if (!op) {
      errors.push({
        code: "MISSING_VISIT_EXPAND_OPERATION",
        message: "BFS must define VISIT_AND_EXPAND operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    const valid = errors.length === 0;
    const confidenceScore = valid ? 1.0 : 0.0;

    return {
      valid,
      status: valid ? SHARED_VERIFICATION_STATUS.PASSED : SHARED_VERIFICATION_STATUS.FAILED,
      confidenceScore,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const bfsKveRuleValidator = new BfsKveRuleValidator();
