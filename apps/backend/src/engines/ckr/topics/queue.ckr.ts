import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class QueueCkrProvider implements ICkrProvider {
  readonly topicId = "QUEUE" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "QUEUE",
      topicName: "Queue (FIFO)",
      category: "DATA_STRUCTURE",
      definition:
        "A linear data structure operating under the First-In, First-Out (FIFO) principle, where insertions take place exclusively at the Rear and deletions take place exclusively at the Front.",
      learningObjectives: [
        "Explain the First-In, First-Out (FIFO) invariant.",
        "Demonstrate Enqueue operation targeting the Rear.",
        "Demonstrate Dequeue operation removing the Front element.",
        "Track Front and Rear pointers after every operation.",
        "Identify Queue Underflow boundary conditions.",
      ],
      prerequisites: ["Sequential arrays", "Index pointers"],
      entities: [
        {
          id: "queue_container",
          name: "Queue Chamber",
          role: "Open-ended linear pipeline with an entry at Rear and exit at Front.",
          cardinality: "1",
        },
        {
          id: "queue_element",
          name: "Queue Item",
          role: "Discrete datum stored in sequential order.",
          cardinality: "0..N",
        },
        {
          id: "front_pointer",
          name: "Front Pointer",
          role: "Pointer index targeting the earliest inserted active element ready for removal.",
          cardinality: "1",
        },
        {
          id: "rear_pointer",
          name: "Rear Pointer",
          role: "Pointer index targeting the most recently inserted active element.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "FIFO",
          rule: "The element that has been in the queue the longest must be the first one removed.",
          enforcement: "STRICT",
          failureDescription: "FIFO violation: An element other than the front was dequeued.",
        },
        {
          id: "DUAL_END_RESTRICTION",
          rule: "Enqueue must strictly target Rear, and Dequeue must strictly remove from Front.",
          enforcement: "STRICT",
          failureDescription: "Mutation attempted at improper boundary.",
        },
      ],
      rules: [
        {
          operation: "ENQUEUE",
          targetSlot: "REAR",
          preconditions: ["Queue must not exceed bounded capacity."],
          postconditions: [
            "Rear pointer advances by 1.",
            "New element is positioned at Rear slot.",
            "Queue length increments by 1.",
          ],
          effectDescription: "New element enters at the Rear of the queue.",
        },
        {
          operation: "DEQUEUE",
          targetSlot: "FRONT",
          preconditions: ["Queue must not be empty (avoid Underflow)."],
          postconditions: [
            "Front element is removed.",
            "Queue length decrements by 1.",
            "Remaining elements shift or Front pointer updates.",
          ],
          effectDescription: "Oldest element exits from the Front of the queue.",
        },
        {
          operation: "PEEK",
          targetSlot: "FRONT",
          preconditions: ["Queue must not be empty."],
          postconditions: ["Returns front element without mutation."],
          effectDescription: "Inspects Front element value.",
        },
      ],
      edgeCases: [
        {
          id: "QUEUE_UNDERFLOW",
          trigger: "Calling Dequeue or Peek on an empty queue.",
          expectedBehavior: "Operation rejected; queue remains empty.",
          mitigation: "Check isEmpty() before Dequeue.",
        },
      ],
      commonMisconceptions: [
        "Confusing FIFO with Stack LIFO (popping from the same end).",
        "Assuming Dequeue removes the newest element.",
      ],
    };
  }
}

export const queueCkrProvider = new QueueCkrProvider();
