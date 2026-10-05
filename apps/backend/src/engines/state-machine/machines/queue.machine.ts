import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class QueueStateMachine implements IStateMachine {
  readonly topicId = "QUEUE" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) ? [...values] : [10, 20, 30];
    const frontIndex = elements.length > 0 ? 0 : null;
    const rearIndex = elements.length > 0 ? elements.length - 1 : null;

    return {
      elements,
      pointers: {
        front: frontIndex,
        rear: rearIndex,
      },
      statusMessage:
        elements.length > 0
          ? `Queue initialized with ${elements.length} elements. Front is ${elements[0]} at index 0, Rear is ${elements[elements.length - 1]} at index ${rearIndex}.`
          : "Queue initialized as EMPTY. Front and Rear pointers are null.",
      metadata: {
        capacity: 10,
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
    const prevElements = [...currentState.elements];
    const capacity = (currentState.metadata?.capacity as number) ?? 10;

    if (opType === "ENQUEUE") {
      const value = operation.payload?.value ?? (prevElements.length + 1) * 10;

      if (prevElements.length >= capacity) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: {
            ...currentState,
            statusMessage: `Queue Overflow: Cannot enqueue ${value}. Capacity limit of ${capacity} reached.`,
          },
          affectedElementIds: [],
          explanation: `Queue Overflow triggered. Maximum capacity of ${capacity} elements exceeded.`,
          isValidTransition: false,
          edgeCaseTriggered: "QUEUE_OVERFLOW",
        };
      }

      const newElements = [...prevElements, value];
      const newRear = newElements.length - 1;
      const newFront = 0;
      const affectedId = `elem_${newRear}`;

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          front: newFront,
          rear: newRear,
        },
        statusMessage: `Enqueued ${value} at rear index ${newRear}. Front remains at index 0 (${newElements[0]}).`,
        metadata: {
          capacity,
          isEmpty: false,
          lastAction: "ENQUEUE",
          lastValue: value,
        },
      };

      return {
        stepIndex,
        operation: { type: "ENQUEUE", payload: { value } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Enqueued element with value ${value} at the Rear (index ${newRear}). In FIFO, new elements always join at the tail of the queue.`,
        isValidTransition: true,
      };
    }

    if (opType === "DEQUEUE") {
      if (prevElements.length === 0) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: {
            ...currentState,
            statusMessage: "Queue Underflow: Cannot dequeue from an empty queue.",
          },
          affectedElementIds: [],
          explanation: "Queue Underflow triggered. Calling Dequeue() on an empty queue is an invalid operation.",
          isValidTransition: false,
          edgeCaseTriggered: "QUEUE_UNDERFLOW",
        };
      }

      const dequeuedValue = prevElements[0];
      const newElements = prevElements.slice(1);
      const newFront = newElements.length > 0 ? 0 : null;
      const newRear = newElements.length > 0 ? newElements.length - 1 : null;
      const affectedId = "elem_0";

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          front: newFront,
          rear: newRear,
        },
        statusMessage: `Dequeued ${dequeuedValue} from front. New front is ${newFront !== null ? newElements[0] : "null (EMPTY)"}.`,
        metadata: {
          capacity,
          isEmpty: newElements.length === 0,
          lastAction: "DEQUEUE",
          lastDequeuedValue: dequeuedValue,
        },
      };

      return {
        stepIndex,
        operation: { type: "DEQUEUE" },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Dequeued front element ${dequeuedValue} from index 0. In accordance with FIFO, the oldest element is removed first.`,
        isValidTransition: true,
      };
    }

    if (opType === "PEEK") {
      if (prevElements.length === 0) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: currentState,
          affectedElementIds: [],
          explanation: "Queue Underflow: Cannot peek at an empty queue.",
          isValidTransition: false,
          edgeCaseTriggered: "QUEUE_UNDERFLOW",
        };
      }

      const frontValue = prevElements[0];
      return {
        stepIndex,
        operation: { type: "PEEK" },
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: `Peeked at front element ${frontValue} (index 0). Queue unchanged.`,
        },
        affectedElementIds: ["elem_0"],
        explanation: `Peek inspected front element ${frontValue}. The queue structure, size, and pointers remain unchanged.`,
        isValidTransition: true,
      };
    }

    throw new Error(`Unsupported operation "${operation.type}" for Queue state machine.`);
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const defaultOps: IStateOperation[] =
      operations && operations.length > 0
        ? operations
        : [
            { type: "ENQUEUE", payload: { value: 40 } },
            { type: "DEQUEUE" },
            { type: "ENQUEUE", payload: { value: 50 } },
          ];

    const initialState = this.createInitialState(initialValues);
    const transitions: IStateTransition[] = [];
    let currentState = initialState;

    defaultOps.forEach((op, index) => {
      const transition = this.executeOperation(currentState, op, index + 1);
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

export const queueStateMachine = new QueueStateMachine();
