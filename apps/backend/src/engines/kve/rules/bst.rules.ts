import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class BstKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "BST" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: BST_ORDERING (left < node < right)
    const bstInvariant = ckr.invariants.find(
      (inv) => inv.id === "BST_ORDERING" || inv.rule.includes("<")
    );
    if (!bstInvariant) {
      errors.push({
        code: "MISSING_BST_ORDERING_INVARIANT",
        message: "BST must declare the fundamental left < node < right ordering invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Entity Validation: Root pointer
    const hasRoot = ckr.entities.some((e) => e.id.includes("root") || e.name.toLowerCase().includes("root"));
    if (!hasRoot) {
      warnings.push({
        code: "MISSING_ROOT_ENTITY",
        message: "BST should declare Root Pointer entity.",
        severity: SHARED_VERIFICATION_SEVERITY.WARNING,
        validator: "KVE",
      });
    }

    // 3. Operation Validation: SEARCH or INSERT
    const hasSearchOrInsert = ckr.rules.some((r) => r.operation === "SEARCH" || r.operation === "INSERT");
    if (!hasSearchOrInsert) {
      errors.push({
        code: "MISSING_BST_OPERATIONS",
        message: "BST concept must define SEARCH or INSERT operations.",
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

export const bstKveRuleValidator = new BstKveRuleValidator();
