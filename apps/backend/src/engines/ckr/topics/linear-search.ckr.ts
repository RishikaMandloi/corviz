import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class LinearSearchCkrProvider implements ICkrProvider {
  readonly topicId = "LINEAR_SEARCH" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "LINEAR_SEARCH",
      topicName: "Linear Search",
      category: "SEARCH_ALGORITHM",
      definition:
        "A sequential search algorithm that starts at index 0 and inspects each element of a collection sequentially until a target match is found or the end of the collection is reached.",
      learningObjectives: [
        "Explain sequential traversal without skipping elements.",
        "Compare each item at index i with target.",
        "Identify O(n) worst-case and O(1) best-case complexity.",
      ],
      prerequisites: ["Arrays", "Iteration loops"],
      entities: [
        {
          id: "search_array",
          name: "Target Array",
          role: "Ordered or unordered list of items.",
          cardinality: "1",
        },
        {
          id: "current_pointer",
          name: "Current Index Pointer",
          role: "Pointer incrementing monotonically from 0 to n-1.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "SEQUENTIAL_PROGRESSION",
          rule: "The search index must increment by exactly 1 without skipping any intervening element.",
          enforcement: "STRICT",
          failureDescription: "Element skipped during sequential evaluation.",
        },
      ],
      rules: [
        {
          operation: "SEARCH",
          targetSlot: "CURRENT_INDEX",
          preconditions: ["0 <= i < n"],
          postconditions: [
            "If array[i] == target, search succeeds at index i.",
            "If array[i] != target, index advances to i + 1.",
          ],
          effectDescription: "Inspects element at index i against target.",
        },
      ],
      edgeCases: [
        {
          id: "NOT_FOUND",
          trigger: "Index reaches end of array without match.",
          expectedBehavior: "Returns -1 or not found.",
          mitigation: "Check boundary i < length.",
        },
      ],
      commonMisconceptions: [
        "Assuming array must be sorted (Linear search works on both unsorted and sorted data).",
      ],
    };
  }
}

export const linearSearchCkrProvider = new LinearSearchCkrProvider();
