import { IAiProvider } from "./ai-provider.interface";
import { ITutorContext, ITutorProviderResult } from "./tutor.types";

export class NoopAiProvider implements IAiProvider {
  async generateResponse(question: string, context: ITutorContext): Promise<ITutorProviderResult> {
    const answer = this.buildAnswer(question, context);
    return {
      answer,
      source: "AI_WITH_VERIFIED_CONTEXT",
      verifiedContext: true,
      relatedStep: context.relatedStep,
    };
  }

  private buildAnswer(question: string, context: ITutorContext): string {
    const normalized = question.trim();
    const lower = normalized.toLowerCase();

    if (this.isGreeting(lower)) {
      return `Hi! I can help you learn ${this.topicLabel(context.topicId)}. Ask me to explain a concept, why an operation works, the current verified state, or a quiz question.`;
    }

    if (this.isQuizRequest(lower)) {
      return this.buildQuizAnswer(context, normalized);
    }

    if (this.isStepQuestion(lower)) {
      return this.buildStepAnswer(context, question);
    }

    if (this.isCurrentStateQuestion(lower)) {
      return this.buildStateAnswer(context);
    }

    if (this.isConceptQuestion(lower)) {
      return this.buildConceptAnswer(context, question);
    }

    if (this.isWhyHowQuestion(lower)) {
      return this.buildWhyHowAnswer(context, question);
    }

    if (this.isUnsupportedQuestion(lower)) {
      return `CORVIZ can help with verified ${this.topicLabel(context.topicId)} concepts, the current deterministic state, the active operation, and quiz questions. Ask about the current topic or a supported algorithm concept instead.`;
    }

    return this.buildClarificationAnswer(context, normalized);
  }

  private isGreeting(lower: string): boolean {
    return /^(hi|hello|hey|thanks|thank you|okay|ok|can you help me|help me|good morning|good afternoon)$/i.test(lower)
      || /^(hi|hello|hey|thanks|thank you|okay|ok|can you help me|help me)$/.test(lower);
  }

  private isQuizRequest(lower: string): boolean {
    return /(?:give me|ask me|quiz me|test my knowledge|another question|more quiz|more questions|another quiz|question(s)?)/i.test(lower)
      && /(?:quiz|question|test|more)/i.test(lower);
  }

  private isCurrentStateQuestion(lower: string): boolean {
    return /(?:what is the current state|what is the current top|what is currently at the top|what is on top|what is the top|which element is currently.*top|current top|current state)/i.test(lower)
      || /(?:top|front|current pointer|state)/i.test(lower) && /(?:what|which|where|identify|show)/i.test(lower) && !/current operation|operation\?/i.test(lower);
  }

  private isStepQuestion(lower: string): boolean {
    return /(?:explain this step|what is happening here|what is happening in this step|why did this element move|explain the current operation|explain current operation|current operation|this step|what happened when i pushed|what happened when i enqueued|what happened when i inserted|what happened when i popped|what happened when i dequeued)/i.test(lower)
      || /(?:pushed|enqueued|inserted|popped|dequeued|removed|deleted).+/i.test(lower) && /(?:what happened|explain|why)/i.test(lower);
  }

  private isConceptQuestion(lower: string): boolean {
    return /^(?:what is|explain|define|describe)/i.test(lower)
      || /(?:what is a stack|what is a queue|what is binary search|what is bubble sort|what is linear search|what is a linked list|what is a bst|what is selection sort|what is two pointers|what is bfs|explain .*stack|explain .*queue|explain .*binary search|explain .*lifo|what is lifo)/i.test(lower);
  }

  private isWhyHowQuestion(lower: string): boolean {
    return /(?:why|how)\b/i.test(lower) && !this.isCurrentStateQuestion(lower) && !this.isQuizRequest(lower);
  }

  private isUnsupportedQuestion(lower: string): boolean {
    return /(?:quantum|ai model|python|javascript|react|database|sql|network|css|html|math|biology|history|politics|geography)/i.test(lower);
  }

  private buildQuizAnswer(context: ITutorContext, question: string): string {
    const available = context.quizQuestions ?? [];
    const requestedCount = this.extractQuizCount(question, available.length);

    if (!available.length) {
      return `There are no verified quiz questions available for ${this.topicLabel(context.topicId)} yet. Ask about the concept or current state instead.`;
    }

    const slice = available.slice(0, Math.min(requestedCount, available.length));
    const count = slice.length;
    const intro = requestedCount > 1 ? `Sure — here are ${count} verified questions on ${this.topicLabel(context.topicId)}.` : `Sure — here is a verified question on ${this.topicLabel(context.topicId)}.`;
    const lines = slice.map((item, index) => {
      const options = item.options.map((option) => `  ${String.fromCharCode(65 + item.options.indexOf(option))}. ${option.text}`).join("\n");
      return `Question ${index + 1}: ${item.question}\n${options}`;
    }).join("\n\n");
    return `${intro}\n\n${lines}`;
  }

  private extractQuizCount(question: string, available: number): number {
    const match = question.match(/(\d+)\s*(?:more\s+)?(?:quiz|question|questions)/i) || question.match(/(\d+)\s*(?:more)/i);
    if (match) {
      const requested = Number.parseInt(match[1], 10);
      return Number.isFinite(requested) ? Math.max(1, Math.min(requested, available || requested)) : 3;
    }
    if (/more quiz|another question|more questions|another quiz|give me more/i.test(question)) {
      return Math.min(3, available || 3);
    }
    if (/quiz me|ask me some questions|test my knowledge/i.test(question)) {
      return Math.min(3, available || 3);
    }
    return Math.min(3, available || 1);
  }

  private buildStateAnswer(context: ITutorContext): string {
    const state = context.currentState;
    if (!state) {
      return `There is no verified current state for ${this.topicLabel(context.topicId)} yet. Generate or advance the lesson to get the deterministic state.`;
    }

    const topValue = Array.isArray(state.elements) && state.elements.length ? state.elements[state.elements.length - 1] : "EMPTY";
    const stateSummary = `The verified current state is ${JSON.stringify(state.elements)} with pointers ${JSON.stringify(state.pointers)}.`;
    return `${stateSummary} The current top value is ${String(topValue)}. This comes directly from the deterministic backend state, not from a guessed or synthetic value.`;
  }

  private buildStepAnswer(context: ITutorContext, question?: string): string {
    const operation = context.currentOperation?.type ?? "latest verified operation";
    const operationValue = this.extractOperationValue(context, question);
    const explanation = context.transitionExplanation ?? "This step is part of the deterministic lesson flow.";
    const stateText = context.currentState ? `The verified state now is ${JSON.stringify(context.currentState.elements)}.` : "The verified state is available in the lesson trace.";
    const valueText = operationValue ? `The ${operation} operation placed ${operationValue} at the valid top location for this stack.` : `This verified ${operation} operation changed the state at the valid access point for the current topic.`;
    return `${valueText} ${explanation} ${stateText}`;
  }

  private extractOperationValue(context: ITutorContext, question?: string): string | undefined {
    const payload = context.currentOperation?.payload as Record<string, unknown> | undefined;
    const directValue = payload && ("value" in payload ? payload.value : "target" in payload ? payload.target : undefined);
    if (directValue !== undefined) {
      return String(directValue);
    }
    const match = question?.match(/(?:pushed|inserted|added|enqueued|visited)\s+([\w.-]+)/i);
    if (match?.[1]) {
      return match[1];
    }
    return undefined;
  }

  private buildConceptAnswer(context: ITutorContext, question: string): string {
    const concept = context.topicConcept || `This is the verified concept for ${this.topicLabel(context.topicId)}.`;
    const lower = question.toLowerCase();

    if (this.topicLabel(context.topicId) === "Stack (LIFO)") {
      return `## What is a Stack?

A stack is a linear data structure that follows the Last-In, First-Out (LIFO) rule: the most recently inserted item is the first one removed.

### Key idea
- PUSH adds an element to the top.
- POP removes the element at the top.
- PEEK inspects the top without removing it.
- The top pointer identifies the current active position.

### Example
If the stack contains [10, 20, 30], then 30 is at the top. A POP would remove 30, leaving 20 on top.

### Why this matters
This rule is useful for function calls, undo/redo behavior, and backtracking in algorithms.

${concept}`;
    }

    if (this.topicLabel(context.topicId) === "Queue (FIFO)") {
      return `A queue is a linear structure that follows FIFO: First In, First Out. Items are added at the rear and removed from the front. This is the opposite of a stack and is commonly used for scheduling and breadth-first traversal.`;
    }

    if (this.topicLabel(context.topicId) === "Binary Search") {
      return `Binary search is a fast search strategy for sorted collections. It keeps a search interval and repeatedly discards half the remaining candidates based on the target. This is why its worst-case time is O(log n).`;
    }

    if (/lifo|last-in|last in first out/i.test(lower)) {
      return `LIFO means Last In, First Out. In a stack, the newest value sits on top and is removed first. This is why a push operation usually makes the new value the top, while a pop removes that same top value.`;
    }

    return `${concept} Ask a more specific question such as how the current operation works, why the rule is enforced, or what the verified state currently contains.`;
  }

  private buildWhyHowAnswer(context: ITutorContext, question: string): string {
    const lower = question.toLowerCase();

    if (this.topicLabel(context.topicId) === "Stack (LIFO)") {
      const currentTop = Array.isArray(context.currentState?.elements) && context.currentState.elements.length ? String(context.currentState.elements[context.currentState.elements.length - 1]) : undefined;
      const operationName = context.currentOperation?.type ? context.currentOperation.type.toLowerCase() : "push";

      if (/lifo|last in first out|why does.*stack.*lifo/i.test(lower)) {
        return `A stack follows LIFO because it only permits access from the top. When a new value is pushed, it becomes the top element. The next pop must remove that newest value before anything below it can be reached, which is exactly the Last-In, First-Out rule.`;
      }
      if (/push|how does push/i.test(lower)) {
        return `PUSH places a new value at the top of the stack. In the verified lesson, the top pointer advances to the new slot and the inserted value becomes the current top. That is why the most recently pushed item is always the next item removed by POP.`;
      }
      if (/pop|how does pop/i.test(lower)) {
        return `POP removes the top value and then repositions the top pointer to the next lower element. In a stack, this is the only valid removal point because the stack is defined by top-access-only semantics.`;
      }
      if (/(?:why.*top|why.*on top|why.*at the top|top.*why)/i.test(lower) || /\b\d+\b.*top|top.*\b\d+\b/i.test(lower)) {
        const value = currentTop ?? "the most recent value";
        return `Because a stack is LIFO, the newest valid value becomes the top. In the current verified lesson, ${value} is on top because the most recent ${operationName} operation inserted it at the Top position, and POP will remove it before any older element.`;
      }
    }

    if (this.topicLabel(context.topicId) === "Binary Search") {
      return `Binary search works by reducing the active range by half at every comparison. Because the collection is sorted, if the target is smaller than the middle element, the search continues in the left half; otherwise it continues in the right half. That is why it is efficient and logarithmic.`;
    }

    if (context.currentOperation) {
      return `The verified ${context.currentOperation.type} operation is explained by the rule set for ${this.topicLabel(context.topicId)}: ${context.canonicalRules.join(" ")}. In the current lesson, that means the operation is applied only at the valid access point and the state update must match the deterministic trace.`;
    }

    return `The key idea is that CORVIZ uses verified rules, not guesswork. For ${this.topicLabel(context.topicId)}, the governing rule is: ${context.canonicalRules.join(" ")}. The operation behaves that way because the deterministic state machine enforces those invariants exactly.`;
  }

  private buildClarificationAnswer(context: ITutorContext, question: string): string {
    if (!question || !question.trim()) {
      return "Could you tell me what you want explained — the concept, the current state, this step, or a quiz question?";
    }
    return `Could you clarify what you want me to explain for ${this.topicLabel(context.topicId)}? I can answer a concept question, explain the current verified state, explain the current operation, or give you quiz questions.`;
  }

  private topicLabel(topicId: string): string {
    const map: Record<string, string> = {
      STACK: "Stack (LIFO)",
      QUEUE: "Queue (FIFO)",
      BINARY_SEARCH: "Binary Search",
      BUBBLE_SORT: "Bubble Sort",
      LINEAR_SEARCH: "Linear Search",
      LINKED_LIST: "Linked List",
      BST: "Binary Search Tree",
      SELECTION_SORT: "Selection Sort",
      TWO_POINTERS: "Two Pointers",
      BFS: "Breadth-First Search",
    };
    return map[topicId] ?? topicId;
  }
}

export const createAiProvider = (): IAiProvider => new NoopAiProvider();
