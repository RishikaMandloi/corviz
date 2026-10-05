import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class BinarySearchKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "BINARY_SEARCH" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: Must require SORTED_INPUT
    const sortedInvariant = ckr.invariants.find(
      (inv) => inv.id === "SORTED_INPUT" || inv.rule.toLowerCase().includes("sorted")
    );
    if (!sortedInvariant) {
      errors.push({
        code: "MISSING_SORTED_INPUT_INVARIANT",
        message: "Binary Search must enforce that input array is sorted.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "SORTED_INPUT invariant declaration",
        actual: "Missing sorted invariant",
      });
    }

    // 2. Invariant Validation: Halving search space
    const halvingInvariant = ckr.invariants.find(
      (inv) => inv.id === "INTERVAL_HALVING" || inv.rule.toLowerCase().includes("halv")
    );
    if (!halvingInvariant) {
      warnings.push({
        code: "MISSING_INTERVAL_HALVING_INVARIANT",
        message: "Binary Search should specify interval halving invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
      });
    }

    // 3. Operation Validation: SEARCH must target MID
    const searchRule = ckr.rules.find((r) => r.operation === "SEARCH");
    if (!searchRule) {
      errors.push({
        code: "MISSING_SEARCH_OPERATION",
        message: "Binary Search concept must define a SEARCH operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "SEARCH operation",
        actual: "None found",
      });
    } else if (searchRule.targetSlot.toUpperCase() !== "MID") {
      errors.push({
        code: "INVALID_SEARCH_TARGET",
        message: `Binary Search inspection must target MID, but targets "${searchRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "MID",
        actual: searchRule.targetSlot,
      });
    }

    // 4. Entity Validation: Must have low, high, mid pointers
    const hasLow = ckr.entities.some((e) => e.id.includes("low"));
    const hasHigh = ckr.entities.some((e) => e.id.includes("high"));
    const hasMid = ckr.entities.some((e) => e.id.includes("mid"));

    if (!hasLow || !hasHigh || !hasMid) {
      errors.push({
        code: "MISSING_SEARCH_POINTERS",
        message: "Binary search requires Low, High, and Mid pointers in entities.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "low, high, mid pointers declared",
        actual: `low:${hasLow}, high:${hasHigh}, mid:${hasMid}`,
      });
    }

    const valid = errors.length === 0;
    const confidenceScore = valid ? (warnings.length === 0 ? 1.0 : 0.9) : 0.0;

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

export const binarySearchKveRuleValidator = new BinarySearchKveRuleValidator();
