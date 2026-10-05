import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class StackStateMachine implements IStateMachine {
  readonly topicId = "STACK" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) ? [...values] : [10, 20, 30];
    const topIndex = elements.length > 0 ? elements.length - 1 : null;

    return {
      elements,
      pointers: {
        top: topIndex,
      },
      statusMessage:
        elements.length > 0
          ? `Stack initialized with ${elements.length} elements. Top is ${elements[elements.length - 1]} at index ${topIndex}.`
          : "Stack initialized as EMPTY. Top pointer is null (-1).",
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
    const prevTop = currentState.pointers.top as number | null;

    if (opType === "PUSH") {
      const value = operation.payload?.value ?? (prevElements.length + 1) * 10;
      const capacity = (currentState.metadata?.capacity as number) ?? 10;

      if (prevElements.length >= capacity) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: {
            ...currentState,
            statusMessage: `Stack Overflow: Cannot push ${value}. Capacity limit of ${capacity} reached.`,
          },
          affectedElementIds: [],
          explanation: `Stack Overflow triggered. Maximum capacity of ${capacity} elements exceeded.`,
          isValidTransition: false,
          edgeCaseTriggered: "STACK_OVERFLOW",
        };
      }

      const newElements = [...prevElements, value];
      const newTop = newElements.length - 1;
      const affectedId = `elem_${newTop}`;

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          top: newTop,
        },
        statusMessage: `Pushed ${value} onto stack. Top updated to index ${newTop}.`,
        metadata: {
          capacity,
          isEmpty: false,
          lastAction: "PUSH",
          lastValue: value,
        },
      };

      return {
        stepIndex,
        operation: { type: "PUSH", payload: { value } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Pushed element with value ${value} onto the stack. It enters via the top aperture and becomes the new Top at index ${newTop}.`,
        isValidTransition: true,
      };
    }

    if (opType === "POP") {
      if (prevElements.length === 0) {
        return {
          stepIndex,
          operation,
          previousState: currentState,
          resultingState: {
            ...currentState,
            statusMessage: "Stack Underflow: Cannot pop from an empty stack.",
          },
          affectedElementIds: [],
          explanation:
            "Stack Underflow triggered. Calling Pop() on an empty stack is an invalid operation.",
          isValidTransition: false,
          edgeCaseTriggered: "STACK_UNDERFLOW",
        };
      }

      const poppedValue = prevElements[prevElements.length - 1];
      const newElements = prevElements.slice(0, -1);
      const newTop = newElements.length > 0 ? newElements.length - 1 : null;
      const affectedId = `elem_${prevTop}`;

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          top: newTop,
        },
        statusMessage: `Popped ${poppedValue} from stack. New top is ${newTop !== null ? newElements[newTop] : "null (EMPTY)"}.`,
        metadata: {
          capacity: (currentState.metadata?.capacity as number) ?? 10,
          isEmpty: newElements.length === 0,
          lastAction: "POP",
          lastPoppedValue: poppedValue,
        },
      };

      return {
        stepIndex,
        operation: { type: "POP" },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Popped top element ${poppedValue} from index ${prevTop}. In accordance with LIFO, only the top element is removed.`,
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
          explanation: "Stack Underflow: Cannot peek at an empty stack.",
          isValidTransition: false,
          edgeCaseTriggered: "STACK_UNDERFLOW",
        };
      }

      const topValue = prevElements[prevElements.length - 1];
      return {
        stepIndex,
        operation: { type: "PEEK" },
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: `Peeked at top element ${topValue} (index ${prevTop}). Stack unchanged.`,
        },
        affectedElementIds: [`elem_${prevTop}`],
        explanation: `Peek inspected the top element ${topValue}. The stack structure, size, and top pointer remain unchanged.`,
        isValidTransition: true,
      };
    }

    throw new Error(`Unsupported operation "${operation.type}" for Stack state machine.`);
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const defaultOps: IStateOperation[] = operations && operations.length > 0
      ? operations
      : [
          { type: "PUSH", payload: { value: 40 } },
          { type: "POP" },
          { type: "PUSH", payload: { value: 50 } },
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

export const stackStateMachine = new StackStateMachine();

