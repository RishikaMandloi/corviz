import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class SelectionSortCkrProvider implements ICkrProvider {
  readonly topicId = "SELECTION_SORT" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "SELECTION_SORT",
      topicName: "Selection Sort",
      category: "SORT_ALGORITHM",
      definition:
        "An in-place comparison sort that divides the array into a sorted portion on the left and an unsorted portion on the right, repeatedly selecting the minimum element from the unsorted portion and swapping it into the first unsorted position.",
      learningObjectives: [
        "Explain the partition between sorted (left) and unsorted (right) regions.",
        "Demonstrate linear scan to find minimum of unsorted region.",
        "Demonstrate swapping minimum into index i.",
        "Observe that sorted partition grows strictly by 1 per pass.",
      ],
      prerequisites: ["Arrays", "Min finding", "In-place swaps"],
      entities: [
        {
          id: "sort_array",
          name: "Array to Sort",
          role: "Contiguous array.",
          cardinality: "1",
        },
        {
          id: "current_min_pointer",
          name: "Minimum Pointer",
          role: "Index tracking the smallest value discovered so far in the unsorted scan.",
          cardinality: "1",
        },
        {
          id: "sorted_boundary",
          name: "Sorted Partition Boundary",
          role: "Index i dividing sorted left from unsorted right.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "MINIMUM_SELECTION",
          rule: "The element swapped into position i must be the true mathematical minimum of the unsorted subarray [i..n-1].",
          enforcement: "STRICT",
          failureDescription: "An element other than the true minimum was swapped.",
        },
        {
          id: "PREFIX_SORTED",
          rule: "Subarray [0..i] is guaranteed sorted and all elements are <= all elements in [i+1..n-1].",
          enforcement: "STRICT",
          failureDescription: "Sorted prefix invariant violated.",
        },
      ],
      rules: [
        {
          operation: "FIND_MIN_AND_SWAP",
          targetSlot: "PARTITION_BOUNDARY",
          preconditions: ["0 <= i < n - 1"],
          postconditions: [
            "minIdx = argmin(array[i..n-1]).",
            "Swap array[i] and array[minIdx].",
            "Sorted prefix length increments by 1.",
          ],
          effectDescription: "Selects minimum and swaps to partition boundary.",
        },
      ],
      edgeCases: [
        {
          id: "MIN_ALREADY_AT_I",
          trigger: "Minimum element in unsorted portion is already at index i.",
          expectedBehavior: "Element stays in place; no unnecessary mutation.",
          mitigation: "Check i != minIdx before swap.",
        },
      ],
      commonMisconceptions: [
        "Confusing Selection Sort with Bubble Sort (Selection sort performs at most n-1 swaps total).",
      ],
    };
  }
}

export const selectionSortCkrProvider = new SelectionSortCkrProvider();
