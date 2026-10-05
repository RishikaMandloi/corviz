import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { vkveService } from "../engines/vkve/vkve.service";

async function scene(topicId: "QUEUE" | "LINKED_LIST" | "BST" | "BFS") {
  return pipelineService.generatePipeline({ topicId });
}

async function expectIssue(topicId: "QUEUE" | "LINKED_LIST" | "BST" | "BFS", mutate: (graph: any) => void, code: string) {
  const result = await scene(topicId); const graph = JSON.parse(JSON.stringify(result.sceneGraph));
  mutate(graph); const report = vkveService.verify(graph, result.stateTrace);
  assert.equal(report.valid, false, `${topicId} tampering must be rejected`);
  assert.ok(report.errors.some((issue) => issue.code === code), `${topicId} must emit ${code}`);
}

async function run(): Promise<void> {
  await expectIssue("QUEUE", (g) => { g.scenes[2].objects.find((o: any) => o.id === "queue_container").properties.queue.reverse(); }, "QUEUE_CONTENT_ORDER_MISMATCH");
  await expectIssue("QUEUE", (g) => { g.scenes[1].objects.find((o: any) => o.id === "queue_container").properties.front = 1; }, "QUEUE_POINTER_STATE_MISMATCH");
  await expectIssue("LINKED_LIST", (g) => { g.scenes[1].objects.find((o: any) => o.id === "node_0").properties.nextIndex = null; }, "BROKEN_LIST_LINK");
  await expectIssue("LINKED_LIST", (g) => { g.scenes[0].objects.find((o: any) => o.id === "head_pointer").properties.targetIndex = 1; }, "INVALID_HEAD_REFERENCE");
  await expectIssue("BST", (g) => { g.scenes[0].objects.find((o: any) => o.id === "node_1").properties.parentIndex = null; }, "ORPHAN_BST_NODE");
  await expectIssue("BST", (g) => { g.scenes[0].objects.find((o: any) => o.id === "node_1").properties.value = 99; }, "INVALID_BST_ORDERING");
  await expectIssue("BFS", (g) => { g.scenes[1].objects.find((o: any) => o.id === "bfs_queue_container").properties.queue.reverse(); }, "BFS_STATE_MISMATCH");
  await expectIssue("BFS", (g) => { g.scenes[1].objects.find((o: any) => o.id === "bfs_queue_container").properties.visited.push("A"); }, "BFS_STATE_MISMATCH");
  console.log("8 semantic tampering cases passed.");
}
run().catch((error: unknown) => { console.error(error); process.exit(1); });
