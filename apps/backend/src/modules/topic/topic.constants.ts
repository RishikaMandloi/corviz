import { SupportedTopicId, SUPPORTED_TOPIC_IDS } from "../../shared/contracts";

export const TOPIC_IDS = SUPPORTED_TOPIC_IDS;

export const TOPIC_CATALOG: Record<
  SupportedTopicId,
  {
    id: SupportedTopicId;
    name: string;
    category:
      | "DATA_STRUCTURE"
      | "SEARCH_ALGORITHM"
      | "SORT_ALGORITHM"
      | "ALGORITHMIC_TECHNIQUE"
      | "GRAPH_ALGORITHM";
    summary: string;
    supportedOperations: string[];
    defaultInitialValues: unknown[];
    complexity: {
      time: string;
      space: string;
    };
  }
> = {
  STACK: {
    id: "STACK",
    name: "Stack (LIFO)",
    category: "DATA_STRUCTURE",
    summary: "Linear data structure following Last-In, First-Out (LIFO) order with Push, Pop, and Peek at Top.",
    supportedOperations: ["PUSH", "POP", "PEEK"],
    defaultInitialValues: [10, 20, 30],
    complexity: {
      time: "O(1) for push, pop, peek",
      space: "O(n) for n elements",
    },
  },
  QUEUE: {
    id: "QUEUE",
    name: "Queue (FIFO)",
    category: "DATA_STRUCTURE",
    summary: "Linear data structure following First-In, First-Out (FIFO) order with Enqueue at Rear and Dequeue from Front.",
    supportedOperations: ["ENQUEUE", "DEQUEUE", "PEEK"],
    defaultInitialValues: [10, 20, 30],
    complexity: {
      time: "O(1) for enqueue, dequeue",
      space: "O(n)",
    },
  },
  BINARY_SEARCH: {
    id: "BINARY_SEARCH",
    name: "Binary Search",
    category: "SEARCH_ALGORITHM",
    summary: "Efficient search algorithm operating on sorted arrays by repeatedly halving the search interval.",
    supportedOperations: ["SEARCH"],
    defaultInitialValues: [10, 20, 30, 40, 50, 60, 70],
    complexity: {
      time: "O(log n)",
      space: "O(1)",
    },
  },
  BUBBLE_SORT: {
    id: "BUBBLE_SORT",
    name: "Bubble Sort",
    category: "SORT_ALGORITHM",
    summary: "Simple comparison-based sorting algorithm that repeatedly steps through the list, swapping adjacent elements if in wrong order.",
    supportedOperations: ["SORT"],
    defaultInitialValues: [40, 10, 50, 20, 30],
    complexity: {
      time: "O(n^2)",
      space: "O(1)",
    },
  },
  LINEAR_SEARCH: {
    id: "LINEAR_SEARCH",
    name: "Linear Search",
    category: "SEARCH_ALGORITHM",
    summary: "Sequential search checking every element from beginning to end until match is found.",
    supportedOperations: ["SEARCH"],
    defaultInitialValues: [15, 42, 8, 23, 74],
    complexity: {
      time: "O(n)",
      space: "O(1)",
    },
  },
  LINKED_LIST: {
    id: "LINKED_LIST",
    name: "Singly Linked List",
    category: "DATA_STRUCTURE",
    summary: "Linear collection of data elements whose order is given by pointers pointing to the next node.",
    supportedOperations: ["INSERT_HEAD", "DELETE_HEAD", "TRAVERSE"],
    defaultInitialValues: [10, 20, 30],
    complexity: {
      time: "O(1) insert at head, O(n) search",
      space: "O(n)",
    },
  },
  BST: {
    id: "BST",
    name: "Binary Search Tree",
    category: "DATA_STRUCTURE",
    summary: "Node-based binary tree data structure where left subtree has smaller keys and right subtree has larger keys.",
    supportedOperations: ["INSERT", "SEARCH"],
    defaultInitialValues: [50, 30, 70, 20, 40],
    complexity: {
      time: "O(log n) average, O(n) worst case",
      space: "O(n)",
    },
  },
  SELECTION_SORT: {
    id: "SELECTION_SORT",
    name: "Selection Sort",
    category: "SORT_ALGORITHM",
    summary: "In-place comparison sort dividing list into sorted and unsorted portions, repeatedly finding minimum of unsorted.",
    supportedOperations: ["SORT"],
    defaultInitialValues: [64, 25, 12, 22, 11],
    complexity: {
      time: "O(n^2)",
      space: "O(1)",
    },
  },
  TWO_POINTERS: {
    id: "TWO_POINTERS",
    name: "Two Pointers Technique",
    category: "ALGORITHMIC_TECHNIQUE",
    summary: "Algorithmic pattern using two pointer indices moving toward each other to solve array inversion or palindrome validation.",
    supportedOperations: ["INVERT", "VALIDATE_PALINDROME"],
    defaultInitialValues: [1, 2, 3, 4, 5],
    complexity: {
      time: "O(n)",
      space: "O(1)",
    },
  },
  BFS: {
    id: "BFS",
    name: "Breadth-First Search (BFS)",
    category: "GRAPH_ALGORITHM",
    summary: "Graph and tree traversal algorithm exploring all neighbors at current depth prior to moving to next level nodes.",
    supportedOperations: ["TRAVERSE"],
    // The deterministic BFS graph is the labelled adjacency graph A→{B,C}, B→D, C→E.
    // Keep its default vertices aligned with that canonical graph.
    defaultInitialValues: ["A", "B", "C", "D", "E"],
    complexity: {
      time: "O(V + E)",
      space: "O(V)",
    },
  },
};
