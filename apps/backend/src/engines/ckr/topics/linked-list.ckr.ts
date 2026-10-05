import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class LinkedListCkrProvider implements ICkrProvider {
  readonly topicId = "LINKED_LIST" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "LINKED_LIST",
      topicName: "Singly Linked List",
      category: "DATA_STRUCTURE",
      definition:
        "A linear collection of discrete data nodes where each node consists of a data value and a reference pointer pointing to the next node in sequence, originating from a dedicated Head pointer.",
      learningObjectives: [
        "Explain node composition: value and next pointer.",
        "Demonstrate Insert at Head in O(1) time.",
        "Demonstrate Delete at Head in O(1) time.",
        "Contrast dynamic pointer chaining with contiguous array allocation.",
      ],
      prerequisites: ["Pointers / Object references", "Dynamic memory"],
      entities: [
        {
          id: "head_pointer",
          name: "Head Pointer",
          role: "Reference pointing strictly to the first node of the list.",
          cardinality: "1",
        },
        {
          id: "node",
          name: "List Node",
          role: "Container holding a value and a next pointer reference.",
          cardinality: "0..N",
        },
        {
          id: "next_pointer",
          name: "Next Pointer Link",
          role: "Directed reference from current node to successor node.",
          cardinality: "0..1",
        },
      ],
      invariants: [
        {
          id: "DIRECTED_FORWARD_LINKING",
          rule: "Every node except the terminal node points to its immediate successor; terminal node points to null.",
          enforcement: "STRICT",
          failureDescription: "Invalid or broken pointer connection.",
        },
        {
          id: "HEAD_ACCURACY",
          rule: "Head pointer must always reference the first valid node or null if empty.",
          enforcement: "STRICT",
          failureDescription: "Head pointer disconnected from first node.",
        },
      ],
      rules: [
        {
          operation: "INSERT_HEAD",
          targetSlot: "HEAD",
          preconditions: ["New node allocated with value."],
          postconditions: [
            "NewNode.next points to current Head.",
            "Head pointer updates to point to NewNode.",
          ],
          effectDescription: "Inserts a new node at the beginning of the list.",
        },
        {
          operation: "DELETE_HEAD",
          targetSlot: "HEAD",
          preconditions: ["List must contain at least one node."],
          postconditions: [
            "Head pointer updates to Head.next.",
            "Old head node is unlinked.",
          ],
          effectDescription: "Removes first node from list.",
        },
      ],
      edgeCases: [
        {
          id: "EMPTY_LIST_DELETION",
          trigger: "Attempting Delete Head when Head is null.",
          expectedBehavior: "Operation rejected safely; Head remains null.",
          mitigation: "Check head != null.",
        },
      ],
      commonMisconceptions: [
        "Confusing array index access with linked list traversal (which requires following next pointers).",
      ],
    };
  }
}

export const linkedListCkrProvider = new LinkedListCkrProvider();
