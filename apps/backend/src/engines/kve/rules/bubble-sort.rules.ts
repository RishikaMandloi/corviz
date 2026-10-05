import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class BubbleSortKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "BUBBLE_SORT" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: Adjacent comparison
    const adjacentInvariant = ckr.invariants.find(
      (inv) => inv.id === "ADJACENT_COMPARISON_ONLY" || inv.rule.toLowerCase().includes("adjacent")
    );
    if (!adjacentInvariant) {
      errors.push({
        code: "MISSING_ADJACENT_COMPARISON_INVARIANT",
        message: "Bubble Sort must enforce strict adjacent comparison only.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "ADJACENT_COMPARISON_ONLY invariant declaration",
        actual: "Missing invariant",
      });
    }

    // 2. Operation Validation: COMPARE_AND_SWAP targets ADJACENT
    const swapRule = ckr.rules.find((r) => r.operation === "COMPARE_AND_SWAP" || r.operation === "SWAP");
    if (!swapRule) {
      errors.push({
        code: "MISSING_COMPARE_SWAP_OPERATION",
        message: "Bubble Sort must define a COMPARE_AND_SWAP operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "COMPARE_AND_SWAP rule",
        actual: "None found",
      });
    } else if (swapRule.targetSlot.toUpperCase() !== "ADJACENT") {
      errors.push({
        code: "INVALID_SWAP_TARGET",
        message: `Bubble Sort comparison must target ADJACENT pair, but targets "${swapRule.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
        expected: "ADJACENT",
        actual: swapRule.targetSlot,
      });
    }

    // 3. Entity Validation: Sorted partition & compared pair
    const hasComparedPair = ckr.entities.some((e) => e.id.includes("compared_pair") || e.name.toLowerCase().includes("pair"));
    if (!hasComparedPair) {
      warnings.push({
        code: "MISSING_COMPARED_PAIR_ENTITY",
        message: "Bubble Sort should declare Compared Pair entity.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
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

export const bubbleSortKveRuleValidator = new BubbleSortKveRuleValidator();
