import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
  SupportedTopicId,
} from "../../shared/contracts";
import { stackStateMachine } from "./machines/stack.machine";
import { queueStateMachine } from "./machines/queue.machine";
import { binarySearchStateMachine } from "./machines/binary-search.machine";
import { bubbleSortStateMachine } from "./machines/bubble-sort.machine";
import { linearSearchStateMachine } from "./machines/linear-search.machine";
import { linkedListStateMachine } from "./machines/linked-list.machine";
import { bstStateMachine } from "./machines/bst.machine";
import { selectionSortStateMachine } from "./machines/selection-sort.machine";
import { twoPointersStateMachine } from "./machines/two-pointers.machine";
import { bfsStateMachine } from "./machines/bfs.machine";
import { IStateMachine } from "./state-machine.types";

class StateMachineService {
  private machines = new Map<SupportedTopicId, IStateMachine>();

  constructor() {
    this.registerMachine(stackStateMachine);
    this.registerMachine(queueStateMachine);
    this.registerMachine(binarySearchStateMachine);
    this.registerMachine(bubbleSortStateMachine);
    this.registerMachine(linearSearchStateMachine);
    this.registerMachine(linkedListStateMachine);
    this.registerMachine(bstStateMachine);
    this.registerMachine(selectionSortStateMachine);
    this.registerMachine(twoPointersStateMachine);
    this.registerMachine(bfsStateMachine);
  }

  registerMachine(machine: IStateMachine): void {
    this.machines.set(machine.topicId, machine);
  }

  getMachine(topicId: SupportedTopicId): IStateMachine {
    const machine = this.machines.get(topicId);
    if (!machine) {
      throw new Error(`No state machine registered for topic "${topicId}".`);
    }
    return machine;
  }

  createInitialState(topicId: SupportedTopicId, values?: unknown[]): IStateSnapshot {
    return this.getMachine(topicId).createInitialState(values);
  }

  executeOperation(
    topicId: SupportedTopicId,
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    return this.getMachine(topicId).executeOperation(currentState, operation, stepIndex);
  }

  executeSequence(
    topicId: SupportedTopicId,
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    return this.getMachine(topicId).executeSequence(initialValues, operations);
  }
}

export const stateMachineService = new StateMachineService();

