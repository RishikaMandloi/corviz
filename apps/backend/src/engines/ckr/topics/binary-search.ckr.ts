import { IConceptKnowledge } from "../../../shared/contracts";
import { ICkrProvider } from "../ckr.types";

export class BinarySearchCkrProvider implements ICkrProvider {
  readonly topicId = "BINARY_SEARCH" as const;

  getCkr(): IConceptKnowledge {
    return {
      topicId: "BINARY_SEARCH",
      topicName: "Binary Search",
      category: "SEARCH_ALGORITHM",
      definition:
        "A logarithmic divide-and-conquer search algorithm that finds a target in a sorted collection by repeatedly inspecting the middle element and halving the active search interval.",
      learningObjectives: [
        "State the prerequisite that input data must be sorted.",
        "Calculate the midpoint index using mid = floor((low + high) / 2).",
        "Explain how the search range halves based on comparing target with array[mid].",
        "Identify O(log n) time complexity and termination conditions.",
      ],
      prerequisites: ["Sorted arrays", "Index arithmetic", "Divide and conquer"],
      entities: [
        {
          id: "search_array",
          name: "Sorted Array",
          role: "Contiguous array sorted in monotonically non-decreasing order.",
          cardinality: "1",
        },
        {
          id: "low_pointer",
          name: "Low Pointer",
          role: "Left boundary index of current active search interval.",
          cardinality: "1",
        },
        {
          id: "high_pointer",
          name: "High Pointer",
          role: "Right boundary index of current active search interval.",
          cardinality: "1",
        },
        {
          id: "mid_pointer",
          name: "Mid Pointer",
          role: "Bisecting index inspected during current comparison.",
          cardinality: "1",
        },
      ],
      invariants: [
        {
          id: "SORTED_INPUT",
          rule: "The target array must be strictly sorted before binary search begins.",
          enforcement: "STRICT",
          failureDescription: "Binary search cannot execute correctly on an unsorted array.",
        },
        {
          id: "INTERVAL_HALVING",
          rule: "Every non-matching comparison must eliminate either the left half or right half of the active range.",
          enforcement: "STRICT",
          failureDescription: "Active search range did not shrink appropriately.",
        },
      ],
      rules: [
        {
          operation: "SEARCH",
          targetSlot: "MID",
          preconditions: ["low <= high", "Array is sorted"],
          postconditions: [
            "If target == array[mid], element is found at mid.",
            "If target < array[mid], high becomes mid - 1.",
            "If target > array[mid], low becomes mid + 1.",
          ],
          effectDescription: "Inspects midpoint and reduces search boundary.",
        },
      ],
      edgeCases: [
        {
          id: "ELEMENT_NOT_FOUND",
          trigger: "low exceeds high without match.",
          expectedBehavior: "Terminates indicating element not present.",
          mitigation: "Return -1 or null.",
        },
        {
          id: "TARGET_AT_BOUNDARIES",
          trigger: "Target is first (low) or last (high) element.",
          expectedBehavior: "Correctly discovered without out-of-bounds error.",
          mitigation: "Proper boundary conditions.",
        },
      ],
      commonMisconceptions: [
        "Attempting binary search on unsorted arrays.",
        "Incorrect midpoint calculation causing integer overflow or infinite loops.",
      ],
    };
  }
}

export const binarySearchCkrProvider = new BinarySearchCkrProvider();
