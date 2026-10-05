import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class LinkedListStateMachine implements IStateMachine {
  readonly topicId = "LINKED_LIST" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [10, 20, 30];
    const headPointer = elements.length > 0 ? 0 : null;

    return {
      elements,
      pointers: {
        head: headPointer,
      },
      statusMessage: `Singly Linked List initialized with ${elements.length} nodes: ${elements.join(" -> ")} -> null. Head points to index 0.`,
      metadata: {
        nodeCount: elements.length,
        isEmpty: elements.length === 0,
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    const opType = operation.type.toUpperCase();
    const prevElements = [...(currentState.elements as number[])];

    if (opType === "INSERT_HEAD") {
      const value = Number(operation.payload?.value ?? 5);
      const newElements = [value, ...prevElements];
      const affectedId = "node_0";

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          head: 0,
        },
        statusMessage: `Inserted node ${value} at HEAD. List is now ${newElements.join(" -> ")} -> null.`,
        metadata: {
          nodeCount: newElements.length,
          lastAction: "INSERT_HEAD",
          lastInsertedValue: value,
        },
      };

      return {
        stepIndex,
        operation: { type: "INSERT_HEAD", payload: { value } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Allocated new node with value ${value}. Linked new node's next pointer to previous head (${prevElements[0] ?? "null"}), then updated HEAD pointer to the new node in O(1) time.`,
        isValidTransition: true,
      };
    }

    if (opType === "DELETE_HEAD") {
      if (prevElements.length === 0) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: currentState,
          affectedElementIds: [],
          explanation: "Cannot delete head from an empty linked list.",
          isValidTransition: false,
          edgeCaseTriggered: "EMPTY_LIST_DELETION",
        };
      }

      const deletedVal = prevElements[0];
      const newElements = prevElements.slice(1);
      const newHead = newElements.length > 0 ? 0 : null;

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          head: newHead,
        },
        statusMessage: `Deleted HEAD node ${deletedVal}. List is now ${newElements.length > 0 ? newElements.join(" -> ") + " -> null" : "EMPTY (null)"}.`,
        metadata: {
          nodeCount: newElements.length,
          lastAction: "DELETE_HEAD",
          lastDeletedValue: deletedVal,
        },
      };

      return {
        stepIndex,
        operation: { type: "DELETE_HEAD" },
        previousState: currentState,
        resultingState,
        affectedElementIds: ["node_0"],
        explanation: `Removed node ${deletedVal} by repointing the HEAD reference to HEAD.next (${newElements[0] ?? "null"}) in O(1) time.`,
        isValidTransition: true,
      };
    }

    throw new Error(`Unsupported operation "${operation.type}" for Linked List state machine.`);
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const defaultOps: IStateOperation[] =
      operations && operations.length > 0
        ? operations
        : [
            { type: "INSERT_HEAD", payload: { value: 5 } },
            { type: "DELETE_HEAD" },
            { type: "INSERT_HEAD", payload: { value: 2 } },
          ];

    const initialState = this.createInitialState(initialValues);
    const transitions: IStateTransition[] = [];
    let currentState = initialState;

    defaultOps.forEach((op, idx) => {
      const transition = this.executeOperation(currentState, op, idx + 1);
      transitions.push(transition);
      currentState = transition.resultingState;
    });

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const linkedListStateMachine = new LinkedListStateMachine();
