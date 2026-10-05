import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class StackKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "STACK" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: Must declare and enforce LIFO
    const lifoInvariant = ckr.invariants.find(
      (inv) => inv.id === "LIFO" || inv.rule.toUpperCase().includes("LAST-IN, FIRST-OUT")
    );
    if (!lifoInvariant) {
      errors.push({
        code: "MISSING_LIFO_INVARIANT",
        message: "Stack concept must explicitly define and strictly enforce the LIFO invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "Strict LIFO invariant declaration",
        actual: "LIFO invariant missing",
      });
    }

    // 2. Operation Validation: PUSH must target TOP
    const pushRule = ckr.rules.find((r) => r.operation === "PUSH");
    if (!pushRule) {
      errors.push({
        code: "MISSING_PUSH_OPERATION",
        message: "Stack concept must define a PUSH operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "PUSH operation rule",
        actual: "PUSH operation missing",
      });
    } else if (pushRule.targetSlot.toUpperCase() !== "TOP") {
      errors.push({
        code: "INVALID_PUSH_TARGET",
        message: `Stack PUSH must target TOP, but targets "${pushRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "TOP",
        actual: pushRule.targetSlot,
        suggestedCorrection: "Set targetSlot to TOP for PUSH operation.",
      });
    }

    // 3. Operation Validation: POP must target TOP
    const popRule = ckr.rules.find((r) => r.operation === "POP");
    if (!popRule) {
      errors.push({
        code: "MISSING_POP_OPERATION",
        message: "Stack concept must define a POP operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "POP operation rule",
        actual: "POP operation missing",
      });
    } else if (popRule.targetSlot.toUpperCase() !== "TOP") {
      errors.push({
        code: "INVALID_POP_TARGET",
        message: `Stack POP must remove from TOP, but targets "${popRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "TOP",
        actual: popRule.targetSlot,
        suggestedCorrection: "Set targetSlot to TOP for POP operation.",
      });
    }

    // 4. Entity Validation: Must have Top Pointer and Container
    const hasTopPointer = ckr.entities.some(
      (e) => e.id === "top_pointer" || e.name.toLowerCase().includes("top")
    );
    if (!hasTopPointer) {
      warnings.push({
        code: "MISSING_TOP_POINTER_ENTITY",
        message: "Stack concept should explicitly declare Top Pointer entity for accurate tracking.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
        expected: "Top pointer entity",
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
        message: "Stack concept should specify behavior for empty stack access (Underflow).",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
        expected: "Stack underflow edge case handling",
        actual: "Missing edge case",
      });
    }

    const valid = errors.length === 0;
    const confidenceScore = valid ? (warnings.length === 0 ? 1.0 : 0.85) : 0.0;

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

export const stackKveRuleValidator = new StackKveRuleValidator();
