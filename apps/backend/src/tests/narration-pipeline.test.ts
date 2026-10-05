import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { SupportedTopicId } from "../shared/contracts";
import { generatePipelineSchema, interactPipelineSchema } from "../modules/pipeline/pipeline.validation";

const TOPICS: SupportedTopicId[] = [
  "STACK", "QUEUE", "BINARY_SEARCH", "BUBBLE_SORT", "LINEAR_SEARCH",
  "LINKED_LIST", "BST", "SELECTION_SORT", "TWO_POINTERS", "BFS",
];

async function run(): Promise<void> {
  for (const topicId of TOPICS) {
    const pipeline = await pipelineService.generatePipeline({ topicId });
    assert.equal(pipeline.verificationReport.valid, true, `${topicId} must pass VKVE before narration is returned`);
    assert.equal(pipeline.narrationScript.length, pipeline.sceneGraph.scenes.length, `${topicId} needs one narration segment per verified scene`);
    const stateQuestion = pipeline.quiz.questions[0];
    assert.equal(stateQuestion.id, "q_final_verified_state", `${topicId} should lead with the execution-derived question`);
    assert.equal(stateQuestion.options.filter((option) => option.isCorrect).length, 1);
    assert.ok(stateQuestion.options.some((option) => option.id === stateQuestion.correctAnswerId && option.isCorrect));
    let timelineStart = 0;
    pipeline.narrationScript.forEach((segment, index) => {
      const scene = pipeline.sceneGraph.scenes[index];
      assert.equal(segment.sceneId, scene.id, `${topicId} narration ${index} must reference its scene`);
      assert.equal(segment.order, scene.order);
      assert.equal(segment.start, timelineStart, `${topicId} narration start must follow cumulative scene duration`);
      assert.equal(segment.duration, scene.duration, `${topicId} narration duration must follow the scene duration`);
      assert.equal(scene.narration?.text, segment.text, `${topicId} spoken and displayed narration must match`);
      assert.ok(segment.text.length > 35, `${topicId} narration should explain rather than use a generic cue`);
      timelineStart += scene.duration;
    });
  }

  const stack = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10, 20, 30],
    operations: [{ type: "PUSH", payload: { value: 40 } }, { type: "POP" }],
  });
  assert.match(stack.narrationScript[1].text, /pushing 40/i);
  assert.match(stack.narrationScript[1].text, /top pointer is at index 3/i);
  assert.match(stack.narrationScript[2].text, /removing 40/i);
  assert.match(stack.narrationScript[2].text, /30 is now on top/i);
  const changedStack = await pipelineService.generatePipeline({ topicId: "STACK", initialValues: [10, 20], operations: [{ type: "PUSH", payload: { value: 77 } }] });
  assert.equal(changedStack.quiz.questions[0].options.find((option) => option.isCorrect)?.text, "77");
  assert.notEqual(changedStack.quiz.questions[0].options.find((option) => option.isCorrect)?.text, stack.quiz.questions[0].options.find((option) => option.isCorrect)?.text);

  const queue = await pipelineService.generatePipeline({ topicId: "QUEUE" });
  assert.match(queue.narrationScript[1].text, /adding 40 at the rear/i);
  const binarySearch = await pipelineService.generatePipeline({ topicId: "BINARY_SEARCH" });
  assert.match(binarySearch.narrationScript[1].text, /searching for 50/i);
  assert.match(binarySearch.narrationScript[1].text, /compared 50 with the middle value 40/i);
  assert.match(binarySearch.narrationScript[1].text, /next middle value is 60/i);
  const list = await pipelineService.generatePipeline({ topicId: "LINKED_LIST" });
  assert.match(list.narrationScript[1].text, /linked list/i);
  assert.match(list.narrationScript[1].text, /head pointer/i);
  const bst = await pipelineService.generatePipeline({ topicId: "BST" });
  assert.match(bst.narrationScript[1].text, /binary search tree/i);
  const bstPath = await pipelineService.generatePipeline({
    topicId: "BST",
    initialValues: [40, 20, 60],
    operations: [{ type: "INSERT", payload: { value: 55 } }, { type: "SEARCH", payload: { target: 55 } }],
  });
  assert.equal(bstPath.stateTrace.transitions[0].resultingState.metadata?.parentIndex, 2);
  assert.deepEqual(bstPath.stateTrace.transitions[1].resultingState.metadata?.traversalPath, [0, 2, 3]);
  assert.equal(bstPath.verificationReport.valid, true);
  const bfs = await pipelineService.generatePipeline({ topicId: "BFS" });
  assert.equal(bfs.stateTrace.transitions.length, 1, "Default BFS lesson should leave work queued for interactive continuation");
  assert.deepEqual(bfs.stateTrace.finalState.metadata?.queue, ["B", "C"]);
  assert.match(bfs.narrationScript[1].text, /queue contains/i);
  assert.match(bfs.narrationScript[1].text, /visited vertices/i);

  const bfsInteraction = await pipelineService.interactPipeline({ pipelineId: bfs.pipelineId, operation: { type: "VISIT_AND_EXPAND", payload: { vertex: "B" } } });
  assert.equal(bfsInteraction.transition.operation.payload?.vertex, "B");
  assert.deepEqual(bfsInteraction.updatedState.metadata?.queue, ["C", "D"]);
  await assert.rejects(
    () => pipelineService.interactPipeline({ pipelineId: bfs.pipelineId, operation: { type: "VISIT_AND_EXPAND", payload: { vertex: "D" } } }),
    /rejected by the deterministic state machine/i,
    "BFS cannot bypass the current FIFO queue-front vertex",
  );

  const interaction = await pipelineService.interactPipeline({
    pipelineId: stack.pipelineId,
    operation: { type: "PUSH", payload: { value: 99 } },
  });
  assert.equal(interaction.verificationReport.valid, true);
  assert.equal(interaction.narration.sceneId, interaction.updatedScene.id);
  assert.equal(interaction.narration.start, stack.sceneGraph.totalDuration);
  assert.equal(interaction.updatedScene.narration?.text, interaction.narration.text);
  assert.match(interaction.narration.text, /pushing 99/i);
  assert.match(interaction.narration.text, /99 is now the top element/i);
  assert.equal(interaction.quiz.questions.find((item) => item.id === "q_final_verified_state")?.options.find((option) => option.isCorrect)?.text, "99");
  assert.deepEqual(pipelineService.getPipelineById(stack.pipelineId).stateTrace.finalState.elements, [10, 20, 30, 99]);

  const emptyStack = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10],
    operations: [{ type: "POP" }],
  });
  await assert.rejects(
    () => pipelineService.interactPipeline({
      pipelineId: emptyStack.pipelineId,
      operation: { type: "POP" },
    }),
    /underflow|empty/i,
    "Rejected operations must not produce narration for an invalid transition",
  );
  await assert.rejects(
    () => pipelineService.generatePipeline({ topicId: "STACK", initialValues: [], operations: [{ type: "POP" }] }),
    /rejected by the deterministic state machine/i,
    "Invalid operations in generated sequences must not reach visualization, narration, or quizzes",
  );
  assert.equal(
    interactPipelineSchema.safeParse({ pipelineId: stack.pipelineId, operation: { type: "PUSH", payload: { value: 5 } }, currentState: { elements: [], pointers: {}, statusMessage: "forged" } }).success,
    false,
    "The API request contract must reject client-supplied state",
  );
  assert.equal(
    generatePipelineSchema.safeParse({ topicId: "STACK", initializeOnly: true }).success,
    true,
    "The API must accept an initial-only verified playback session",
  );

  console.log("Narration pipeline tests passed: 10 topics, scene alignment, state-specific text, interaction narration, and rejected-operation guard.");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
