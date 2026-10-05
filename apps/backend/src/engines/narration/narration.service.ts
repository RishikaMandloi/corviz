import {
  ISceneGraph,
  IStateExecutionTrace,
  IStateSnapshot,
  IStateTransition,
  SupportedTopicId,
} from "../../shared/contracts";

export interface INarrationSegment {
  sceneId: string;
  order: number;
  text: string;
  start: number;
  duration: number;
  milestones: Array<{ timestamp: number; cue: string }>;
}

class NarrationService {
  /**
   * Generate teacher-style narration from verified scene-aligned transitions.
   */
  generateScript(sceneGraph: ISceneGraph, trace: IStateExecutionTrace): INarrationSegment[] {
    let timelineOffset = 0;

    return sceneGraph.scenes.map((scene, index) => {
      const duration = scene.duration;
      const start = timelineOffset;
      const transition = index > 0 ? trace.transitions[index - 1] : undefined;
      const state = transition?.resultingState ?? trace.initialState;
      const text = transition
        ? this.explainTransition(sceneGraph.topicId, transition)
        : this.explainInitialState(sceneGraph.topicId, state);

      const milestones = (scene.narration?.milestones || []).map((m) => ({
        timestamp: Number((start + m.timestamp).toFixed(2)),
        cue: m.event,
      }));

      timelineOffset += duration;

      // Keep the visual scene transcript and spoken segment on the same verified step.
      scene.narration = {
        ...scene.narration,
        text,
        startTime: 0,
        duration,
      };

      return {
        sceneId: scene.id,
        order: scene.order,
        text,
        start: Number(start.toFixed(2)),
        duration: Number(duration.toFixed(2)),
        milestones,
      };
    });
  }

  generateTransitionSegment(
    topicId: SupportedTopicId,
    transition: IStateTransition,
    scene: ISceneGraph["scenes"][number],
    timelineStart: number
  ): INarrationSegment {
    const text = this.explainTransition(topicId, transition);
    scene.narration = {
      ...scene.narration,
      text,
      startTime: 0,
      duration: scene.duration,
    };
    return {
      sceneId: scene.id,
      order: scene.order,
      text,
      start: Number(timelineStart.toFixed(2)),
      duration: Number(scene.duration.toFixed(2)),
      milestones: (scene.narration.milestones ?? []).map((milestone) => ({
        timestamp: Number((timelineStart + milestone.timestamp).toFixed(2)),
        cue: milestone.narrationCue ?? milestone.event,
      })),
    };
  }

  private explainInitialState(topicId: SupportedTopicId, state: IStateSnapshot): string {
    const values = this.values(state.elements);
    const top = state.pointers.top;
    const front = state.pointers.front;
    const rear = state.pointers.rear;

    switch (topicId) {
      case "STACK":
        return `Let’s look at the stack before we begin. A stack follows Last In, First Out, or LIFO: the newest item is the first one removed. The current elements are ${values || "none"}. ${typeof top === "number" && top >= 0 ? `The top pointer is at index ${top}, where ${this.value(state.elements[top])} is currently on top.` : "The stack is empty, so there is no top element yet."}`;
      case "QUEUE":
        return `Here is the queue before we begin. A queue follows First In, First Out, or FIFO: the oldest item leaves first. The elements from front to rear are ${values || "none"}. ${typeof front === "number" && front >= 0 ? `The front is ${this.value(state.elements[front])} at index ${front}.` : "The queue is empty."} ${typeof rear === "number" && rear >= 0 ? `The rear is ${this.value(state.elements[rear])} at index ${rear}.` : "There is no rear element yet."}`;
      case "BINARY_SEARCH":
        return `We begin with the sorted array ${values}. Binary search works because the values are ordered. The current search interval is ${this.interval(state)}; each comparison will let us discard half of that interval.`;
      case "BUBBLE_SORT":
        return `Here is the array before sorting: ${values}. Bubble sort compares neighboring elements, swapping an out-of-order pair. With each pass, larger values move toward the end.`;
      case "LINEAR_SEARCH":
        return `We will search the array ${values} from left to right. Linear search checks one index at a time and stops when it finds the target or reaches the end.`;
      case "LINKED_LIST":
        return `Here is the linked list: ${values || "empty"}. The head pointer identifies the first node, and each node’s next link leads to the following node. We will preserve those links as we update or traverse the list.`;
      case "BST":
        return `Here is the binary search tree with node values ${values}. We begin at the root${state.elements.length ? `, ${this.value(state.elements[Number(state.pointers.root ?? 0)])}` : ""}. At each node, smaller values go left and larger values go right.`;
      case "SELECTION_SORT":
        return `We begin with ${values}. Selection sort scans the unsorted region for its smallest value, then places that minimum at the next sorted position.`;
      case "TWO_POINTERS":
        return `We begin with ${values}. Two pointers start at opposite ends and move inward. We compare the values they point to and swap them when the task requires it. ${this.pointerDescription(state)}`;
      case "BFS":
        return `We are starting a breadth-first search. BFS visits a graph level by level, using a queue to remember discovered vertices. The starting vertices are ${values || "not specified"}. ${this.graphState(state)}`;
    }
  }

  private explainTransition(topicId: SupportedTopicId, transition: IStateTransition): string {
    const operation = transition.operation.type.toUpperCase();
    const before = transition.previousState;
    const after = transition.resultingState;
    const payload = transition.operation.payload ?? {};
    const detail = transition.explanation.trim() || after.statusMessage;
    const outcome = this.outcome(after);

    switch (topicId) {
      case "STACK": {
        const topIndex = after.pointers.top;
        if (operation === "PUSH") {
          const pushed = after.elements[after.elements.length - 1];
          return `A stack follows Last In, First Out, or LIFO. We are pushing ${this.value(pushed)} onto the stack. ${detail} ${this.value(pushed)} is now the top element, and the top pointer is at index ${String(topIndex)}.`;
        }
        if (operation === "POP") {
          const removed = before.elements[before.elements.length - 1];
          const newTop = typeof topIndex === "number" && topIndex >= 0 ? after.elements[topIndex] : undefined;
          return `We are removing ${this.value(removed)} from the top of the stack. Because a stack follows LIFO, only the newest element can be removed. ${detail} ${newTop === undefined ? "The stack is now empty." : `${this.value(newTop)} is now on top, and the top pointer is at index ${String(topIndex)}.`}`;
        }
        if (operation === "PEEK") {
          const currentTop = typeof topIndex === "number" ? after.elements[topIndex] : undefined;
          return `We are peeking at the stack without removing anything. ${detail} ${currentTop === undefined ? "There is no top value because the stack is empty." : `${this.value(currentTop)} remains at the top, and the top pointer stays at index ${String(topIndex)}.`}`;
        }
        return `${detail} ${outcome}`;
      }
      case "QUEUE": {
        if (operation === "ENQUEUE") {
          const value = after.elements[after.elements.length - 1];
          return `A queue follows First In, First Out, or FIFO. We are adding ${this.value(value)} at the rear. ${detail} The front is at ${String(after.pointers.front)} and the rear is at ${String(after.pointers.rear)}.`;
        }
        if (operation === "DEQUEUE") {
          const removed = before.elements[0];
          const front = typeof after.pointers.front === "number" ? after.elements[after.pointers.front] : undefined;
          return `We are removing ${this.value(removed)} from the front of the queue. FIFO means the oldest queued item leaves first. ${detail} ${front === undefined ? "The queue is now empty." : `${this.value(front)} is now at the front; the rear pointer remains at index ${String(after.pointers.rear)}.`}`;
        }
        if (operation === "PEEK") {
          const front = typeof after.pointers.front === "number" ? after.elements[after.pointers.front] : undefined;
          return `We are peeking at the front without removing an item. ${detail} ${front === undefined ? "The queue is empty." : `${this.value(front)} remains at the front; front is ${String(after.pointers.front)} and rear is ${String(after.pointers.rear)}.`}`;
        }
        return `${detail} ${outcome}`;
      }
      case "BINARY_SEARCH": {
        const comparedMid = before.pointers.mid;
        const comparedValue = typeof comparedMid === "number" ? before.elements[comparedMid] : undefined;
        const nextMid = after.pointers.mid;
        const nextMidValue = typeof nextMid === "number" ? after.elements[nextMid] : undefined;
        const target = payload.target ?? payload.value ?? this.targetFromText(detail);
        return `Binary search checks the middle of a sorted array. We are searching for ${this.value(target)}. ${comparedValue === undefined ? detail : `We compared ${this.value(target)} with the middle value ${this.value(comparedValue)} at index ${String(comparedMid)}. ${detail}`} The remaining interval is ${this.interval(after)}.${nextMidValue === undefined ? " There is no next middle element in this interval." : ` Its next middle value is ${this.value(nextMidValue)} at index ${String(nextMid)}.`}`;
      }
      case "BUBBLE_SORT": {
        const left = Number(payload.j ?? before.pointers.j ?? 0);
        const right = Number(payload.jPlus1 ?? left + 1);
        const a = before.elements[left];
        const b = before.elements[right];
        return `Bubble sort compares adjacent elements at indices ${left} and ${right}: ${this.value(a)} and ${this.value(b)}. ${detail} The array is now ${this.values(after.elements)}. Repeating these comparisons moves larger values toward the end.`;
      }
      case "LINEAR_SEARCH": {
        const index = before.pointers.currentIndex;
        const value = typeof index === "number" ? before.elements[index] : undefined;
        const target = payload.target ?? payload.value ?? this.targetFromText(detail);
        return `Linear search checks values one at a time from left to right. We are looking for ${this.value(target)}. ${typeof index === "number" && value !== undefined ? `At index ${index}, we check ${this.value(value)}.` : "There are no more unchecked elements."} ${detail}`;
      }
      case "LINKED_LIST":
        return `In a linked list, each node stores a value and a link to the next node. We are performing ${operation.replaceAll("_", " ")}. ${detail} The head pointer is at index ${String(after.pointers.head)}. The resulting node values are ${this.values(after.elements) || "none"}; follow each next link to traverse them.`;
      case "BST": {
        const root = after.pointers.root;
        const current = after.pointers.current;
        return `In a binary search tree, we compare at each node and move left for a smaller key or right for a larger key. We are performing ${operation.toLowerCase()}${payload.value !== undefined ? ` for ${this.value(payload.value)}` : payload.target !== undefined ? ` for ${this.value(payload.target)}` : ""}. ${detail} The root is at index ${String(root)} and the current search position is ${String(current)}. Node values are ${this.values(after.elements)}.`;
      }
      case "SELECTION_SORT": {
        const boundary = before.pointers.sortedBoundary;
        const minimum = after.pointers.minIdx;
        return `Selection sort searches the unsorted region for its minimum. The unsorted region begins at index ${String(boundary)}. ${detail} The selected minimum is at index ${String(minimum)}. The array is now ${this.values(after.elements)}.`;
      }
      case "TWO_POINTERS":
        return `The left and right pointers move inward through the array. ${detail} ${this.pointerDescription(after)} The resulting array is ${this.values(after.elements)}.`;
      case "BFS":
        return `Breadth-first search uses a queue to visit vertices level by level. ${detail} ${this.graphState(after)} The visited order so far is ${this.values(this.list(after.metadata?.visited)) || "not reported"}.`;
    }
  }

  private outcome(state: IStateSnapshot): string {
    return `The resulting elements are ${this.values(state.elements) || "none"}. ${this.pointerDescription(state)}`;
  }

  private pointerDescription(state: IStateSnapshot): string {
    const pointers = Object.entries(state.pointers).map(([name, value]) => `${name} ${String(value)}`).join(", ");
    return pointers ? `Pointer positions: ${pointers}.` : "No pointer positions are active.";
  }

  private graphState(state: IStateSnapshot): string {
    const queue = this.list(state.metadata?.queue);
    const visited = this.list(state.metadata?.visited);
    return `The queue contains ${queue.length ? this.values(queue) : "no vertices"}; visited vertices are ${visited.length ? this.values(visited) : "none"}.`;
  }

  private interval(state: IStateSnapshot): string {
    return `[${String(state.pointers.low ?? "empty")}..${String(state.pointers.high ?? "empty")}]`;
  }

  private list(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private values(values: unknown[]): string {
    return values.map((value) => this.value(value)).join(", ");
  }

  private value(value: unknown): string {
    if (value === undefined) return "an unspecified value";
    if (typeof value === "string") return `“${value}”`;
    return String(value);
  }

  private targetFromText(text: string): string {
    return text.match(/target\s+([^ .,]+)/i)?.[1] ?? "the selected target";
  }
}

export const narrationService = new NarrationService();

