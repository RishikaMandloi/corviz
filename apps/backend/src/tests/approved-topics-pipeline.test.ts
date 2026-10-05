import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { vkveService } from "../engines/vkve/vkve.service";
import { SupportedTopicId } from "../shared/contracts";

const TOPICS: SupportedTopicId[] = [
  "QUEUE", "BINARY_SEARCH", "BUBBLE_SORT", "LINEAR_SEARCH", "LINKED_LIST",
  "BST", "SELECTION_SORT", "TWO_POINTERS", "BFS",
];

async function runTests(): Promise<void> {
  for (const topicId of TOPICS) {
    const pipeline = await pipelineService.generatePipeline({ topicId });
    assert.equal(pipeline.success, true, `${topicId} pipeline must generate.`);
    assert.equal(pipeline.verificationReport.valid, true, `${topicId} scene graph must pass VKVE.`);
    assert.equal(pipeline.sceneGraph.scenes.length, pipeline.stateTrace.transitions.length + 1);
    assert.ok(pipeline.dryRun.rows.length > 0, `${topicId} must have dry-run output.`);
    assert.ok(pipeline.quiz.questions.length > 0, `${topicId} must have a derived quiz.`);

    // Every topic must reject a semantically incomplete scene, rather than accepting
    // an arbitrary graph just because it is structurally well-formed.
    const tampered = JSON.parse(JSON.stringify(pipeline.sceneGraph));
    const forbiddenId = topicId === "LINKED_LIST" ? "head_pointer" : topicId === "BST" ? "root_pointer" : undefined;
    tampered.scenes[0].objects = tampered.scenes[0].objects.filter(
      (object: { id: string; type: string }) => forbiddenId ? object.id !== forbiddenId : object.type !== "CONTAINER"
    );
    const report = vkveService.verify(tampered, pipeline.stateTrace);
    assert.equal(report.valid, false, `${topicId} VKVE must reject missing visual container.`);
  }

  console.log(`Verified generation and semantic rejection passed for ${TOPICS.length} approved topics.`);
}

runTests().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
