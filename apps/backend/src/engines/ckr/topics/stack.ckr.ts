import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class StackCkrProvider implements ICkrProvider {
  readonly topicId = "STACK" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "STACK",
      topicName: "Stack (LIFO)",
      category: "DATA_STRUCTURE",
      definition:
        "A linear data structure operating strictly under the Last-In, First-Out (LIFO) principle, where insertions and deletions occur exclusively at the single open aperture designated as the Top.",
      learningObjectives: [
        "Explain the Last-In, First-Out (LIFO) invariant.",
        "Accurately predict the state of the stack after sequential Push and Pop operations.",
        "Track the Top pointer location after every state transition.",
        "Recognize and handle the Stack Underflow boundary condition.",
      ],
      prerequisites: [
        "Basic sequential arrays and indices",
        "Understanding of variable assignment and mutability",
      ],
      entities: [
        {
          id: "container",
          name: "Stack Container",
          role: "Physical/logical chamber with three closed boundaries and a single open top aperture.",
          cardinality: "1",
        },
        {
          id: "element",
          name: "Stack Element",
          role: "Discrete homogeneous data value stored within an ordinal slot inside the container.",
          cardinality: "0..N",
        },
        {
          id: "top_pointer",
          name: "Top Pointer",
          role: "Index or visual indicator that points strictly to the uppermost active element in the stack.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "LIFO",
          rule: "The most recently inserted element must be the first element removed.",
          enforcement: "STRICT",
          failureDescription:
            "Violation of LIFO: An element other than the most recently inserted one was accessed or removed.",
        },
        {
          id: "TOP_ACCESS_ONLY",
          rule: "Push, Pop, and Peek operations must target exclusively the Top position.",
          enforcement: "STRICT",
          failureDescription:
            "Violation of Top Access: Mutation attempted at bottom or arbitrary middle slot.",
        },
      ],
      rules: [
        {
          operation: "PUSH",
          targetSlot: "TOP",
          preconditions: ["Stack must not exceed maximum capacity (avoid Overflow)."],
          postconditions: [
            "Top pointer index increments by 1.",
            "New element resides at index Top.",
            "Stack length increments by 1.",
          ],
          effectDescription:
            "A new element enters through the top aperture and becomes the new Top of the stack.",
        },
        {
          operation: "POP",
          targetSlot: "TOP",
          preconditions: ["Stack must contain at least 1 element (avoid Underflow)."],
          postconditions: [
            "Top element is removed through the top aperture.",
            "Top pointer index decrements by 1.",
            "Stack length decrements by 1.",
          ],
          effectDescription:
            "The current Top element is removed and returned, leaving the preceding element as the new Top.",
        },
        {
          operation: "PEEK",
          targetSlot: "TOP",
          preconditions: ["Stack must not be empty."],
          postconditions: [
            "Top element value is inspected.",
            "Stack structure and length remain entirely unchanged.",
          ],
          effectDescription:
            "Returns the current Top value without modifying stack state or pointers.",
        },
      ],
      edgeCases: [
        {
          id: "STACK_UNDERFLOW",
          trigger: "Attempting a POP or PEEK operation when elements count is zero.",
          expectedBehavior:
            "Operation must be rejected or raise an explicit Underflow error; stack remains empty.",
          mitigation: "Check isEmpty() before invoking Pop or Peek.",
        },
        {
          id: "STACK_OVERFLOW",
          trigger: "Attempting a PUSH operation when elements count reaches bounded capacity.",
          expectedBehavior:
            "Operation must be rejected or raise an explicit Overflow error.",
          mitigation: "Check isFull() or use dynamically resizable backing array.",
        },
      ],
      commonMisconceptions: [
        "Assuming elements can be removed from the bottom or middle (which violates LIFO).",
        "Confusing Stack LIFO with Queue FIFO (where elements exit from the opposite end).",
        "Assuming Pop deletes all elements rather than just the single top element.",
      ],
    };
  }
}

export const stackCkrProvider = new StackCkrProvider();
