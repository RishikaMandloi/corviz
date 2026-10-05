import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class SelectionSortStateMachine implements IStateMachine {
  readonly topicId = "SELECTION_SORT" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [64, 25, 12, 22, 11];

    return {
      elements,
      pointers: {
        sortedBoundary: 0,
        minIdx: 4,
      },
      statusMessage: `Unsorted array [${elements.join(", ")}]. Sorted partition length is 0. Ready to find minimum in range [0..${elements.length - 1}].`,
      metadata: {
        sortedBoundary: 0,
        swapsCount: 0,
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    const elements = [...(currentState.elements as number[])];
    const boundary = Number(operation.payload?.i ?? currentState.pointers.sortedBoundary ?? 0);

    if (boundary >= elements.length - 1) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: currentState,
        affectedElementIds: [],
        explanation: "Array is completely sorted.",
        isValidTransition: true,
      };
    }

    // Find minimum in subarray [boundary .. elements.length - 1]
    let minIdx = boundary;
    for (let k = boundary + 1; k < elements.length; k++) {
      if (elements[k] < elements[minIdx]) {
        minIdx = k;
      }
    }

    const minVal = elements[minIdx];
    const boundaryVal = elements[boundary];

    // Swap elements[boundary] and elements[minIdx]
    elements[minIdx] = boundaryVal;
    elements[boundary] = minVal;
    const nextBoundary = boundary + 1;

    const resultingState: IStateSnapshot = {
      elements,
      pointers: {
        sortedBoundary: nextBoundary,
        minIdx,
      },
      statusMessage: `Found minimum ${minVal} at index ${minIdx}. Swapped with index ${boundary}. Sorted prefix is now [${elements.slice(0, nextBoundary).join(", ")}].`,
      metadata: {
        sortedBoundary: nextBoundary,
        lastSwapped: [boundaryVal, minVal],
      },
    };

    return {
      stepIndex,
      operation: { type: "FIND_MIN_AND_SWAP", payload: { i: boundary, minIdx, minVal } },
      previousState: currentState,
      resultingState,
      affectedElementIds: [`elem_${boundary}`, `elem_${minIdx}`],
      explanation: `Identified minimum element ${minVal} at index ${minIdx} in unsorted subarray. Swapped into boundary position ${boundary}. Sorted prefix grows by 1.`,
      isValidTransition: true,
    };
  }

  executeSequence(
    initialValues?: unknown[],
    _operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const elements = initialState.elements as number[];
    const transitions: IStateTransition[] = [];
    let currentState = initialState;

    const stepsToRun = Math.min(3, elements.length - 1);
    for (let i = 0; i < stepsToRun; i++) {
      const transition = this.executeOperation(
        currentState,
        { type: "FIND_MIN_AND_SWAP", payload: { i } },
        i + 1
      );
      transitions.push(transition);
      currentState = transition.resultingState;
    }

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const selectionSortStateMachine = new SelectionSortStateMachine();
