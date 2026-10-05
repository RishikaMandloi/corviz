import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
  SupportedTopicId,
} from "../../shared/contracts";

export interface IStateMachine {
  topicId: SupportedTopicId;
  createInitialState(values?: unknown[]): IStateSnapshot;
  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition;
  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace;
}

