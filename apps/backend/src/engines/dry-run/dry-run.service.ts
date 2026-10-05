import {
  IDryRunRow,
  IDryRunTrace,
  IStateExecutionTrace,
  SupportedTopicId,
} from "../../shared/contracts";

class DryRunService {
  /**
   * Generate deterministic dry run table directly from the execution trace.
   */
  generateDryRun(topicId: SupportedTopicId, trace: IStateExecutionTrace): IDryRunTrace {
    const columns = this.getColumnsForTopic(topicId);
    const rows: IDryRunRow[] = [];

    // Step 0: Initial State
    rows.push({
      step: 0,
      operation: "INITIALIZE",
      stateRepresentation: this.formatState(trace.initialState.elements),
      variables: {
        count: trace.initialState.elements.length,
        ...trace.initialState.pointers,
      },
      description: trace.initialState.statusMessage,
      highlighted: false,
    });

    // Each Transition
    trace.transitions.forEach((t) => {
      const opText = t.operation.payload?.value !== undefined
        ? `${t.operation.type}(${t.operation.payload.value})`
        : t.operation.payload?.target !== undefined
        ? `${t.operation.type}(target=${t.operation.payload.target})`
        : t.operation.type;

      rows.push({
        step: t.stepIndex,
        operation: opText,
        stateRepresentation: this.formatState(t.resultingState.elements),
        variables: {
          count: t.resultingState.elements.length,
          ...t.resultingState.pointers,
          valid: t.isValidTransition,
        },
        description: t.explanation,
        highlighted: true,
      });
    });

    return {
      topicId,
      columns,
      rows,
    };
  }

  private formatState(elements: unknown[]): string {
    return `[${elements.join(", ")}]`;
  }

  private getColumnsForTopic(topicId: SupportedTopicId): string[] {
    switch (topicId) {
      case "STACK":
        return ["Step", "Operation", "Elements", "Top Pointer", "Action Description"];
      case "QUEUE":
        return ["Step", "Operation", "Elements", "Front / Rear", "Action Description"];
      case "BINARY_SEARCH":
        return ["Step", "Operation", "Elements", "Low / Mid / High", "Action Description"];
      case "BUBBLE_SORT":
        return ["Step", "Operation", "Elements", "Compared Pair (j, j+1)", "Action Description"];
      case "LINEAR_SEARCH":
        return ["Step", "Operation", "Elements", "Index i", "Action Description"];
      case "LINKED_LIST":
        return ["Step", "Operation", "Nodes", "Head Pointer", "Action Description"];
      case "BST":
        return ["Step", "Operation", "Tree Nodes", "Root / Current", "Action Description"];
      case "SELECTION_SORT":
        return ["Step", "Operation", "Elements", "Boundary / Min", "Action Description"];
      case "TWO_POINTERS":
        return ["Step", "Operation", "Elements", "Left / Right", "Action Description"];
      case "BFS":
        return ["Step", "Operation", "Vertices", "Queue Front", "Action Description"];
      default:
        return ["Step", "Operation", "State", "Pointers", "Action Description"];
    }
  }
}

export const dryRunService = new DryRunService();
