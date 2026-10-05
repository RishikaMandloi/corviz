import { ISceneGraph, IStateExecutionTrace, IVerificationIssue, IVerificationResult, SHARED_VERIFICATION_SEVERITY, SHARED_VERIFICATION_STATUS, SupportedTopicId } from "../../../shared/contracts";
import { IVkveSemanticValidator } from "../vkve.types";

export class ArrayAlgorithmVkveValidator implements IVkveSemanticValidator {
  constructor(readonly topicId: SupportedTopicId) {}
  validateSemanticSceneGraph(graph: ISceneGraph, trace: IStateExecutionTrace): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const fail = (code: string, message: string, sceneId?: string) => errors.push({ code, message, severity: SHARED_VERIFICATION_SEVERITY.ERROR, validator: "VKVE", sceneId });
    if (graph.scenes.length !== trace.transitions.length + 1) fail("SCENE_COUNT_MISMATCH", "Every deterministic transition requires one scene.");
    graph.scenes.forEach((scene, index) => {
      const state = index === 0 ? trace.initialState : trace.transitions[index - 1]?.resultingState;
      if (!state) return;
      const boxes = scene.objects.filter((o) => o.type === "BOX");
      if (!scene.objects.some((o) => o.id === "array_container")) fail("MISSING_ARRAY_CONTAINER", "Array scene lacks its memory strip.", scene.id);
      if (boxes.length !== state.elements.length) fail("ARRAY_LENGTH_MISMATCH", "Rendered array length differs from deterministic state.", scene.id);
      boxes.forEach((box, i) => { if (box.properties?.value !== state.elements[i] || box.properties?.index !== i) fail("ARRAY_STATE_MISMATCH", `Cell ${i} differs from deterministic state.`, scene.id); });
    });
    trace.transitions.forEach((t, i) => {
      const before = t.previousState.elements as number[], after = t.resultingState.elements as number[], p = t.operation.payload ?? {}, sceneId = graph.scenes[i + 1]?.id;
      if (this.topicId === "BINARY_SEARCH") { const low = Number(t.previousState.pointers.low), high = Number(t.previousState.pointers.high); if (before.some((v, n) => n > 0 && before[n - 1] > v)) fail("UNSORTED_BINARY_SEARCH", "Binary search used an unsorted array.", sceneId); if (low <= high && Number(t.previousState.pointers.mid) !== Math.floor((low + high) / 2)) fail("INVALID_MIDPOINT", "Midpoint is incorrect.", sceneId); if (p.branch === "LEFT" && Number(t.resultingState.pointers.high) !== Math.floor((low + high) / 2) - 1) fail("INVALID_INTERVAL_UPDATE", "Left interval update is incorrect.", sceneId); }
      if (this.topicId === "BUBBLE_SORT") { const j = Number(p.j); if (Number(p.jPlus1) !== j + 1) fail("NON_ADJACENT_COMPARISON", "Bubble sort compared non-adjacent elements.", sceneId); if (p.swapped === true && !(before[j] > before[j + 1] && after[j] === before[j + 1] && after[j + 1] === before[j])) fail("INVALID_BUBBLE_SWAP", "Bubble swap is incorrect.", sceneId); }
      if (this.topicId === "LINEAR_SEARCH") { const index = Number(p.index); if (index !== Number(t.previousState.pointers.currentIndex)) fail("SKIPPED_LINEAR_INDEX", "Linear search skipped an index.", sceneId); if (!p.isMatch && Number(t.resultingState.pointers.currentIndex) !== index + 1) fail("INVALID_LINEAR_ADVANCE", "Linear search must advance one index.", sceneId); }
      if (this.topicId === "SELECTION_SORT") { const i = Number(p.i), min = Number(p.minIdx); const expected = before.slice(i).reduce((best, value, offset, values) => value < values[best] ? offset : best, 0) + i; if (min !== expected || after[i] !== before[min]) fail("INVALID_SELECTED_MINIMUM", "Selection sort chose or placed an incorrect minimum.", sceneId); }
      if (this.topicId === "TWO_POINTERS") { const left = Number(p.left), right = Number(p.right); if (left < right && (after[left] !== before[right] || after[right] !== before[left] || Number(t.resultingState.pointers.left) !== left + 1 || Number(t.resultingState.pointers.right) !== right - 1)) fail("INVALID_POINTER_MOVEMENT", "Two pointers did not swap and converge correctly.", sceneId); }
    });
    return { valid: !errors.length, status: errors.length ? SHARED_VERIFICATION_STATUS.FAILED : SHARED_VERIFICATION_STATUS.PASSED, confidenceScore: errors.length ? 0 : 1, errors, warnings: [], checkedAt: new Date().toISOString() };
  }
}
export const binarySearchVkveValidator = new ArrayAlgorithmVkveValidator("BINARY_SEARCH");
export const bubbleSortVkveValidator = new ArrayAlgorithmVkveValidator("BUBBLE_SORT");
export const linearSearchVkveValidator = new ArrayAlgorithmVkveValidator("LINEAR_SEARCH");
export const selectionSortVkveValidator = new ArrayAlgorithmVkveValidator("SELECTION_SORT");
export const twoPointersVkveValidator = new ArrayAlgorithmVkveValidator("TWO_POINTERS");
