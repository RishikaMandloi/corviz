import {
  ISceneGraph,
  IVerificationResult,
  IStateExecutionTrace,
  SupportedTopicId,
} from "../../shared/contracts";

export interface IVkveSemanticValidator {
  topicId: SupportedTopicId;
  validateSemanticSceneGraph(
    sceneGraph: ISceneGraph,
    trace: IStateExecutionTrace
  ): IVerificationResult;
}

