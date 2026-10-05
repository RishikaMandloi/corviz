import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class BinarySearchStateMachine implements IStateMachine {
  readonly topicId = "BINARY_SEARCH" as const;

  createInitialState(values?: unknown[]): IStateSnapshot {
    const rawElements = Array.isArray(values) && values.length > 0 ? [...values] : [10, 20, 30, 40, 50, 60, 70];
    const elements = rawElements.map(Number).sort((a, b) => a - b);
    const low = 0;
    const high = elements.length - 1;
    const mid = Math.floor((low + high) / 2);

    return {
      elements,
      pointers: {
        low,
        high,
        mid,
      },
      statusMessage: `Sorted array with ${elements.length} elements. Initial search interval: [${low}..${high}], inspecting mid=${mid} (value: ${elements[mid]}).`,
      metadata: {
        target: 50,
        low,
        high,
        mid,
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
    const low = Number(currentState.pointers.low ?? 0);
    const high = Number(currentState.pointers.high ?? elements.length - 1);
    const target = Number(operation.payload?.target ?? currentState.metadata?.target ?? 50);

    if (low > high) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: `Search exhausted: target ${target} not found in array (low > high).`,
          metadata: { ...currentState.metadata, found: false, terminated: true },
        },
        affectedElementIds: [],
        explanation: `Target ${target} was not found. The search interval closed without matching any element.`,
        isValidTransition: true,
        edgeCaseTriggered: "ELEMENT_NOT_FOUND",
      };
    }

    const mid = Math.floor((low + high) / 2);
    const midVal = elements[mid];
    const affectedId = `elem_${mid}`;

    if (midVal === target) {
      const resultingState: IStateSnapshot = {
        elements,
        pointers: { low, high, mid },
        statusMessage: `Target ${target} found at mid index ${mid}!`,
        metadata: { target, low, high, mid, found: true, foundIndex: mid },
      };

      return {
        stepIndex,
        operation: { type: "SEARCH", payload: { target, mid, midVal } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Element at mid index ${mid} (${midVal}) matches target ${target}. Search successfully terminates in O(log n) time.`,
        isValidTransition: true,
      };
    } else if (target < midVal) {
      const nextHigh = mid - 1;
      const nextMid = Math.floor((low + nextHigh) / 2);

      const resultingState: IStateSnapshot = {
        elements,
        pointers: { low, high: nextHigh, mid: nextHigh >= low ? nextMid : null },
        statusMessage: `Target ${target} < mid ${midVal}. Discard right half. New interval: [${low}..${nextHigh}].`,
        metadata: { target, low, high: nextHigh, mid: nextMid, found: false },
      };

      return {
        stepIndex,
        operation: { type: "SEARCH", payload: { target, low, high: nextHigh, branch: "LEFT" } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Target ${target} is less than mid value ${midVal}. Since array is sorted, eliminate right half and update high to ${nextHigh}.`,
        isValidTransition: true,
      };
    } else {
      const nextLow = mid + 1;
      const nextMid = Math.floor((nextLow + high) / 2);

      const resultingState: IStateSnapshot = {
        elements,
        pointers: { low: nextLow, high, mid: nextLow <= high ? nextMid : null },
        statusMessage: `Target ${target} > mid ${midVal}. Discard left half. New interval: [${nextLow}..${high}].`,
        metadata: { target, low: nextLow, high, mid: nextMid, found: false },
      };

      return {
        stepIndex,
        operation: { type: "SEARCH", payload: { target, low: nextLow, high, branch: "RIGHT" } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [affectedId],
        explanation: `Target ${target} is greater than mid value ${midVal}. Since array is sorted, eliminate left half and update low to ${nextLow}.`,
        isValidTransition: true,
      };
    }
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const target = Number(operations?.[0]?.payload?.target ?? 50);
    initialState.metadata = { ...initialState.metadata, target };
    initialState.statusMessage = `Sorted array with ${initialState.elements.length} elements. Initial search interval: [${String(initialState.pointers.low)}..${String(initialState.pointers.high)}], searching for ${target}.`;

    const transitions: IStateTransition[] = [];
    let currentState = initialState;
    let step = 1;
    let low = Number(initialState.pointers.low);
    let high = Number(initialState.pointers.high);

    while (low <= high && step <= 10) {
      const transition = this.executeOperation(
        currentState,
        { type: "SEARCH", payload: { target } },
        step
      );
      transitions.push(transition);
      currentState = transition.resultingState;
      if (currentState.metadata?.found) break;
      low = Number(currentState.pointers.low);
      high = Number(currentState.pointers.high);
      step++;
    }

    return {
      initialState,
      transitions,
      finalState: currentState,
    };
  }
}

export const binarySearchStateMachine = new BinarySearchStateMachine();
