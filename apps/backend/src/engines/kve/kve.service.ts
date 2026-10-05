import {
  IConceptKnowledge,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
  SupportedTopicId,
} from "../../shared/contracts";
import { IKveRuleValidator } from "./kve.types";
import { stackKveRuleValidator } from "./rules/stack.rules";
import { queueKveRuleValidator } from "./rules/queue.rules";
import { binarySearchKveRuleValidator } from "./rules/binary-search.rules";
import { bubbleSortKveRuleValidator } from "./rules/bubble-sort.rules";
import { linearSearchKveRuleValidator } from "./rules/linear-search.rules";
import { linkedListKveRuleValidator } from "./rules/linked-list.rules";
import { bstKveRuleValidator } from "./rules/bst.rules";
import { selectionSortKveRuleValidator } from "./rules/selection-sort.rules";
import { twoPointersKveRuleValidator } from "./rules/two-pointers.rules";
import { bfsKveRuleValidator } from "./rules/bfs.rules";

class KveService {
  private validators = new Map<SupportedTopicId, IKveRuleValidator>();

  constructor() {
    this.registerValidator(stackKveRuleValidator);
    this.registerValidator(queueKveRuleValidator);
    this.registerValidator(binarySearchKveRuleValidator);
    this.registerValidator(bubbleSortKveRuleValidator);
    this.registerValidator(linearSearchKveRuleValidator);
    this.registerValidator(linkedListKveRuleValidator);
    this.registerValidator(bstKveRuleValidator);
    this.registerValidator(selectionSortKveRuleValidator);
    this.registerValidator(twoPointersKveRuleValidator);
    this.registerValidator(bfsKveRuleValidator);
  }

  registerValidator(validator: IKveRuleValidator): void {
    this.validators.set(validator.topicId, validator);
  }

  verifyConcept(ckr: IConceptKnowledge): IVerificationResult {
    const validator = this.validators.get(ckr.topicId);
    if (!validator) {
      return {
        valid: false,
        status: SHARED_VERIFICATION_STATUS.FAILED,
        confidenceScore: 0,
        errors: [
          {
            code: "NO_KVE_VALIDATOR_REGISTERED",
            message: `No deterministic KVE rule validator registered for topic "${ckr.topicId}".`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "KVE",
            expected: `Registered validator for ${ckr.topicId}`,
            actual: "None found",
          },
        ],
        warnings: [],
        checkedAt: new Date().toISOString(),
      };
    }

    return validator.validate(ckr);
  }
}

export const kveService = new KveService();
