import {
  IConceptKnowledge,
  IVerificationResult,
  SupportedTopicId,
} from "../../shared/contracts";

export interface IKveRuleValidator {
  topicId: SupportedTopicId;
  validate(ckr: IConceptKnowledge): IVerificationResult;
}
