import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class TwoPointersCkrProvider implements ICkrProvider {
  readonly topicId = "TWO_POINTERS" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "TWO_POINTERS",
      topicName: "Two Pointers Technique",
      category: "ALGORITHMIC_TECHNIQUE",
      definition:
        "An algorithmic pattern that coordinates two pointer indices traversing a data structure (typically an array) simultaneously—often starting from opposite ends and converging inward—to solve reversal, palindrome, or pair-sum problems in O(n) time.",
      learningObjectives: [
        "Explain opposite-end pointer initialization (left=0, right=n-1).",
        "Demonstrate simultaneous pointer convergence (left++, right--).",
        "Explain termination condition when left >= right.",
        "Demonstrate in-place array reversal.",
      ],
      prerequisites: ["Arrays", "Pointer manipulation", "Iteration"],
      entities: [
        {
          id: "target_array",
          name: "Working Array",
          role: "Array undergoing two-pointer processing.",
          cardinality: "1",
        },
        {
          id: "left_pointer",
          name: "Left Pointer",
          role: "Index advancing from 0 upward toward array center.",
          cardinality: "1",
        },
        {
          id: "right_pointer",
          name: "Right Pointer",
          role: "Index retreating from n-1 downward toward array center.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "CONVERGING_TRAJECTORY",
          rule: "The left pointer must strictly advance (>= +1) and the right pointer must strictly retreat (<= -1) until they meet.",
          enforcement: "STRICT",
          failureDescription: "Pointers diverged or moved in reverse direction.",
        },
      ],
      rules: [
        {
          operation: "SWAP_AND_ADVANCE",
          targetSlot: "POINTER_PAIR",
          preconditions: ["left < right"],
          postconditions: [
            "Swap array[left] and array[right].",
            "left = left + 1.",
            "right = right - 1.",
          ],
          effectDescription: "Swaps mirrored elements and converges pointers.",
        },
      ],
      edgeCases: [
        {
          id: "ODD_VS_EVEN_LENGTH",
          trigger: "Array length is odd (pointers meet at same element) vs even (pointers cross).",
          expectedBehavior: "Terminates gracefully without out-of-bounds or redundant swap.",
          mitigation: "Use while (left < right).",
        },
      ],
      commonMisconceptions: [
        "Allowing pointers to cross and swapping already-reversed elements back to original order.",
      ],
    };
  }
}

export const twoPointersCkrProvider = new TwoPointersCkrProvider();
