import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class TwoPointersKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "TWO_POINTERS" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: CONVERGING_TRAJECTORY
    const convInvariant = ckr.invariants.find(
      (inv) => inv.id === "CONVERGING_TRAJECTORY" || inv.rule.toLowerCase().includes("converging")
    );
    if (!convInvariant) {
      errors.push({
        code: "MISSING_CONVERGING_TRAJECTORY_INVARIANT",
        message: "Two Pointers concept must declare the converging trajectory invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Entity Validation: Left and Right pointers
    const hasLeft = ckr.entities.some((e) => e.id.includes("left"));
    const hasRight = ckr.entities.some((e) => e.id.includes("right"));
    if (!hasLeft || !hasRight) {
      errors.push({
        code: "MISSING_LEFT_RIGHT_POINTERS",
        message: "Two pointers requires both Left and Right pointer entities.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 3. Operation Validation: SWAP_AND_ADVANCE
    const op = ckr.rules.find((r) => r.operation === "SWAP_AND_ADVANCE" || r.operation === "ADVANCE");
    if (!op) {
      errors.push({
        code: "MISSING_SWAP_ADVANCE_OPERATION",
        message: "Two pointers must define SWAP_AND_ADVANCE operation.",
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

export const twoPointersKveRuleValidator = new TwoPointersKveRuleValidator();
