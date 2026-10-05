import assert from "node:assert/strict";
import { pipelineService } from "../modules/pipeline/pipeline.service";
import { vkveService } from "../engines/vkve/vkve.service";
import { selfHealingService } from "../engines/self-healing/self-healing.service";

async function repair(topicId: "QUEUE" | "LINKED_LIST" | "BST" | "BFS" | "BUBBLE_SORT" | "BINARY_SEARCH" | "LINEAR_SEARCH" | "SELECTION_SORT" | "TWO_POINTERS", mutate: (graph: any) => void) {
  const result = await pipelineService.generatePipeline({ topicId }); const graph = JSON.parse(JSON.stringify(result.sceneGraph)); const untouched = JSON.stringify(graph.scenes[0]); mutate(graph);
  const failed = vkveService.verify(graph, result.stateTrace); assert.equal(failed.valid, false);
  const healed = selfHealingService.heal(graph, result.stateTrace, failed);
  assert.equal(healed.finalReport.valid, true, `${topicId} repair must verify`); assert.ok(healed.repairedSceneIds.length > 0); assert.equal(JSON.stringify(healed.sceneGraph.scenes[0]), untouched, "unrelated initial scene must remain unchanged");
}
async function run() {
  await repair("QUEUE", g => g.scenes[1].objects.find((o:any)=>o.id==="queue_container").properties.queue.reverse());
  await repair("LINKED_LIST", g => g.scenes[1].objects.find((o:any)=>o.id==="node_0").properties.nextIndex=null);
  await repair("BST", g => g.scenes[0].objects.find((o:any)=>o.id==="node_1").properties.parentIndex=null);
  await repair("BFS", g => g.scenes[1].objects.find((o:any)=>o.id==="bfs_queue_container").properties.queue.reverse());
  await repair("BUBBLE_SORT", g => g.scenes[1].objects.find((o:any)=>o.type==="BOX").properties.value=999);
  console.log("5 targeted self-healing cases passed.");
}
run().catch((error:unknown)=>{console.error(error);process.exit(1)});
