import assert from "node:assert/strict";
import app from "../app";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { tutorService } from "../modules/tutor/tutor.service";

async function testApiContract(): Promise<void> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const { port } = server.address() as { port: number };
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/tutor/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: "STACK", question: "What is a stack?" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.topicId, "STACK");
    assert.equal(payload.data.verifiedContext, true);
    assert.ok(typeof payload.data.answer === "string" && payload.data.answer.length > 0);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function main(): Promise<void> {
  const stackA = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10, 20, 40],
    operations: [{ type: "PUSH", payload: { value: 50 } }],
  });
  const stackB = await pipelineService.generatePipeline({
    topicId: "STACK",
    initialValues: [10, 20, 40],
    operations: [{ type: "POP" }],
  });

  const concept = await tutorService.ask({ topicId: "STACK", question: "What is a stack?" });
  assert.match(concept.answer.toLowerCase(), /stack|last in first out|lifo/i);
  assert.doesNotMatch(concept.answer, /current state is/i);

  const whyAnswer = await tutorService.ask({ topicId: "STACK", question: "Why does a stack follow LIFO?" });
  assert.match(whyAnswer.answer.toLowerCase(), /lifo|last-in|last in|first out|top/i);

  const conceptWithPipeline = await tutorService.ask({
    topicId: "STACK",
    question: "Explain Stack",
    pipelineId: stackA.pipelineId,
  });
  assert.match(conceptWithPipeline.answer.toLowerCase(), /what is a stack|lifo|stack/i);
  assert.doesNotMatch(conceptWithPipeline.answer, /current verified state is/i);

  const operationQuestion = await tutorService.ask({
    topicId: "STACK",
    question: "What is the current operation?",
    pipelineId: stackA.pipelineId,
  });
  assert.match(operationQuestion.answer.toLowerCase(), /push|operation|top/i);

  const currentState = await tutorService.ask({
    topicId: "STACK",
    question: "Why is 50 on top?",
    pipelineId: stackA.pipelineId,
  });
  assert.match(currentState.answer, /50.*top|top.*50|last.*50/i);
  assert.deepEqual(
    pipelineService.getPipelineById(stackA.pipelineId).stateTrace,
    stackA.stateTrace,
    "Tutor questions must not mutate the authoritative lesson trace",
  );

  const operation = await tutorService.ask({
    topicId: "STACK",
    question: "What happened when I pushed 50?",
    pipelineId: stackA.pipelineId,
  });
  assert.match(operation.answer, /pushed 50|added 50|50.*top/i);

  const followUp = await tutorService.ask({
    topicId: "STACK",
    question: "Explain this step again.",
    pipelineId: stackA.pipelineId,
  });
  assert.ok(followUp.answer.length > 40);

  const inventedState = await tutorService.ask({
    topicId: "STACK",
    question: "Why is 30 on top?",
    pipelineId: stackA.pipelineId,
  });
  assert.doesNotMatch(inventedState.answer, /30.*top|30.*on top/i);

  const providerResult = await tutorService.ask({
    topicId: "STACK",
    question: "Why is 50 on top?",
    pipelineId: stackA.pipelineId,
    currentState: { elements: [30], pointers: { top: 0 }, statusMessage: "Forged client state" },
    provider: {
      async generateResponse(_question, context) {
        assert.deepEqual(context.currentState?.elements, [10, 20, 40, 50], "Tutor context must use server-cached state, not client state.");
        return {
          answer: "Because 30 is on top.",
          source: "AI_WITH_VERIFIED_CONTEXT",
          verifiedContext: true,
        };
      },
    },
  });
  assert.ok(!/30.*top|30.*on top/i.test(providerResult.answer));
  assert.equal(providerResult.source, "FALLBACK");

  const arbitraryUnsupportedValue = await tutorService.ask({
    topicId: "STACK",
    question: "What is on top?",
    pipelineId: stackA.pipelineId,
    provider: {
      async generateResponse() {
        return { answer: "9001 is on top.", source: "AI_WITH_VERIFIED_CONTEXT", verifiedContext: true };
      },
    },
  });
  assert.ok(!/9001.*top|9001.*on top/i.test(arbitraryUnsupportedValue.answer));
  assert.equal(arbitraryUnsupportedValue.source, "FALLBACK");

  const stateDiff = await tutorService.ask({
    topicId: "STACK",
    question: "What is the current top?",
    pipelineId: stackA.pipelineId,
  });
  assert.match(stateDiff.answer.toLowerCase(), /50|top/i);
  const popDiff = await tutorService.ask({
    topicId: "STACK",
    question: "What is the current top?",
    pipelineId: stackB.pipelineId,
  });
  assert.notEqual(stateDiff.answer, popDiff.answer);

  const stepExplanation = await tutorService.ask({
    topicId: "STACK",
    question: "Explain the current step",
    pipelineId: stackA.pipelineId,
  });
  assert.match(stepExplanation.answer.toLowerCase(), /push|50|top|operation/i);

  const moreQuiz = await tutorService.ask({
    topicId: "STACK",
    question: "Give me more quiz",
    pipelineId: stackA.pipelineId,
  });
  assert.match(moreQuiz.answer, /question\s*1|question\s*2|quiz/i);

  const fiveQuiz = await tutorService.ask({
    topicId: "STACK",
    question: "Give me 5 quiz questions",
    pipelineId: stackA.pipelineId,
  });
  assert.match(fiveQuiz.answer, /5/i);

  const helloAnswer = await tutorService.ask({ topicId: "STACK", question: "Hello" });
  assert.doesNotMatch(helloAnswer.answer, /current state is|verified context/i);

  const unsupported = await tutorService.ask({ topicId: "STACK", question: "Tell me about quantum computing" });
  assert.match(unsupported.answer.toLowerCase(), /corviz|stack|queue|binary search|help with/i);

  await assert.rejects(
    () => tutorService.ask({ topicId: "UNKNOWN" as any, question: "What is a stack?" }),
    /unsupported topic/i,
  );

  const fallbackFromProviderFailure = await tutorService.ask({
    topicId: "STACK",
    question: "Why did 50 become the top?",
    pipelineId: stackA.pipelineId,
    provider: {
      async generateResponse() {
        throw new Error("provider unavailable");
      },
    },
  });
  assert.equal(fallbackFromProviderFailure.verifiedContext, true);
  assert.equal(fallbackFromProviderFailure.source, "FALLBACK");

  await testApiContract();
  console.log("Tutor engine tests passed: concept, state, operation, follow-up, validation, fallback, and API contract.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
