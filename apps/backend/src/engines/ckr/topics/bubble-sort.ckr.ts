import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class BubbleSortCkrProvider implements ICkrProvider {
  readonly topicId = "BUBBLE_SORT" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "BUBBLE_SORT",
      topicName: "Bubble Sort",
      category: "SORT_ALGORITHM",
      definition:
        "A comparison-based sorting algorithm that steps through an array, compares adjacent elements, and swaps them if they are in the wrong order, causing the largest unsorted element to bubble to the end in each pass.",
      learningObjectives: [
        "Explain adjacent element comparison.",
        "Demonstrate in-place swap when array[j] > array[j+1].",
        "Observe how the rightmost sorted partition grows after each pass.",
        "Recognize O(n^2) worst-case time complexity.",
      ],
      prerequisites: ["Array indexing", "Conditional swapping"],
      entities: [
        {
          id: "sort_array",
          name: "Array to Sort",
          role: "Contiguous mutable sequence of elements.",
          cardinality: "1",
        },
        {
          id: "compared_pair",
          name: "Compared Pair",
          role: "Two adjacent indices j and j+1 under evaluation.",
          cardinality: "2",
        },
        {
          id: "sorted_partition",
          name: "Sorted Subarray",
          role: "Right-hand boundary of elements settled into final ordered positions.",
          cardinality: "0..N",
        },
      ],
      invariants: [
        {
          id: "ADJACENT_COMPARISON_ONLY",
          rule: "Comparisons and swaps can occur strictly between adjacent elements j and j+1.",
          enforcement: "STRICT",
          failureDescription: "Non-adjacent elements were compared or swapped.",
        },
        {
          id: "LARGEST_BUBBLES_TO_END",
          rule: "At the conclusion of pass p, the p-th largest element is permanently settled at index n - p.",
          enforcement: "STRICT",
          failureDescription: "Largest unsorted element failed to reach the partition boundary.",
        },
      ],
      rules: [
        {
          operation: "COMPARE_AND_SWAP",
          targetSlot: "ADJACENT",
          preconditions: ["0 <= j < n - 1"],
          postconditions: [
            "If array[j] > array[j+1], values are exchanged.",
            "Otherwise, positions remain unchanged.",
          ],
          effectDescription: "Compares adjacent pair and conditionally swaps.",
        },
      ],
      edgeCases: [
        {
          id: "ALREADY_SORTED",
          trigger: "Input array is already in sorted order.",
          expectedBehavior: "Zero swaps performed; algorithm terminates early if optimized flag used.",
          mitigation: "Track swapped flag per pass.",
        },
      ],
      commonMisconceptions: [
        "Believing Bubble Sort compares elements across arbitrary distances like QuickSort.",
        "Assuming all elements are sorted in a single pass.",
      ],
    };
  }
}

export const bubbleSortCkrProvider = new BubbleSortCkrProvider();
