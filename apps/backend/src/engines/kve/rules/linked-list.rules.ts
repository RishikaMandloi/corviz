import {
  IConceptKnowledge,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IKveRuleValidator } from "../kve.types";

export class LinkedListKveRuleValidator implements IKveRuleValidator {
  readonly topicId = "LINKED_LIST" as const;

  validate(ckr: IConceptKnowledge): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // 1. Invariant Validation: HEAD_ACCURACY
    const headInvariant = ckr.invariants.find(
      (inv) => inv.id === "HEAD_ACCURACY" || inv.rule.toLowerCase().includes("head pointer")
    );
    if (!headInvariant) {
      errors.push({
        code: "MISSING_HEAD_ACCURACY_INVARIANT",
        message: "Linked list must declare and enforce Head pointer accuracy invariant.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    // 2. Operation Validation: INSERT_HEAD & DELETE_HEAD target HEAD
    const insertHead = ckr.rules.find((r) => r.operation === "INSERT_HEAD");
    if (!insertHead) {
      errors.push({
        code: "MISSING_INSERT_HEAD_OPERATION",
        message: "Linked list must define INSERT_HEAD operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    } else if (insertHead.targetSlot.toUpperCase() !== "HEAD") {
      errors.push({
        code: "INVALID_INSERT_TARGET",
        message: `INSERT_HEAD must target HEAD, but targets "${insertHead.targetSlot}".`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    }

    const deleteHead = ckr.rules.find((r) => r.operation === "DELETE_HEAD");
    if (!deleteHead) {
      errors.push({
        code: "MISSING_DELETE_HEAD_OPERATION",
        message: "Linked list must define DELETE_HEAD operation.",
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "KVE",
      });
    } else if (deleteHead.targetSlot.toUpperCase() !== "HEAD") {
      errors.push({
        code: "INVALID_DELETE_TARGET",
        message: `DELETE_HEAD must target HEAD, but targets "${deleteHead.targetSlot}".`,
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

export const linkedListKveRuleValidator = new LinkedListKveRuleValidator();
