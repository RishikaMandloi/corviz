import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class BfsCkrProvider implements ICkrProvider {
  readonly topicId = "BFS" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "BFS",
      topicName: "Breadth-First Search (BFS)",
      category: "GRAPH_ALGORITHM",
      definition:
        "A fundamental graph and tree traversal algorithm that explores all vertices at the current depth level before proceeding to vertices at the next depth level, using a FIFO Queue to govern the discovery and processing sequence.",
      learningObjectives: [
        "Explain level-order traversal using an auxiliary FIFO Queue.",
        "Demonstrate neighbor exploration and enqueueing.",
        "Explain the Visited set preventing infinite loops in cyclic graphs.",
        "Recognize O(V + E) time complexity.",
      ],
      prerequisites: ["Graphs / Trees", "Queue data structure", "Adjacency representation"],
      entities: [
        {
          id: "graph_nodes",
          name: "Graph Vertices",
          role: "Nodes interconnected by directed or undirected edges.",
          cardinality: "1..N",
        },
        {
          id: "bfs_queue",
          name: "Traversal FIFO Queue",
          role: "Queue storing discovered nodes awaiting neighborhood exploration.",
          cardinality: "1",
        },
        {
          id: "visited_set",
          name: "Visited Set / Array",
          role: "Tracking structure ensuring each vertex is processed at most once.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "FIFO_PROCESSING_ORDER",
          rule: "Nodes must be dequeued and processed strictly in the order they were discovered (FIFO).",
          enforcement: "STRICT",
          failureDescription: "Nodes processed out of level order.",
        },
        {
          id: "SINGLE_VISIT_PER_NODE",
          rule: "Every reachable node is enqueued and processed at most once.",
          enforcement: "STRICT",
          failureDescription: "Node visited multiple times without reset.",
        },
      ],
      rules: [
        {
          operation: "VISIT_AND_EXPAND",
          targetSlot: "QUEUE_FRONT",
          preconditions: ["Queue is non-empty"],
          postconditions: [
            "current = queue.dequeue().",
            "Mark current as visited.",
            "For each unvisited neighbor N of current: mark N as discovered and queue.enqueue(N).",
          ],
          effectDescription: "Dequeues next node and expands its immediate neighborhood.",
        },
      ],
      edgeCases: [
        {
          id: "DISCONNECTED_COMPONENTS",
          trigger: "Graph contains unreachable islands of vertices.",
          expectedBehavior: "BFS traverses only the connected component originating from source.",
          mitigation: "Run outer loop over all vertices if full coverage needed.",
        },
      ],
      commonMisconceptions: [
        "Confusing BFS with DFS (DFS uses a Stack / recursion; BFS strictly uses a Queue).",
      ],
    };
  }
}

export const bfsCkrProvider = new BfsCkrProvider();
