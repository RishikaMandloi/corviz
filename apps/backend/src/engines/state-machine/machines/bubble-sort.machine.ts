import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class BubbleSortStateMachine implements IStateMachine {
  readonly topicId = "BUBBLE_SORT" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [50, 20, 40, 10, 30];

    return {
      elements,
      pointers: {
        j: 0,
        jPlus1: 1,
        sortedBoundary: elements.length,
      },
      statusMessage: `Unsorted array [${elements.join(", ")}]. Ready to compare adjacent pair at indices (0, 1).`,
      metadata: {
        pass: 0,
        swapsCount: 0,
        isSorted: false,
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    const elements = [...(currentState.elements as number[])];
    const j = Number(operation.payload?.j ?? currentState.pointers.j ?? 0);
    const jPlus1 = j + 1;
    const sortedBoundary = Number(currentState.pointers.sortedBoundary ?? elements.length);

    if (j >= elements.length - 1) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: currentState,
        affectedElementIds: [],
        explanation: "Pass complete.",
        isValidTransition: true,
      };
    }

    const valA = elements[j];
    const valB = elements[jPlus1];
    const needsSwap = valA > valB;

    if (needsSwap) {
      elements[j] = valB;
      elements[jPlus1] = valA;
    }

    const resultingState: IStateSnapshot = {
      elements,
      pointers: {
        j,
        jPlus1,
        sortedBoundary,
      },
      statusMessage: needsSwap
        ? `Swapped ${valA} and ${valB} because ${valA} > ${valB}.`
        : `Kept ${valA} and ${valB} because ${valA} <= ${valB}.`,
      metadata: {
        lastCompared: [valA, valB],
        swapped: needsSwap,
      },
    };

    return {
      stepIndex,
      operation: { type: "COMPARE_AND_SWAP", payload: { j, jPlus1, swapped: needsSwap } },
      previousState: currentState,
      resultingState,
      affectedElementIds: [`elem_${j}`, `elem_${jPlus1}`],
      explanation: needsSwap
        ? `Compared adjacent indices ${j} and ${jPlus1} (${valA} > ${valB}). Exchanged their positions to bubble larger element rightward.`
        : `Compared adjacent indices ${j} and ${jPlus1} (${valA} <= ${valB}). Pair is already in non-decreasing order; no swap performed.`,
      isValidTransition: true,
    };
  }

  executeSequence(
    initialValues?: unknown[],
    _operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const arr = [...(initialState.elements as number[])];
    const n = arr.length;
    const transitions: IStateTransition[] = [];
    let currentState = initialState;
    let step = 1;

    // Run first 2 passes or until 5-6 steps to keep visual lesson concise and impactful
    for (let pass = 0; pass < Math.min(2, n - 1); pass++) {
      for (let j = 0; j < n - 1 - pass; j++) {
        if (step > 6) break;
        const transition = this.executeOperation(
          currentState,
          { type: "COMPARE_AND_SWAP", payload: { j, pass } },
          step
        );
        transitions.push(transition);
        currentState = transition.resultingState;
        step++;
      }
    }

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const bubbleSortStateMachine = new BubbleSortStateMachine();
