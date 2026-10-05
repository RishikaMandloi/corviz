export type PlaybackTopic =
  | "STACK"
  | "QUEUE"
  | "BINARY_SEARCH"
  | "BUBBLE_SORT"
  | "LINEAR_SEARCH"
  | "LINKED_LIST"
  | "BST"
  | "SELECTION_SORT"
  | "TWO_POINTERS"
  | "BFS";

export type PlaybackState = {
  elements: unknown[];
  pointers: Record<string, number | null | string>;
  metadata?: Record<string, unknown>;
};

export type PlaybackOperation = { type: string; payload?: Record<string, unknown> };

const scriptedOperations: Partial<Record<PlaybackTopic, PlaybackOperation[]>> = {
  STACK: [
    { type: "PUSH", payload: { value: 40 } },
    { type: "PEEK" },
    { type: "POP" },
  ],
  QUEUE: [
    { type: "ENQUEUE", payload: { value: 40 } },
    { type: "PEEK" },
    { type: "DEQUEUE" },
  ],
  LINKED_LIST: [
    { type: "INSERT_HEAD", payload: { value: 5 } },
    { type: "DELETE_HEAD" },
  ],
  BST: [
    { type: "INSERT", payload: { value: 55 } },
    { type: "SEARCH", payload: { target: 20 } },
    { type: "INSERT", payload: { value: 10 } },
  ],
};

function bubbleComparisons(length: number): PlaybackOperation[] {
  const operations: PlaybackOperation[] = [];
  for (let pass = 0; pass < length - 1; pass += 1) {
    for (let index = 0; index < length - pass - 1; index += 1) {
      operations.push({ type: "COMPARE_AND_SWAP", payload: { j: index } });
    }
  }
  return operations;
}

export function nextPlaybackOperation(
  topic: PlaybackTopic,
  state: PlaybackState,
  initialState: PlaybackState,
  cursor: number,
): PlaybackOperation | null {
  switch (topic) {
    case "STACK":
    case "QUEUE":
    case "LINKED_LIST":
    case "BST":
      return scriptedOperations[topic]?.[cursor] ?? null;
    case "BINARY_SEARCH": {
      if (state.metadata?.found === true || state.metadata?.terminated === true) return null;
      return { type: "SEARCH", payload: { target: initialState.metadata?.target ?? 50 } };
    }
    case "BUBBLE_SORT":
      return bubbleComparisons(initialState.elements.length)[cursor] ?? null;
    case "LINEAR_SEARCH": {
      if (state.metadata?.found === true || Number(state.pointers.currentIndex ?? 0) >= state.elements.length) return null;
      return { type: "SEARCH", payload: { target: initialState.metadata?.target ?? 42 } };
    }
    case "SELECTION_SORT": {
      const boundary = Number(state.pointers.sortedBoundary ?? 0);
      return boundary < state.elements.length - 1
        ? { type: "FIND_MIN_AND_SWAP", payload: { i: boundary } }
        : null;
    }
    case "TWO_POINTERS":
      return Number(state.pointers.left ?? 0) < Number(state.pointers.right ?? state.elements.length - 1)
        ? { type: "SWAP_AND_ADVANCE" }
        : null;
    case "BFS": {
      const queue = state.metadata?.queue;
      return Array.isArray(queue) && queue.length > 0 ? { type: "VISIT_AND_EXPAND" } : null;
    }
  }
}
