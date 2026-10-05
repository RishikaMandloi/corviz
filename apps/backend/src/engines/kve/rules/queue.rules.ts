import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class QueueKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "QUEUE" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: Must declare and enforce FIFO
    const fifoInvariant = ckr.invariants.find(
      (inv) => inv.id === "FIFO" || inv.rule.toUpperCase().includes("FIRST-IN, FIRST-OUT")
    );
    if (!fifoInvariant) {
      errors.push({
        code: "MISSING_FIFO_INVARIANT",
        message: "Queue concept must explicitly define and strictly enforce the FIFO invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "Strict FIFO invariant declaration",
        actual: "FIFO invariant missing",
      });
    }

    // 2. Operation Validation: ENQUEUE must target REAR
    const enqueueRule = ckr.rules.find((r) => r.operation === "ENQUEUE");
    if (!enqueueRule) {
      errors.push({
        code: "MISSING_ENQUEUE_OPERATION",
        message: "Queue concept must define an ENQUEUE operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "ENQUEUE operation rule",
        actual: "ENQUEUE operation missing",
      });
    } else if (enqueueRule.targetSlot.toUpperCase() !== "REAR") {
      errors.push({
        code: "INVALID_ENQUEUE_TARGET",
        message: `Queue ENQUEUE must target REAR, but targets "${enqueueRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "REAR",
        actual: enqueueRule.targetSlot,
        suggestedCorrection: "Set targetSlot to REAR for ENQUEUE operation.",
      });
    }

    // 3. Operation Validation: DEQUEUE must target FRONT
    const dequeueRule = ckr.rules.find((r) => r.operation === "DEQUEUE");
    if (!dequeueRule) {
      errors.push({
        code: "MISSING_DEQUEUE_OPERATION",
        message: "Queue concept must define a DEQUEUE operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "DEQUEUE operation rule",
        actual: "DEQUEUE operation missing",
      });
    } else if (dequeueRule.targetSlot.toUpperCase() !== "FRONT") {
      errors.push({
        code: "INVALID_DEQUEUE_TARGET",
        message: `Queue DEQUEUE must remove from FRONT, but targets "${dequeueRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "FRONT",
        actual: dequeueRule.targetSlot,
        suggestedCorrection: "Set targetSlot to FRONT for DEQUEUE operation.",
      });
    }

    // 4. Entity Validation: Must have Front and Rear Pointers
    const hasFrontPointer = ckr.entities.some(
      (e) => e.id === "front_pointer" || e.name.toLowerCase().includes("front")
    );
    if (!hasFrontPointer) {
      warnings.push({
        code: "MISSING_FRONT_POINTER_ENTITY",
        message: "Queue concept should declare Front Pointer entity.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
        expected: "Front pointer entity",
        actual: "Not declared",
      });
    }

    const hasRearPointer = ckr.entities.some(
      (e) => e.id === "rear_pointer" || e.name.toLowerCase().includes("rear")
    );
    if (!hasRearPointer) {
      warnings.push({
        code: "MISSING_REAR_POINTER_ENTITY",
        message: "Queue concept should declare Rear Pointer entity.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
        expected: "Rear pointer entity",
        actual: "Not declared",
      });
    }

    // 5. Edge Case Validation: Must specify Underflow
    const hasUnderflow = ckr.edgeCases.some(
      (ec) => ec.id.includes("UNDERFLOW") || ec.trigger.toLowerCase().includes("empty")
    );
    if (!hasUnderflow) {
      warnings.push({
        code: "MISSING_UNDERFLOW_EDGE_CASE",
        message: "Queue concept should specify behavior for empty queue dequeue (Underflow).",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
        expected: "Queue underflow edge case handling",
        actual: "Missing edge case",
      });
    }

    const valid = errors.length === 0;
    const confidenceScore = valid ? (warnings.length === 0 ? 1.0 : 0.88) : 0.0;

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

export const queueKveRuleValidator = new QueueKveRuleValidator();
