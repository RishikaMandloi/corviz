import { IConceptKnowledge, SupportedTopicId } from "../../shared/contracts";

export interface ICkrProvider {
  topicId: SupportedTopicId;
  getCkr(): IConceptKnowledge;
}
