import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class BstCkrProvider implements ICkrProvider {
  readonly topicId = "BST" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "BST",
      topicName: "Binary Search Tree",
      category: "DATA_STRUCTURE",
      definition:
        "A hierarchical node-based binary tree data structure where each node has at most two children, maintaining the invariant that all keys in the left subtree are strictly less than the node's key, and all keys in the right subtree are strictly greater.",
      learningObjectives: [
        "State the fundamental BST ordering invariant: left < node < right.",
        "Demonstrate recursive search choosing left or right child based on comparison.",
        "Demonstrate binary search tree insertion at the correct leaf position.",
      ],
      prerequisites: ["Trees", "Recursive traversal", "Node references"],
      entities: [
        {
          id: "root_pointer",
          name: "Root Pointer",
          role: "Reference pointing to topmost entry node of the tree.",
          cardinality: "1",
        },
        {
          id: "tree_node",
          name: "BST Node",
          role: "Container storing key value, left child link, and right child link.",
          cardinality: "0..N",
        },
      ],
      invariants: [
        {
          id: "BST_ORDERING",
          rule: "For every node N: every key in N.left < N.key, and every key in N.right > N.key.",
          enforcement: "STRICT",
          failureDescription: "BST ordering invariant violated.",
        },
      ],
      rules: [
        {
          operation: "SEARCH",
          targetSlot: "TREE_BRANCH",
          preconditions: ["Node is non-null"],
          postconditions: [
            "If target == node.key, node found.",
            "If target < node.key, traverse to node.left.",
            "If target > node.key, traverse to node.right.",
          ],
          effectDescription: "Traverses tree following BST property.",
        },
        {
          operation: "INSERT",
          targetSlot: "LEAF_POSITION",
          preconditions: ["Unique key"],
          postconditions: [
            "Traverses following BST ordering until null link reached.",
            "New leaf node attached preserving BST invariant.",
          ],
          effectDescription: "Inserts new key into correct tree location.",
        },
      ],
      edgeCases: [
        {
          id: "KEY_NOT_FOUND",
          trigger: "Search reaches null child.",
          expectedBehavior: "Concludes key does not exist in BST.",
          mitigation: "Return null / false.",
        },
      ],
      commonMisconceptions: [
        "Confusing a general binary tree with a binary search tree (which enforces key ordering).",
      ],
    };
  }
}

export const bstCkrProvider = new BstCkrProvider();
