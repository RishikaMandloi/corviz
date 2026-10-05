import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class LinearSearchKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "LINEAR_SEARCH" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: Sequential progression
    const seqInvariant = ckr.invariants.find(
      (inv) => inv.id === "SEQUENTIAL_PROGRESSION" || inv.rule.toLowerCase().includes("sequential")
    );
    if (!seqInvariant) {
      errors.push({
        code: "MISSING_SEQUENTIAL_PROGRESSION_INVARIANT",
        message: "Linear Search must specify the sequential progression invariant without skipping.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Operation Validation: SEARCH targets CURRENT_INDEX
    const searchRule = ckr.rules.find((r) => r.operation === "SEARCH");
    if (!searchRule) {
      errors.push({
        code: "MISSING_SEARCH_OPERATION",
        message: "Linear Search must define a SEARCH operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    } else if (searchRule.targetSlot.toUpperCase() !== "CURRENT_INDEX") {
      errors.push({
        code: "INVALID_SEARCH_TARGET",
        message: `Linear Search must inspect CURRENT_INDEX, but targets "${searchRule.targetSlot}".`,
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

export const linearSearchKveRuleValidator = new LinearSearchKveRuleValidator();
