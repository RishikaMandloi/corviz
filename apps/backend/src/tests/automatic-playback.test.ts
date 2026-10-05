import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { IStateOperation, IStateSnapshot, SupportedTopicId } from "../shared/contracts";

type PlaybackCase = {
  topic: SupportedTopicId;
  expectedOperations: number;
  next: (state: IStateSnapshot, initial: IStateSnapshot, cursor: number) => IStateOperation | null;
  verifyFinal: (state: IStateSnapshot) => void;
};

const scripted: Partial<Record<SupportedTopicId, IStateOperation[]>> = {
  STACK: [
    { type: "PUSH", payload: { value: 40 } },
    { type: "PEEK" },
    { type: "POP" },
  ],
  QUEUE: [
    { type: "ENQUEUE", payload: { value: 40 } },
    { type: "PEEK" },
    { type: "DEQUEUE" },
  ],
  LINKED_LIST: [
    { type: "INSERT_HEAD", payload: { value: 5 } },
    { type: "DELETE_HEAD" },
  ],
  BST: [
    { type: "INSERT", payload: { value: 55 } },
    { type: "SEARCH", payload: { target: 20 } },
    { type: "INSERT", payload: { value: 10 } },
  ],
};

const cases: PlaybackCase[] = [
  { topic: "STACK", expectedOperations: 3, next: (_state, _initial, cursor) => scripted.STACK![cursor] ?? null, verifyFinal: (state) => assert.deepEqual(state.elements, [10, 20, 30]) },
  { topic: "QUEUE", expectedOperations: 3, next: (_state, _initial, cursor) => scripted.QUEUE![cursor] ?? null, verifyFinal: (state) => assert.deepEqual(state.elements, [20, 30, 40]) },
  {
    topic: "BINARY_SEARCH", expectedOperations: 3,
    next: (state, initial) => state.metadata?.found === true || state.metadata?.terminated === true ? null : { type: "SEARCH", payload: { target: initial.metadata?.target ?? 50 } },
    verifyFinal: (state) => { assert.equal(state.metadata?.found, true); assert.equal(state.metadata?.foundIndex, 4); },
  },
  {
    topic: "BUBBLE_SORT", expectedOperations: 10,
    next: (_state, initial, cursor) => {
      const length = initial.elements.length;
      let index = 0;
      for (let pass = 0; pass < length - 1; pass += 1) {
        for (let j = 0; j < length - pass - 1; j += 1, index += 1) {
          if (index === cursor) return { type: "COMPARE_AND_SWAP", payload: { j } };
        }
      }
      return null;
    },
    verifyFinal: (state) => assert.deepEqual(state.elements, [10, 20, 30, 40, 50]),
  },
  {
    topic: "LINEAR_SEARCH", expectedOperations: 2,
    next: (state, initial) => state.metadata?.found === true || Number(state.pointers.currentIndex) >= state.elements.length ? null : { type: "SEARCH", payload: { target: initial.metadata?.target ?? 42 } },
    verifyFinal: (state) => { assert.equal(state.metadata?.found, true); assert.equal(state.metadata?.inspectedIndex, 1); },
  },
  { topic: "LINKED_LIST", expectedOperations: 2, next: (_state, _initial, cursor) => scripted.LINKED_LIST![cursor] ?? null, verifyFinal: (state) => assert.deepEqual(state.elements, [10, 20, 30]) },
  { topic: "BST", expectedOperations: 3, next: (_state, _initial, cursor) => scripted.BST![cursor] ?? null, verifyFinal: (state) => { assert.deepEqual(state.elements, [50, 30, 70, 20, 40, 55, 10]); assert.equal(state.metadata?.parentIndex, 3); } },
  {
    topic: "SELECTION_SORT", expectedOperations: 4,
    next: (state) => { const boundary = Number(state.pointers.sortedBoundary); return boundary < state.elements.length - 1 ? { type: "FIND_MIN_AND_SWAP", payload: { i: boundary } } : null; },
    verifyFinal: (state) => assert.deepEqual(state.elements, [11, 12, 22, 25, 64]),
  },
  {
    topic: "TWO_POINTERS", expectedOperations: 2,
    next: (state) => Number(state.pointers.left) < Number(state.pointers.right) ? { type: "SWAP_AND_ADVANCE" } : null,
    verifyFinal: (state) => assert.deepEqual(state.elements, [5, 4, 3, 2, 1]),
  },
  {
    topic: "BFS", expectedOperations: 5,
    next: (state) => Array.isArray(state.metadata?.queue) && (state.metadata?.queue as unknown[]).length > 0 ? { type: "VISIT_AND_EXPAND" } : null,
    verifyFinal: (state) => { assert.deepEqual(state.metadata?.queue, []); assert.deepEqual(state.metadata?.traversalOrder, ["A", "B", "C", "D", "E"]); },
  },
];

async function run(): Promise<void> {
  const counts: Record<string, number> = {};
  for (const playbackCase of cases) {
    const pipeline = await pipelineService.generatePipeline({ topicId: playbackCase.topic, initializeOnly: true });
    assert.equal(pipeline.verificationReport.valid, true, `${playbackCase.topic} initial scene must pass VKVE`);
    assert.equal(pipeline.stateTrace.transitions.length, 0, `${playbackCase.topic} must start without pre-executed operations`);
    assert.equal(pipeline.sceneGraph.scenes.length, 1, `${playbackCase.topic} must expose its initial verified scene`);
    assert.equal(pipeline.narrationScript.length, 1, `${playbackCase.topic} initial narration must align to its initial scene`);

    let cursor = 0;
    while (true) {
      const current = pipelineService.getPipelineById(pipeline.pipelineId);
      const operation = playbackCase.next(current.stateTrace.finalState, current.stateTrace.initialState, cursor);
      if (!operation) break;
      assert.ok(cursor < 100, `${playbackCase.topic} must terminate its sequence`);
      const response = await pipelineService.interactPipeline({ pipelineId: pipeline.pipelineId, operation });
      assert.equal(response.verificationReport.valid, true, `${playbackCase.topic} operation ${cursor + 1} must be VKVE verified`);
      assert.equal(response.transition.isValidTransition, true);
      assert.deepEqual(response.transition.previousState, current.stateTrace.finalState, `${playbackCase.topic} operation must use authoritative prior state`);
      assert.deepEqual(response.transition.resultingState, response.updatedState);
      assert.deepEqual(response.updatedScene.semanticIntent?.expectedStateSnapshot, response.updatedState);
      assert.equal(response.updatedScene.semanticIntent?.operation, response.transition.operation.type);
      assert.equal(response.narration.sceneId, response.updatedScene.id);
      assert.equal(response.narration.text, response.updatedScene.narration?.text);
      assert.ok(response.narration.text.includes(response.transition.explanation), `${playbackCase.topic} narration must describe the accepted transition`);
      assert.equal(response.dryRunRow.step, response.transition.stepIndex);
      if (playbackCase.topic === "LINKED_LIST") {
        const nodes = response.updatedScene.objects.filter((object) => object.type === "NODE");
        const expectedLinks = response.transition.operation.type === "INSERT_HEAD" ? [1, 2, 3, null] : [1, 2, null];
        assert.deepEqual(nodes.map((node) => node.properties?.nextIndex), expectedLinks, "Linked-list scene must show the updated next references");
      }
      if (playbackCase.topic === "BST" && response.transition.operation.type === "SEARCH") {
        const path = response.updatedState.metadata?.traversalPath as number[];
        assert.deepEqual(path, [0, 1, 3]);
        for (const index of path) assert.ok(response.updatedScene.animations.some((animation) => animation.objectId === `node_${index}`), "BST search scene must animate every node on the comparison path");
      }
      if (playbackCase.topic === "BFS") {
        const edges = response.updatedScene.objects.filter((object) => object.type === "EDGE");
        assert.equal(edges.length, 4, "BFS scene must display the deterministic directed graph edges");
        if (response.transition.stepIndex === 1) assert.equal(edges.filter((edge) => edge.properties?.isNewlyDiscovered === true).length, 2);
      }
      cursor += 1;
    }

    const completed = pipelineService.getPipelineById(pipeline.pipelineId);
    assert.equal(cursor, playbackCase.expectedOperations, `${playbackCase.topic} expected complete operation count`);
    assert.equal(completed.stateTrace.transitions.length, cursor);
    assert.equal(completed.sceneGraph.scenes.length, cursor + 1);
    assert.equal(completed.narrationScript.length, cursor + 1);
    assert.equal(completed.dryRun.rows.length, cursor + 1);
    assert.equal(completed.verificationReport.valid, true);
    playbackCase.verifyFinal(completed.stateTrace.finalState);
    counts[playbackCase.topic] = cursor;
  }

  const invalid = await pipelineService.generatePipeline({ topicId: "STACK", initialValues: [], initializeOnly: true });
  const initialInvalidSession = pipelineService.getPipelineById(invalid.pipelineId);
  await assert.rejects(
    () => pipelineService.interactPipeline({ pipelineId: invalid.pipelineId, operation: { type: "POP" } }),
    /rejected by the deterministic state machine/i,
  );
  const afterRejected = pipelineService.getPipelineById(invalid.pipelineId);
  assert.deepEqual(afterRejected.stateTrace, initialInvalidSession.stateTrace, "Rejected operations must not change the session trace or render a scene");
  assert.equal(afterRejected.verificationReport.valid, true);

  const absentBinary = await pipelineService.generatePipeline({ topicId: "BINARY_SEARCH", initialValues: [10, 20, 30, 40, 60], initializeOnly: true });
  let absentBinaryState = absentBinary.stateTrace.finalState;
  let absentBinarySteps = 0;
  while (absentBinaryState.metadata?.terminated !== true && absentBinarySteps < 10) {
    const result = await pipelineService.interactPipeline({ pipelineId: absentBinary.pipelineId, operation: { type: "SEARCH", payload: { target: 50 } } });
    assert.equal(result.verificationReport.valid, true);
    absentBinaryState = result.updatedState;
    absentBinarySteps += 1;
  }
  assert.equal(absentBinaryState.metadata?.found, false);
  assert.equal(absentBinaryState.metadata?.terminated, true);
  assert.equal(absentBinarySteps, 4, "Binary search should include its explicit exhausted-interval completion transition");

  const absentLinear = await pipelineService.generatePipeline({ topicId: "LINEAR_SEARCH", initialValues: [15, 8, 23], initializeOnly: true });
  let absentLinearState = absentLinear.stateTrace.finalState;
  let absentLinearSteps = 0;
  while (Number(absentLinearState.pointers.currentIndex) < absentLinearState.elements.length && absentLinearSteps < 10) {
    const result = await pipelineService.interactPipeline({ pipelineId: absentLinear.pipelineId, operation: { type: "SEARCH", payload: { target: 42 } } });
    assert.equal(result.verificationReport.valid, true);
    absentLinearState = result.updatedState;
    absentLinearSteps += 1;
  }
  assert.equal(absentLinearState.metadata?.found, false);
  assert.equal(absentLinearState.pointers.currentIndex, 3);
  assert.equal(absentLinearSteps, 3, "Linear search should stop after inspecting the last in-range index");

  await assert.rejects(
    () => pipelineService.generatePipeline({ topicId: "STACK", initializeOnly: true, operations: [{ type: "PUSH", payload: { value: 1 } }] }),
    /cannot be combined/i,
  );

  console.log(`Automatic playback backend tests passed: ${Object.entries(counts).map(([topic, count]) => `${topic}=${count}`).join(", ")}; total=${Object.values(counts).reduce((sum, count) => sum + count, 0)} verified operations.`);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
