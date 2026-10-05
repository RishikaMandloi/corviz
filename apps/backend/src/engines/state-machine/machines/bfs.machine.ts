import {
  IStateExecutionTrace,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
} from "../../../shared/contracts";
import { IStateMachine } from "../state-machine.types";

export class BfsStateMachine implements IStateMachine {
  readonly topicId = "BFS" as const;

  private readonly defaultGraph: Record<string, string[]> = {
    A: ["B", "C"],
    B: ["D"],
    C: ["E"],
    D: [],
    E: [],
  };

  createInitialState(values?: unknown[]): IStateSnapshot {
    const rawNodes = Array.isArray(values) && values.length > 0 ? [...values].map(String) : ["A", "B", "C", "D", "E"];
    const nodeSet = new Set(rawNodes);
    const graph = Object.fromEntries(rawNodes.map((node) => [node, (this.defaultGraph[node] ?? []).filter((neighbor) => nodeSet.has(neighbor))]));
    const startVertex = rawNodes.includes("A") ? "A" : rawNodes[0];

    return {
      elements: rawNodes,
      pointers: {
        current: startVertex,
        queueFront: startVertex,
        queueCount: 1,
      },
      statusMessage: `Graph with nodes [${rawNodes.join(", ")}]. BFS initialized with start vertex ${startVertex} enqueued in FIFO queue.`,
      metadata: {
        graph,
        startVertex,
        queue: [startVertex],
        visited: [startVertex],
        traversalOrder: [],
      },
    };
  }

  executeOperation(
    currentState: IStateSnapshot,
    operation: IStateOperation,
    stepIndex: number
  ): IStateTransition {
    if (operation.type.toUpperCase() !== "VISIT_AND_EXPAND") {
      throw new Error(`Unsupported operation "${operation.type}" for BFS state machine.`);
    }
    const currentQueue = [...((currentState.metadata?.queue as string[]) ?? [])];
    const visited = [...((currentState.metadata?.visited as string[]) ?? [])];
    const traversal = [...((currentState.metadata?.traversalOrder as string[]) ?? [])];

    if (currentQueue.length === 0) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: {
          ...currentState,
          statusMessage: "BFS queue is empty. Traversal complete across connected component.",
        },
        affectedElementIds: [],
        explanation: "FIFO Queue is empty. All reachable vertices have been explored in level order.",
        isValidTransition: false,
        edgeCaseTriggered: "BFS_TRAVERSAL_COMPLETE",
      };
    }

    // Dequeue front vertex
    const currentVertex = currentQueue.shift()!;
    const requestedVertex = operation.payload?.vertex;
    if (requestedVertex !== undefined && String(requestedVertex) !== currentVertex) {
      return {
        stepIndex,
        operation,
        previousState: currentState,
        resultingState: currentState,
        affectedElementIds: [],
        explanation: `BFS must dequeue the current queue-front vertex ${currentVertex}; it cannot visit ${String(requestedVertex)} out of order.`,
        isValidTransition: false,
        edgeCaseTriggered: "BFS_QUEUE_ORDER_VIOLATION",
      };
    }
    traversal.push(currentVertex);

    // Expand neighbors
    const graph = (currentState.metadata?.graph as Record<string, string[]>) ?? this.defaultGraph;
    const neighbors = graph[currentVertex] || [];
    const newlyDiscovered: string[] = [];

    neighbors.forEach((nbr) => {
      if (!visited.includes(nbr)) {
        visited.push(nbr);
        currentQueue.push(nbr);
        newlyDiscovered.push(nbr);
      }
    });

    const resultingState: IStateSnapshot = {
      elements: currentState.elements,
      pointers: {
        current: currentVertex,
        queueFront: currentQueue.length > 0 ? currentQueue[0] : null,
        queueCount: currentQueue.length,
      },
      statusMessage: `Dequeued vertex ${currentVertex}. ${
        newlyDiscovered.length > 0
          ? `Discovered and enqueued unvisited neighbors: [${newlyDiscovered.join(", ")}].`
          : "No new unvisited neighbors."
      } Active queue: [${currentQueue.join(", ")}].`,
      metadata: {
        graph,
        startVertex: currentState.metadata?.startVertex,
        queue: currentQueue,
        visited,
        traversalOrder: traversal,
        lastProcessed: currentVertex,
        newlyEnqueued: newlyDiscovered,
      },
    };

    return {
      stepIndex,
      operation: { type: "VISIT_AND_EXPAND", payload: { vertex: currentVertex, neighbors: newlyDiscovered } },
      previousState: currentState,
      resultingState,
      affectedElementIds: [`node_${currentVertex}`, ...newlyDiscovered.map((n) => `node_${n}`)],
      explanation: `Dequeued vertex ${currentVertex} from front of FIFO queue. Marked as visited, explored outgoing edges, and enqueued undiscovered neighbors [${newlyDiscovered.join(", ")}] at rear of queue.`,
      isValidTransition: true,
    };
  }

  executeSequence(
    initialValues?: unknown[],
    operations?: IStateOperation[]
  ): IStateExecutionTrace {
    const initialState = this.createInitialState(initialValues);
    const transitions: IStateTransition[] = [];
    let currentState = initialState;
    let step = 1;

    const defaultOperations = operations?.length ? operations : [{ type: "VISIT_AND_EXPAND" }];
    while (((currentState.metadata?.queue as string[]) || []).length > 0 && step <= 5 && step <= defaultOperations.length) {
      const transition = this.executeOperation(
        currentState,
        defaultOperations[step - 1],
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

export const bfsStateMachine = new BfsStateMachine();
