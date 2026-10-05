import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { vkveService } from "../engines/vkve/vkve.service";
import { selfHealingService } from "../engines/self-healing/self-healing.service";
import { ISceneGraph } from "../shared/contracts";

async function runTests() {
  console.log("\n=======================================================");
  console.log("RUNNING VERIFIED EDUCATIONAL ACCURACY REGRESSION SUITE");
  console.log("=======================================================\n");

  // ------------------------------------------------------------------
  // TEST 1: End-to-End Verified Pipeline Generation (Valid Stack Case)
  // ------------------------------------------------------------------
  console.log("TEST 1: Valid Stack Pipeline Generation (Push 40, Pop)...");
  const result = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10, 20, 30],
    operations: [
      { type: "PUSH", payload: { value: 40 } },
      { type: "POP" },
    ],
  });

  assert.equal(result.success, true, "Pipeline generation must succeed.");
  assert.equal(result.topic.id, "STACK");
  assert.equal(result.ckr.topicId, "STACK");
  assert.equal(
    result.ckr.invariants.some((i) => i.id === "LIFO"),
    true,
    "CKR must enforce LIFO invariant."
  );

  // Assert State Trace correctness
  assert.equal(result.stateTrace.initialState.elements.length, 3);
  assert.deepEqual(result.stateTrace.initialState.elements, [10, 20, 30]);
  assert.equal(result.stateTrace.initialState.pointers.top, 2);

  // Transition 1: Push(40)
  const t1 = result.stateTrace.transitions[0];
  assert.equal(t1.operation.type, "PUSH");
  assert.deepEqual(t1.resultingState.elements, [10, 20, 30, 40]);
  assert.equal(t1.resultingState.pointers.top, 3);

  // Transition 2: Pop()
  const t2 = result.stateTrace.transitions[1];
  assert.equal(t2.operation.type, "POP");
  assert.deepEqual(t2.resultingState.elements, [10, 20, 30]);
  assert.equal(t2.resultingState.pointers.top, 2);

  // Assert Scene Graph
  assert.equal(result.sceneGraph.scenes.length, 3, "Must produce exactly 3 scenes (1 init + 2 ops).");

  // Assert Verification
  assert.equal(result.verificationReport.valid, true, "Valid Stack must PASS verification.");
  assert.equal(result.verificationReport.status, "PASSED");
  assert.equal(result.verificationReport.errors.length, 0);

  // Assert Narration & Dry Run & Quiz
  assert.equal(result.narrationScript.length, 3);
  assert.equal(result.dryRun.rows.length, 3);
  assert.equal(result.quiz.questions.length, 4);
  assert.equal(result.quiz.questions[0].id, "q_final_verified_state");
  assert.equal(result.quiz.questions[0].options.find((o) => o.isCorrect)?.text, "30");

  // Check deterministically derived quiz answer (current top is 30)
  const q1 = result.quiz.questions.find((q) => q.id === "q_top_value");
  assert.ok(q1, "Quiz must contain q_top_value");
  const correctOpt = q1.options.find((o) => o.id === q1.correctAnswerId);
  assert.equal(correctOpt?.text, "30", "Correct quiz answer must deterministically match state top (30).");
  console.log("✔ TEST 1 PASSED: Valid Stack end-to-end pipeline verified.");

  // ------------------------------------------------------------------
  // TEST 2: Intentional Failure Case 1 — Reversed Motion Direction
  // ------------------------------------------------------------------
  console.log("\nTEST 2: Intentional Failure Case 1 (Reversed Motion Direction on Push)...");
  const tamperedGraph1: ISceneGraph = JSON.parse(JSON.stringify(result.sceneGraph));
  const pushScene = tamperedGraph1.scenes[1]; // Push scene
  const pushedElemAnim = pushScene.animations.find(
    (a) => a.type === "TRANSLATE" && a.objectId === "elem_3"
  );
  assert.ok(pushedElemAnim, "Must find translate animation in push scene.");

  // Invert trajectory: from Y=-2.0 to Y=4.0 (element enters from bottom into top)
  pushedElemAnim.from = { x: 0, y: -2.0, z: 0 };
  pushedElemAnim.to = { x: 0, y: 4.0, z: 0 };

  const failReport1 = vkveService.verify(tamperedGraph1, result.stateTrace);
  assert.equal(failReport1.valid, false, "VKVE must reject inverted motion trajectory.");
  assert.equal(failReport1.status, "FAILED");
  const hasReversedError = failReport1.errors.some((e) => e.code === "REVERSED_MOTION_DIRECTION");
  assert.equal(hasReversedError, true, "VKVE must emit REVERSED_MOTION_DIRECTION.");
  console.log("✔ TEST 2 PASSED: VKVE correctly rejected reversed motion with REVERSED_MOTION_DIRECTION.");

  // ------------------------------------------------------------------
  // TEST 3: Intentional Failure Case 2 — Pop Removes Bottom Element (LIFO Violation)
  // ------------------------------------------------------------------
  console.log("\nTEST 3: Intentional Failure Case 2 (Pop removes bottom element instead of top)...");
  const tamperedGraph2: ISceneGraph = JSON.parse(JSON.stringify(result.sceneGraph));
  const popScene = tamperedGraph2.scenes[2]; // Pop scene
  const poppedElem = popScene.objects.find((o) => o.properties?.isRemoved === true);
  assert.ok(poppedElem, "Must find popped element object in pop scene.");

  // Change removed element slot index to 0 (bottom element) instead of 3
  poppedElem.properties = { ...poppedElem.properties, slotIndex: 0 };

  const failReport2 = vkveService.verify(tamperedGraph2, result.stateTrace);
  assert.equal(failReport2.valid, false, "VKVE must reject bottom element removal.");
  assert.equal(failReport2.status, "FAILED");
  const hasTargetError = failReport2.errors.some((e) => e.code === "INVALID_OPERATION_TARGET");
  assert.equal(hasTargetError, true, "VKVE must emit INVALID_OPERATION_TARGET when bottom is popped.");
  console.log("✔ TEST 3 PASSED: VKVE correctly detected LIFO violation with INVALID_OPERATION_TARGET.");

  // ------------------------------------------------------------------
  // TEST 4: Targeted Self-Healing / Repair Loop
  // ------------------------------------------------------------------
  console.log("\nTEST 4: Targeted Self-Healing / Repair Loop...");
  const healResult = selfHealingService.heal(tamperedGraph1, result.stateTrace, failReport1);
  assert.equal(healResult.repaired, true, "Self-healing must successfully repair inverted motion.");
  assert.equal(healResult.finalReport.valid, true, "Final report must PASS after repair.");
  assert.equal(
    healResult.repairedSceneIds.includes("scene-stack-step-1"),
    true,
    "Must specifically repair scene-stack-step-1."
  );
  assert.ok(healResult.attempts <= 3, "Must succeed within max 3 retry attempts.");
  console.log("✔ TEST 4 PASSED: Targeted Self-Healing successfully repaired scene defect.");

  // ------------------------------------------------------------------
  // TEST 5: Interactive Dynamic Values Flow (Push 99)
  // ------------------------------------------------------------------
  console.log("\nTEST 5: Interactive Dynamic Value Interaction (Push 99)...");
  const interactivePipeline = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10, 20],
    operations: [{ type: "PUSH", payload: { value: 40 } }],
  });
  const interactResult = await pipelineService.interactPipeline({
    pipelineId: interactivePipeline.pipelineId,
    operation: {
      type: "PUSH",
      payload: { value: 99 },
    },
  });

  assert.equal(interactResult.success, true);
  assert.deepEqual(interactResult.updatedState.elements, [10, 20, 40, 99]);
  assert.equal(interactResult.updatedState.pointers.top, 3);
  assert.equal(interactResult.verificationReport.valid, true);
  assert.equal(interactResult.dryRunRow.step, 2);
  assert.deepEqual(interactResult.transition.previousState.elements, [10, 20, 40]);
  assert.equal(interactResult.quiz.questions.find((q) => q.id === "q_final_verified_state")?.options.find((option) => option.isCorrect)?.text, "99");
  console.log("✔ TEST 5 PASSED: Interactive value modification recomputed state and passed verification.");

  // ------------------------------------------------------------------
  // TEST 6: Scope Guard — Rejection of Unsupported Topics
  // ------------------------------------------------------------------
  console.log("\nTEST 6: Scope Guard (Unsupported Topic Rejection)...");
  try {
    await pipelineService.generatePipeline({
      topicId: "UNSUPPORTED_TOPIC" as any,
    });
    assert.fail("Should have thrown error for unsupported topic.");
  } catch (err) {
    assert.ok(err instanceof Error);
    assert.equal(err.message.includes("unsupported"), true);
    console.log("✔ TEST 6 PASSED: Unsupported topic rejected with clean error message.");
  }

  console.log("\n=======================================================");
  console.log("ALL 6 ACCURACY AND REGRESSION TESTS PASSED (100% PASS RATE)");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("❌ TEST RUN FAILED:", err);
  process.exit(1);
});

