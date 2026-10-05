import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class SelectionSortKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "SELECTION_SORT" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: MINIMUM_SELECTION
    const minInvariant = ckr.invariants.find(
      (inv) => inv.id === "MINIMUM_SELECTION" || inv.rule.toLowerCase().includes("minimum")
    );
    if (!minInvariant) {
      errors.push({
        code: "MISSING_MINIMUM_SELECTION_INVARIANT",
        message: "Selection Sort must declare the minimum selection invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Operation Validation: FIND_MIN_AND_SWAP targets PARTITION_BOUNDARY
    const opRule = ckr.rules.find((r) => r.operation === "FIND_MIN_AND_SWAP" || r.operation === "SWAP");
    if (!opRule) {
      errors.push({
        code: "MISSING_SELECTION_OPERATION",
        message: "Selection Sort must define FIND_MIN_AND_SWAP operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    } else if (opRule.targetSlot.toUpperCase() !== "PARTITION_BOUNDARY") {
      errors.push({
        code: "INVALID_SELECTION_TARGET",
        message: `Selection Sort swap must target PARTITION_BOUNDARY, but targets "${opRule.targetSlot}".`,
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

export const selectionSortKveRuleValidator = new SelectionSortKveRuleValidator();
