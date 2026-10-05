import {
  ISceneGraph,
  IStateExecutionTrace,
  IVerificationResult,
} from "../../shared/contracts";
import { vkveService } from "../vkve/vkve.service";

export interface ISelfHealingResult {
  repaired: boolean;
  attempts: number;
  repairedSceneIds: string[];
  finalReport: IVerificationResult;
  sceneGraph: ISceneGraph;
  diagnostics: string[];
}

export class SelfHealingService {
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Apply targeted repair loop to only the affected scenes in a scene graph.
   */
  heal(
    sceneGraph: ISceneGraph,
    trace: IStateExecutionTrace,
    initialReport: IVerificationResult
  ): ISelfHealingResult {
    if (initialReport.valid) {
      return {
        repaired: false,
        attempts: 0,
        repairedSceneIds: [],
        finalReport: initialReport,
        sceneGraph,
        diagnostics: ["Scene graph already verified. No repair required."],
      };
    }

    const diagnostics: string[] = [];
    const repairedSceneIds = new Set<string>();
    let currentGraph = JSON.parse(JSON.stringify(sceneGraph)) as ISceneGraph;
    let latestReport = initialReport;
    let attempt = 0;

    while (attempt < this.MAX_RETRY_ATTEMPTS && !latestReport.valid) {
      attempt += 1;
      diagnostics.push(`Self-healing cycle ${attempt}/${this.MAX_RETRY_ATTEMPTS} starting.`);

      // Group errors by sceneId
      const targetSceneIds = Array.from(
        new Set(
          latestReport.errors
            .map((e) => e.sceneId)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
        )
      );

      if (targetSceneIds.length === 0) {
        diagnostics.push("Errors detected without specific sceneId associations. Cannot perform targeted repair.");
        break;
      }

      for (const sceneId of targetSceneIds) {
        const scene = currentGraph.scenes.find((s) => s.id === sceneId);
        if (!scene) continue;

        const sceneErrors = latestReport.errors.filter((e) => e.sceneId === sceneId);
        let sceneModified = false;

        for (const issue of sceneErrors) {
          // TARGETED REPAIR 1: Reversed Motion Direction
          if (issue.code === "REVERSED_MOTION_DIRECTION") {
            const anim = scene.animations.find(
              (a) => a.id === issue.animationId || a.type === "TRANSLATE"
            );

            if (anim && anim.from && anim.to) {
              const fromY = (anim.from as { y: number }).y;
              const toY = (anim.to as { y: number }).y;

              if (scene.semanticIntent?.operation === "PUSH" && fromY <= toY) {
                // Correct push trajectory: spawn high (4.2), move down to target slot
                anim.from = { ...(anim.from as object), y: 4.2 };
                anim.to = { ...(anim.to as object), y: Math.min(fromY, toY) };
                diagnostics.push(`Repaired REVERSED_MOTION_DIRECTION for PUSH in scene "${sceneId}".`);
                sceneModified = true;
              } else if (scene.semanticIntent?.operation === "POP" && toY <= fromY) {
                // Correct pop trajectory: start at slot, move up out of aperture (4.8)
                anim.from = { ...(anim.from as object), y: Math.min(fromY, toY) };
                anim.to = { ...(anim.to as object), y: 4.8 };
                diagnostics.push(`Repaired REVERSED_MOTION_DIRECTION for POP in scene "${sceneId}".`);
                sceneModified = true;
              } else if (scene.semanticIntent?.operation === "ENQUEUE") {
                anim.from = { ...(anim.from as object), x: 4.5 };
                diagnostics.push(`Repaired REVERSED_MOTION_DIRECTION for ENQUEUE in scene "${sceneId}".`);
                sceneModified = true;
              } else if (scene.semanticIntent?.operation === "DEQUEUE") {
                anim.to = { ...(anim.to as object), x: -4.5 };
                diagnostics.push(`Repaired REVERSED_MOTION_DIRECTION for DEQUEUE in scene "${sceneId}".`);
                sceneModified = true;
              }
            }
          }

          // TARGETED REPAIR 2: Invalid Operation Target Slot
          if (issue.code === "INVALID_OPERATION_TARGET") {
            if (scene.semanticIntent) {
              const op = scene.semanticIntent.operation;
              if (op === "PUSH" || op === "POP") {
                scene.semanticIntent.targetSlot = "TOP";
                diagnostics.push(`Repaired INVALID_OPERATION_TARGET to "TOP" for ${op} in scene "${sceneId}".`);
              } else if (op === "ENQUEUE") {
                scene.semanticIntent.targetSlot = "REAR";
                diagnostics.push(`Repaired INVALID_OPERATION_TARGET to "REAR" for ENQUEUE in scene "${sceneId}".`);
              } else if (op === "DEQUEUE") {
                scene.semanticIntent.targetSlot = "FRONT";
                diagnostics.push(`Repaired INVALID_OPERATION_TARGET to "FRONT" for DEQUEUE in scene "${sceneId}".`);
              }
              sceneModified = true;
            }

            // Check if wrong element was animated during POP
            if (scene.semanticIntent?.operation === "POP") {
              const prevTop = trace.transitions[scene.order - 2]?.previousState.pointers.top;
              if (prevTop !== null && prevTop !== undefined) {
                const wrongElem = scene.objects.find((o) => o.properties?.isRemoved === true);
                if (wrongElem && wrongElem.id !== `elem_${prevTop}`) {
                  wrongElem.properties = { ...wrongElem.properties, isRemoved: false };
                  const actualTopElem = scene.objects.find((o) => o.id === `elem_${prevTop}`);
                  if (actualTopElem) {
                    actualTopElem.properties = { ...actualTopElem.properties, isRemoved: true };
                    // re-wire animation objectId
                    const anim = scene.animations.find((a) => a.objectId === wrongElem.id);
                    if (anim) anim.objectId = actualTopElem.id;
                    diagnostics.push(`Reassigned POP removal from "${wrongElem.id}" to top element "${actualTopElem.id}".`);
                    sceneModified = true;
                  }
                }
              }
            }
          }

          // TARGETED REPAIR 3: Invalid Pointer Target
          if (issue.code === "INVALID_POINTER_TARGET") {
            const pointer = scene.objects.find((o) => o.type === "POINTER");
            if (pointer && pointer.properties) {
              pointer.properties.targetSlot = "TOP";
              diagnostics.push(`Repaired Top pointer targetSlot in scene "${sceneId}".`);
              sceneModified = true;
            }
          }

          // State-projection repairs: each value below is derived from the authoritative
          // execution trace for this scene, never inferred from a corrupted visual.
          const transition = trace.transitions[scene.order - 2];
          const expected = scene.order === 1 ? trace.initialState : transition?.resultingState;
          if (expected && (issue.code === "QUEUE_CONTENT_ORDER_MISMATCH" || issue.code === "QUEUE_POINTER_STATE_MISMATCH")) {
            const container = scene.objects.find((o) => o.id === "queue_container");
            if (container) { container.properties = { ...container.properties, queue: [...expected.elements], front: expected.pointers.front, rear: expected.pointers.rear }; sceneModified = true; diagnostics.push(`Restored verified FIFO state in "${sceneId}".`); }
          }
          if (expected && (issue.code === "BROKEN_LIST_LINK" || issue.code === "INVALID_HEAD_REFERENCE")) {
            const nodes = scene.objects.filter((o) => o.type === "NODE");
            nodes.forEach((node, index) => { node.properties = { ...node.properties, value: expected.elements[index], index, hasNext: index < nodes.length - 1, nextIndex: index < nodes.length - 1 ? index + 1 : null }; });
            const head = scene.objects.find((o) => o.id === "head_pointer"); if (head) head.properties = { ...head.properties, targetIndex: nodes.length ? 0 : null, targetSlot: "HEAD" };
            sceneModified = true; diagnostics.push(`Restored linked-list topology in "${sceneId}".`);
          }
          if (expected && (issue.code === "BFS_STATE_MISMATCH" || issue.code === "INVALID_BFS_CURRENT_VERTEX" || issue.code === "DUPLICATE_BFS_VISIT" || issue.code === "DUPLICATE_BFS_TRAVERSAL")) {
            const queue = scene.objects.find((o) => o.id === "bfs_queue_container");
            if (queue) { queue.properties = { ...queue.properties, queue: expected.metadata?.queue ?? [], visited: expected.metadata?.visited ?? [], traversalOrder: expected.metadata?.traversalOrder ?? [], current: expected.pointers.current, newlyEnqueued: expected.metadata?.newlyEnqueued ?? [] }; sceneModified = true; diagnostics.push(`Restored BFS queue and traversal metadata in "${sceneId}".`); }
          }
          if (expected && (issue.code === "ORPHAN_BST_NODE" || issue.code === "INVALID_PARENT_CHILD_REFERENCE" || issue.code === "INVALID_BST_ORDERING")) {
            const nodes = scene.objects.filter((o) => o.type === "NODE");
            const relations = expected.elements.map(() => ({ parentIndex: null as number | null, leftIndex: null as number | null, rightIndex: null as number | null }));
            for (let index = 1; index < expected.elements.length; index++) { const value = Number(expected.elements[index]); let parent = 0; while (true) { const key = value < Number(expected.elements[parent]) ? "leftIndex" : "rightIndex"; const child = relations[parent][key]; if (child === null) { relations[parent][key] = index; relations[index].parentIndex = parent; break; } parent = child; } }
            nodes.forEach((node, index) => { node.properties = { ...node.properties, value: expected.elements[index], index, isRoot: index === 0, ...relations[index] }; });
            const root = scene.objects.find((o) => o.id === "root_pointer"); if (root) root.properties = { ...root.properties, targetIndex: 0, targetSlot: "ROOT" };
            sceneModified = true; diagnostics.push(`Restored BST topology from insertion state in "${sceneId}".`);
          }
          if (expected && (issue.code === "ARRAY_STATE_MISMATCH" || issue.code === "ARRAY_LENGTH_MISMATCH")) {
            scene.objects.filter((o) => o.type === "BOX").forEach((box, index) => { box.properties = { ...box.properties, value: expected.elements[index], index }; });
            sceneModified = true; diagnostics.push(`Restored array cell values from deterministic state in "${sceneId}".`);
          }
        }

        if (sceneModified) {
          repairedSceneIds.add(sceneId);
        }
      }

      // Re-verify after targeted repairs
      latestReport = vkveService.verify(currentGraph, trace);
      if (latestReport.valid) {
        diagnostics.push(`Targeted self-healing succeeded at attempt ${attempt}. Scene graph is now VERIFIED.`);
        break;
      }
    }

    if (!latestReport.valid) {
      diagnostics.push(`Targeted self-healing exhausted ${this.MAX_RETRY_ATTEMPTS} attempts without passing verification.`);
    }

    return {
      repaired: latestReport.valid && repairedSceneIds.size > 0,
      attempts: attempt,
      repairedSceneIds: Array.from(repairedSceneIds),
      finalReport: latestReport,
      sceneGraph: currentGraph,
      diagnostics,
    };
  }
}

export const selfHealingService = new SelfHealingService();
