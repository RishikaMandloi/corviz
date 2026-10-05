import {
  IConceptKnowledge,
  IDryRunTrace,
  IScenePlan,
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
  IVerificationResult,
  IVerifiedQuiz,
  SupportedTopicId,
} from "../../shared/contracts";

export interface ITopicHandler {
  topicId: SupportedTopicId;
  getCkr(): IConceptKnowledge;
  verifyCkr(ckr: IConceptKnowledge): IVerificationResult;
  createInitialState(values?: unknown[]): IStateSnapshot;
  executeOperation(state: IStateSnapshot, op: IStateOperation, stepIndex: number): IStateTransition;
  createExecutionTrace(initialValues?: unknown[], ops?: IStateOperation[]): IStateExecutionTrace;
  createScenePlan(trace: IStateExecutionTrace): IScenePlan;
  verifySemanticSceneGraph(sceneGraph: unknown, trace: IStateExecutionTrace): IVerificationResult;
  generateDryRun(trace: IStateExecutionTrace): IDryRunTrace;
  generateQuiz(trace: IStateExecutionTrace, ckr: IConceptKnowledge): IVerifiedQuiz;
}
