import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class LinearSearchStateMachine implements IStateMachine {
  readonly topicId = "LINEAR_SEARCH" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [14, 28, 42, 56, 70];
    return {
      elements,
      pointers: {
        currentIndex: 0,
      },
      statusMessage: `Linear search initialized on [${elements.join(", ")}]. Target is 42. Search starts at index 0.`,
      metadata: {
        target: 42,
        found: false,
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    const elements = currentState.elements as number[];
    const idx = Number(operation.payload?.index ?? currentState.pointers.currentIndex ?? 0);
    const target = Number(operation.payload?.target ?? currentState.metadata?.target ?? 42);

    if (idx >= elements.length) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: `End of array reached. Target ${target} was not found.`,
          metadata: { ...currentState.metadata, found: false, terminated: true },
        },
        affectedElementIds: [],
        explanation: `Index ${idx} is beyond array boundary. Target ${target} does not exist in array.`,
        isValidTransition: true,
        edgeCaseTriggered: "NOT_FOUND",
      };
    }

    const currentVal = elements[idx];
    const isMatch = currentVal === target;
    const nextIdx = isMatch ? idx : idx + 1;

    const resultingState: IStateSnapshot = {
      elements,
      pointers: {
        currentIndex: nextIdx,
      },
      statusMessage: isMatch
        ? `Match found! Element at index ${idx} equals target ${target}.`
        : `Index ${idx} (value ${currentVal}) != target ${target}. Advance to index ${nextIdx}.`,
      metadata: {
        target,
        found: isMatch,
        inspectedIndex: idx,
        inspectedValue: currentVal,
      },
    };

    return {
      stepIndex,
      operation: { type: "SEARCH", payload: { index: idx, value: currentVal, isMatch } },
      previousState: currentState,
      resultingState,
      affectedElementIds: [`elem_${idx}`],
      explanation: isMatch
        ? `Inspected index ${idx} with value ${currentVal}. Matches target ${target}! Search halts successfully in O(k) steps.`
        : `Inspected index ${idx} with value ${currentVal}. Does not match target ${target}. Increment search pointer to next element.`,
      isValidTransition: true,
    };
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const elements = initialState.elements as number[];
    const target = Number(operations?.[0]?.payload?.target ?? 42);
    initialState.metadata = { ...initialState.metadata, target };
    initialState.statusMessage = `Linear search initialized on [${elements.join(", ")}]. Target is ${target}. Search starts at index 0.`;
    const transitions: IStateTransition[] = [];
    let currentState = initialState;
    let step = 1;

    for (let i = 0; i < elements.length; i++) {
      const transition = this.executeOperation(
        currentState,
        { type: "SEARCH", payload: { index: i, target } },
        step
      );
      transitions.push(transition);
      currentState = transition.resultingState;
      if (currentState.metadata?.found) break;
      step++;
    }

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const linearSearchStateMachine = new LinearSearchStateMachine();
