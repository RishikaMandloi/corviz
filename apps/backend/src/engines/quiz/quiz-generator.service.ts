import {
  IConceptKnowledge,
  IStateExecutionTrace,
  IVerifiedQuiz,
  IQuizQuestion,
} from "../../shared/contracts";

class QuizGeneratorService {
  /**
   * Deterministically derive quiz questions and verified answers from trace and CKR.
   */
  generateQuiz(ckr: IConceptKnowledge, trace: IStateExecutionTrace): IVerifiedQuiz {
    const questions: IQuizQuestion[] = [
      this.buildFinalStateQuestion(ckr, trace),
      ...this.buildQuestionsForTopic(ckr, trace),
    ];

    return {
      topicId: ckr.topicId,
      title: `${ckr.topicName} Knowledge Check`,
      questions,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildFinalStateQuestion(ckr: IConceptKnowledge, trace: IStateExecutionTrace): IQuizQuestion {
    const state = trace.finalState;
    const values = state.elements.map(String).join(", ") || "empty";
    let question: string;
    let answer: string;

    switch (ckr.topicId) {
      case "STACK": {
        const top = state.pointers.top;
        const value = typeof top === "number" && top >= 0 ? state.elements[top] : "EMPTY";
        question = "According to the final verified state, what value is at the top of the stack?";
        answer = `${value}`;
        break;
      }
      case "QUEUE": {
        const front = state.pointers.front;
        const value = typeof front === "number" && front >= 0 ? state.elements[front] : "EMPTY";
        question = "According to the final verified state, what value will the queue remove next from its front?";
        answer = `${value}`;
        break;
      }
      case "BINARY_SEARCH":
        question = "What search interval remains in the final verified binary-search state?";
        answer = `[${String(state.pointers.low ?? "empty")}..${String(state.pointers.high ?? "empty")}]`;
        break;
      case "BUBBLE_SORT":
        question = "What array order does the final verified bubble-sort state contain?";
        answer = `[${values}]`;
        break;
      case "LINEAR_SEARCH":
        question = "What current index does the final verified linear-search state inspect next?";
        answer = `${state.pointers.currentIndex ?? "complete"}`;
        break;
      case "LINKED_LIST":
        question = "What node values appear from HEAD onward in the final verified linked list?";
        answer = `[${values}]`;
        break;
      case "BST": {
        const current = state.pointers.current;
        const value = typeof current === "number" ? state.elements[current] : undefined;
        question = "Which value is at the current node in the final verified BST state?";
        answer = value === undefined ? "No current node" : `${value}`;
        break;
      }
      case "SELECTION_SORT":
        question = "What is the final verified array after this selection-sort lesson?";
        answer = `[${values}]`;
        break;
      case "TWO_POINTERS":
        question = "Where are the left and right pointers in the final verified two-pointer state?";
        answer = `left=${String(state.pointers.left)}, right=${String(state.pointers.right)}`;
        break;
      case "BFS": {
        const queue = Array.isArray(state.metadata?.queue) ? state.metadata.queue.map(String).join(", ") : "";
        const visited = Array.isArray(state.metadata?.visited) ? state.metadata.visited.map(String).join(", ") : "";
        question = "Which vertices are queued and marked visited in the final verified BFS state?";
        answer = `Queue: [${queue}], visited: [${visited}]`;
        break;
      }
    }

    return {
      id: "q_final_verified_state",
      question,
      options: [
        { id: "state_correct", text: answer, isCorrect: true },
        { id: "state_wrong_1", text: `Not ${answer}`, isCorrect: false },
        { id: "state_wrong_2", text: "An earlier state from before the final transition", isCorrect: false },
        { id: "state_wrong_3", text: "A state belonging to a different topic", isCorrect: false },
      ],
      correctAnswerId: "state_correct",
      explanation: `This answer is derived from the final deterministic state: ${state.statusMessage}`,
      difficulty: "EASY",
      bloomLevel: "APPLY",
    };
  }

  private buildQuestionsForTopic(
    ckr: IConceptKnowledge,
    trace: IStateExecutionTrace
  ): IQuizQuestion[] {
    const finalElements = trace.finalState.elements;

    switch (ckr.topicId) {
      case "STACK": {
        const topIdx = trace.finalState.pointers.top as number | null;
        const topVal = topIdx !== null && topIdx >= 0 ? finalElements[topIdx] : "EMPTY";
        return [
          {
            id: "q_top_value",
            question: `After completing all operations in this lesson, what element is currently at the TOP of the stack?`,
            options: [
              { id: "opt_a", text: `${topVal}`, isCorrect: true },
              { id: "opt_b", text: `${finalElements[0] ?? 0}`, isCorrect: false },
              { id: "opt_c", text: `${finalElements.length}`, isCorrect: false },
              { id: "opt_d", text: "null", isCorrect: false },
            ],
            correctAnswerId: "opt_a",
            explanation: `In a stack following LIFO, the top pointer points to the most recently pushed element remaining (${topVal}).`,
            difficulty: "EASY",
            bloomLevel: "REMEMBER",
          },
          {
            id: "q_next_pop",
            question: `If a Pop() operation is executed right now, which value will be removed?`,
            options: [
              { id: "pop_opt_a", text: `${topVal}`, isCorrect: true },
              { id: "pop_opt_b", text: `${finalElements[0] ?? 0} (bottom element)`, isCorrect: false },
              { id: "pop_opt_c", text: "All elements simultaneously", isCorrect: false },
              { id: "pop_opt_d", text: "A random element", isCorrect: false },
            ],
            correctAnswerId: "pop_opt_a",
            explanation: `Stack follows LIFO. Pop() always removes the element at the Top (${topVal}).`,
            difficulty: "MEDIUM",
            bloomLevel: "APPLY",
          },
          {
            id: "q_underflow",
            question: `What error condition occurs if Pop() is called when the stack contains zero elements?`,
            options: [
              { id: "err_opt_a", text: "Stack Underflow", isCorrect: true },
              { id: "err_opt_b", text: "Stack Overflow", isCorrect: false },
              { id: "err_opt_c", text: "Memory Leak", isCorrect: false },
              { id: "err_opt_d", text: "Deadlock", isCorrect: false },
            ],
            correctAnswerId: "err_opt_a",
            explanation: `Stack Underflow occurs when an algorithm attempts to pop from an empty stack.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
        ];
      }

      case "QUEUE": {
        const frontVal = finalElements.length > 0 ? finalElements[0] : "EMPTY";
        return [
          {
            id: "q_queue_front",
            question: `Following the FIFO discipline, which element will be removed on the next Dequeue() call?`,
            options: [
              { id: "q_opt_a", text: `${frontVal} (Front)`, isCorrect: true },
              { id: "q_opt_b", text: `${finalElements[finalElements.length - 1]} (Rear)`, isCorrect: false },
              { id: "q_opt_c", text: "A random element", isCorrect: false },
              { id: "q_opt_d", text: "None", isCorrect: false },
            ],
            correctAnswerId: "q_opt_a",
            explanation: `In a Queue (FIFO), Dequeue removes strictly from the Front (${frontVal}).`,
            difficulty: "EASY",
            bloomLevel: "REMEMBER",
          },
          {
            id: "q_enqueue_location",
            question: `When Enqueue(X) is called, where does the new element enter the queue?`,
            options: [
              { id: "enq_a", text: "At the Rear", isCorrect: true },
              { id: "enq_b", text: "At the Front", isCorrect: false },
              { id: "enq_c", text: "In the exact middle", isCorrect: false },
              { id: "enq_d", text: "At index 0", isCorrect: false },
            ],
            correctAnswerId: "enq_a",
            explanation: `Enqueue always joins at the tail/Rear of the queue.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
        ];
      }

      case "BINARY_SEARCH": {
        return [
          {
            id: "q_bs_prereq",
            question: `What fundamental precondition must be satisfied before Binary Search can be applied?`,
            options: [
              { id: "bs_a", text: "The collection must be sorted in monotonic order", isCorrect: true },
              { id: "bs_b", text: "The collection size must be a power of 2", isCorrect: false },
              { id: "bs_c", text: "All elements must be distinct positive integers", isCorrect: false },
              { id: "bs_d", text: "The collection must be a linked list", isCorrect: false },
            ],
            correctAnswerId: "bs_a",
            explanation: `Binary search relies on the sorted invariant to discard half the search interval at each step.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
          {
            id: "q_bs_complexity",
            question: `What is the worst-case time complexity of Binary Search on an array of size n?`,
            options: [
              { id: "bsc_a", text: "O(log n)", isCorrect: true },
              { id: "bsc_b", text: "O(n)", isCorrect: false },
              { id: "bsc_c", text: "O(n log n)", isCorrect: false },
              { id: "bsc_d", text: "O(1)", isCorrect: false },
            ],
            correctAnswerId: "bsc_a",
            explanation: `Halving the active search interval at every step yields logarithmic O(log n) time complexity.`,
            difficulty: "MEDIUM",
            bloomLevel: "REMEMBER",
          },
        ];
      }

      case "BUBBLE_SORT": {
        return [
          {
            id: "q_bubble_adjacent",
            question: `In Bubble Sort, which elements are compared during an inner iteration?`,
            options: [
              { id: "bub_a", text: "Strictly adjacent elements (j and j+1)", isCorrect: true },
              { id: "bub_b", text: "The first and last elements", isCorrect: false },
              { id: "bub_c", text: "Every element with a random pivot", isCorrect: false },
              { id: "bub_d", text: "Elements spaced by gaps (Shell sort)", isCorrect: false },
            ],
            correctAnswerId: "bub_a",
            explanation: `Bubble Sort steps through the array comparing strictly adjacent pairs and swapping out-of-order items.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
        ];
      }

      case "LINEAR_SEARCH": {
        return [
          {
            id: "q_linear_order",
            question: `What invariant governs Linear Search progression?`,
            options: [
              { id: "ls_a", text: "Sequential index progression checking each element without skipping", isCorrect: true },
              { id: "ls_b", text: "Bisection of the search interval", isCorrect: false },
              { id: "ls_c", text: "Hashing element keys to bucket indices", isCorrect: false },
              { id: "ls_d", text: "Ascending sort of array elements", isCorrect: false },
            ],
            correctAnswerId: "ls_a",
            explanation: `Linear search advances monotonically from index 0 to n-1 checking elements sequentially.`,
            difficulty: "EASY",
            bloomLevel: "REMEMBER",
          },
        ];
      }

      case "LINKED_LIST": {
        return [
          {
            id: "q_ll_head_insert",
            question: `What is the time complexity of inserting a new node at the HEAD of a Singly Linked List?`,
            options: [
              { id: "ll_a", text: "O(1) constant time", isCorrect: true },
              { id: "ll_b", text: "O(n) linear time", isCorrect: false },
              { id: "ll_c", text: "O(log n)", isCorrect: false },
              { id: "ll_d", text: "O(n^2)", isCorrect: false },
            ],
            correctAnswerId: "ll_a",
            explanation: `Inserting at Head requires updating only the new node's next link and the Head pointer: O(1).`,
            difficulty: "MEDIUM",
            bloomLevel: "APPLY",
          },
        ];
      }

      case "BST": {
        return [
          {
            id: "q_bst_invariant",
            question: `What property must hold for every node in a valid Binary Search Tree (BST)?`,
            options: [
              { id: "bst_a", text: "Left subtree keys < Node key < Right subtree keys", isCorrect: true },
              { id: "bst_b", text: "Every node has exactly 2 children", isCorrect: false },
              { id: "bst_c", text: "Tree height is always log n", isCorrect: false },
              { id: "bst_d", text: "All leaves must be on the same level", isCorrect: false },
            ],
            correctAnswerId: "bst_a",
            explanation: `The core BST invariant requires keys in the left subtree to be smaller and keys in the right subtree to be greater than the node key.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
        ];
      }

      case "SELECTION_SORT": {
        return [
          {
            id: "q_sel_min",
            question: `In Selection Sort, what value is swapped into the partition boundary at index i?`,
            options: [
              { id: "sel_a", text: "The minimum element of the unsorted subarray [i..n-1]", isCorrect: true },
              { id: "sel_b", text: "The maximum element of the entire array", isCorrect: false },
              { id: "sel_c", text: "The element at index i+1 unconditionally", isCorrect: false },
              { id: "sel_d", text: "A random pivot element", isCorrect: false },
            ],
            correctAnswerId: "sel_a",
            explanation: `Selection Sort scans the unsorted partition to identify the minimum element and swaps it to index i.`,
            difficulty: "EASY",
            bloomLevel: "UNDERSTAND",
          },
        ];
      }

      case "TWO_POINTERS": {
        return [
          {
            id: "q_tp_term",
            question: `When does the two-pointer array reversal algorithm terminate?`,
            options: [
              { id: "tp_a", text: "When left pointer >= right pointer (pointers meet or cross)", isCorrect: true },
              { id: "tp_b", text: "When left reaches the end of the array (left == n)", isCorrect: false },
              { id: "tp_c", text: "After a single swap", isCorrect: false },
              { id: "tp_d", text: "When the array size is doubled", isCorrect: false },
            ],
            correctAnswerId: "tp_a",
            explanation: `The two pointers converge inward from opposite ends. Once left >= right, all element pairs have been swapped.`,
            difficulty: "EASY",
            bloomLevel: "APPLY",
          },
        ];
      }

      case "BFS": {
        return [
          {
            id: "q_bfs_queue",
            question: `Which data structure coordinates the vertex exploration order in Breadth-First Search?`,
            options: [
              { id: "bfs_a", text: "FIFO Queue", isCorrect: true },
              { id: "bfs_b", text: "LIFO Stack", isCorrect: false },
              { id: "bfs_c", text: "Priority Queue (Min-Heap)", isCorrect: false },
              { id: "bfs_d", text: "Binary Search Tree", isCorrect: false },
            ],
            correctAnswerId: "bfs_a",
            explanation: `BFS uses a FIFO Queue to ensure vertices are explored in order of their discovery depth level.`,
            difficulty: "EASY",
            bloomLevel: "REMEMBER",
          },
        ];
      }

      default:
        return [];
    }
  }
}

export const quizGeneratorService = new QuizGeneratorService();
