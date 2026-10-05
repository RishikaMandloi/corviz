import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class TwoPointersStateMachine implements IStateMachine {
  readonly topicId = "TWO_POINTERS" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [10, 20, 30, 40, 50, 60];
    const left = 0;
    const right = elements.length - 1;

    return {
      elements,
      pointers: {
        left,
        right,
      },
      statusMessage: `Array [${elements.join(", ")}]. Left pointer at index ${left}, Right pointer at index ${right}. Ready to converge inward.`,
      metadata: {
        left,
        right,
        converged: false,
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    const elements = [...(currentState.elements as number[])];
    const left = Number(currentState.pointers.left ?? 0);
    const right = Number(currentState.pointers.right ?? elements.length - 1);

    if (left >= right) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: `Pointers met/crossed (left=${left}, right=${right}). Reversal algorithm complete.`,
          metadata: { converged: true },
        },
        affectedElementIds: [],
        explanation: `Pointers have converged (left >= right). The array reversal is complete in O(n/2) swaps.`,
        isValidTransition: true,
      };
    }

    const leftVal = elements[left];
    const rightVal = elements[right];

    // Swap elements[left] and elements[right]
    elements[left] = rightVal;
    elements[right] = leftVal;

    const nextLeft = left + 1;
    const nextRight = right - 1;

    const resultingState: IStateSnapshot = {
      elements,
      pointers: {
        left: nextLeft,
        right: nextRight,
      },
      statusMessage: `Swapped index ${left} (${leftVal}) and index ${right} (${rightVal}). Converged pointers: left=${nextLeft}, right=${nextRight}.`,
      metadata: {
        swappedIndices: [left, right],
        converged: nextLeft >= nextRight,
      },
    };

    return {
      stepIndex,
      operation: { type: "SWAP_AND_ADVANCE", payload: { left, right, leftVal, rightVal } },
      previousState: currentState,
      resultingState,
      affectedElementIds: [`elem_${left}`, `elem_${right}`],
      explanation: `Exchanged mirrored elements ${leftVal} (index ${left}) and ${rightVal} (index ${right}). Advanced left pointer rightward and retreated right pointer leftward.`,
      isValidTransition: true,
    };
  }

  executeSequence(
    initialValues?: unknown[],
    _operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const transitions: IStateTransition[] = [];
    let currentState = initialState;
    let step = 1;

    while (
      Number(currentState.pointers.left) < Number(currentState.pointers.right) &&
      step <= 5
    ) {
      const transition = this.executeOperation(
        currentState,
        { type: "SWAP_AND_ADVANCE" },
        step
      );
      transitions.push(transition);
      currentState = transition.resultingState;
      step++;
    }

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const twoPointersStateMachine = new TwoPointersStateMachine();
