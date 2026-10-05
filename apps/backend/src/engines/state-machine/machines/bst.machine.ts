import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class BstStateMachine implements IStateMachine {
  readonly topicId = "BST" as const;

  private relations(elements: unknown[]): Array<{ parentIndex: number | null; leftIndex: number | null; rightIndex: number | null }> {
    const relations = elements.map(() => ({ parentIndex: null as number | null, leftIndex: null as number | null, rightIndex: null as number | null }));
    for (let index = 1; index < elements.length; index++) {
      let parent = 0;
      while (true) {
        const branch = Number(elements[index]) < Number(elements[parent]) ? "leftIndex" : "rightIndex";
        const child = relations[parent][branch];
        if (child === null) {
          relations[parent][branch] = index;
          relations[index].parentIndex = parent;
          break;
        }
        parent = child;
      }
    }
    return relations;
  }

  createInitialState(values?: unknown[]): IStateSnapshot {
    const elements = Array.isArray(values) && values.length > 0 ? [...values].map(Number) : [40, 20, 60];

    return {
      elements,
      pointers: {
        root: 0,
        current: 0,
      },
      statusMessage: `BST initialized with root node ${elements[0]} and ${elements.length} nodes. Insertion-order topology satisfies the BST ordering rule.`,
      metadata: {
        rootValue: elements[0],
        treeNodes: elements,
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

    if (opType === "INSERT") {
      const rawValue = operation.payload?.value ?? 50;
      const val = Number(rawValue);
      if (!Number.isFinite(val)) throw new Error("BST INSERT requires a finite numeric value.");
      let parentIndex = 0;
      const path: number[] = [];
      let branch: "LEFT" | "RIGHT" = "LEFT";
      if (prevElements.length > 0) {
        const relations = this.relations(prevElements);
        while (true) {
          path.push(parentIndex);
          const parentValue = Number(prevElements[parentIndex]);
          if (val === parentValue) {
            return {
              stepIndex,
              operation,
              previousState: currentState,
              resultingState: currentState,
              affectedElementIds: [],
              explanation: `BST already contains ${val}; duplicate insertion was rejected.`,
              isValidTransition: false,
              edgeCaseTriggered: "DUPLICATE_BST_KEY",
            };
          }
          branch = val < parentValue ? "LEFT" : "RIGHT";
          const childIndex = relations[parentIndex][branch === "LEFT" ? "leftIndex" : "rightIndex"];
          if (childIndex === null) break;
          parentIndex = childIndex;
        }
      }

      const newElements = [...prevElements, val];
      const newIdx = newElements.length - 1;
      const relations = this.relations(newElements);
      const parentValue = prevElements[parentIndex];

      const resultingState: IStateSnapshot = {
        elements: newElements,
        pointers: {
          root: 0,
          current: newIdx,
        },
        statusMessage: prevElements.length === 0
          ? `Inserted ${val} as the BST root.`
          : `Inserted node ${val} as the ${branch.toLowerCase()} child of ${parentValue} at node index ${parentIndex}. BST invariant preserved.`,
        metadata: {
          rootValue: newElements[0],
          lastInserted: val,
          branch,
          parentIndex: prevElements.length === 0 ? null : parentIndex,
          traversalPath: path,
          treeNodes: newElements,
          treeRelations: relations,
        },
      };

      return {
        stepIndex,
        operation: { type: "INSERT", payload: { value: val, branch } },
        previousState: currentState,
        resultingState,
        affectedElementIds: [`node_${newIdx}`],
        explanation: prevElements.length === 0
          ? `The tree was empty, so ${val} becomes the root.`
          : `Compared ${val} along the insertion path ${path.map((index) => `${prevElements[index]} at node ${index}`).join(" → ")}. The first empty ${branch.toLowerCase()} child belongs to ${parentValue}, so ${val} is attached there.`,
        isValidTransition: true,
      };
    }

    if (opType === "SEARCH") {
      const target = Number(operation.payload?.target ?? 20);
      if (!Number.isFinite(target)) throw new Error("BST SEARCH requires a finite numeric target.");
      const relations = this.relations(prevElements);
      const path: number[] = [];
      let current: number | null = prevElements.length > 0 ? 0 : null;
      let foundIdx = -1;
      while (current !== null) {
        path.push(current);
        const value = Number(prevElements[current]);
        if (target === value) {
          foundIdx = current;
          break;
        }
        const side = target < value ? "leftIndex" : "rightIndex";
        current = relations[current][side];
      }
      const isFound = foundIdx !== -1;

      const resultingState: IStateSnapshot = {
        elements: prevElements,
        pointers: {
          root: 0,
          current: isFound ? foundIdx : null,
        },
        statusMessage: isFound
          ? `Found target key ${target} at node index ${foundIdx}.`
          : `Target key ${target} not found in BST.`,
        metadata: {
          target,
          found: isFound,
          traversalPath: path,
          treeNodes: prevElements,
          treeRelations: relations,
        },
      };

      return {
        stepIndex,
        operation: { type: "SEARCH", payload: { target } },
        previousState: currentState,
        resultingState,
        affectedElementIds: isFound ? [`node_${foundIdx}`] : [],
        explanation: isFound
          ? `Compared ${target} along BST path ${path.map((index) => `${prevElements[index]} at node ${index}`).join(" → ")}; the key matches node ${foundIdx}.`
          : `Compared ${target} along BST path ${path.map((index) => `${prevElements[index]} at node ${index}`).join(" → ")}; the next required child is null, so the key is not present.`,
        isValidTransition: true,
      };
    }

    throw new Error(`Unsupported operation "${operation.type}" for BST state machine.`);
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const defaultOps: IStateOperation[] =
      operations && operations.length > 0
        ? operations
        : [
          { type: "INSERT", payload: { value: 55 } },
            { type: "SEARCH", payload: { target: 20 } },
            { type: "INSERT", payload: { value: 10 } },
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

export const bstStateMachine = new BstStateMachine();
