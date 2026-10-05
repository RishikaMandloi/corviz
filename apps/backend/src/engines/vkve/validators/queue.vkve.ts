import {
  ISceneGraph,
  IStateExecutionTrace,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IVkveSemanticValidator } from "../vkve.types";

export class QueueVkveValidator implements IVkveSemanticValidator {
  readonly topicId = "QUEUE" as const;

  validateSemanticSceneGraph(
    sceneGraph: ISceneGraph,
    trace: IStateExecutionTrace
  ): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    const expectedSceneCount = 1 + trace.transitions.length;
    if (sceneGraph.scenes.length !== expectedSceneCount) {
      errors.push({
        code: "SCENE_COUNT_MISMATCH",
        message: `Expected ${expectedSceneCount} scenes for execution trace, but found ${sceneGraph.scenes.length}.`,
        severity: SHARED_VERIFICATION_SEVERITY.ERROR,
        validator: "VKVE",
        expected: `${expectedSceneCount} scenes`,
        actual: `${sceneGraph.scenes.length} scenes`,
      });
    }

    sceneGraph.scenes.forEach((scene, sIndex) => {
      const intent = scene.semanticIntent;
      if (!intent) {
        warnings.push({
          code: "MISSING_SEMANTIC_INTENT",
          message: `Scene "${scene.id}" lacks semantic intent annotations.`,
          severity: SHARED_VERIFICATION_SEVERITY.WARNING,
          validator: "VKVE",
          sceneId: scene.id,
        });
        return;
      }

      // Check queue container
      const container = scene.objects.find((o) => o.type === "CONTAINER");
      if (!container) {
        errors.push({
          code: "MISSING_QUEUE_CONTAINER",
          message: `Scene "${scene.id}" does not render the queue chamber.`,
          severity: SHARED_VERIFICATION_SEVERITY.ERROR,
          validator: "VKVE",
          sceneId: scene.id,
        });
      }

      // The rendered queue model must be an exact projection of the deterministic
      // snapshot, including FIFO order and front/rear pointer values.
      const expectedState = sIndex === 0 ? trace.initialState : trace.transitions[sIndex - 1]?.resultingState;
      if (container && expectedState) {
        const rendered = container.properties ?? {};
        if (JSON.stringify(rendered.queue ?? []) !== JSON.stringify(expectedState.elements)) {
          errors.push({ code: "QUEUE_CONTENT_ORDER_MISMATCH", message: `Scene "${scene.id}" does not render the verified FIFO queue order.`, severity: SHARED_VERIFICATION_SEVERITY.ERROR, validator: "VKVE", sceneId: scene.id });
        }
        if (rendered.front !== expectedState.pointers.front || rendered.rear !== expectedState.pointers.rear) {
          errors.push({ code: "QUEUE_POINTER_STATE_MISMATCH", message: `Scene "${scene.id}" front/rear metadata differs from deterministic state.`, severity: SHARED_VERIFICATION_SEVERITY.ERROR, validator: "VKVE", sceneId: scene.id });
        }
      }

      // Semantic check for ENQUEUE
      if (intent.operation === "ENQUEUE") {
        if (intent.targetSlot !== "REAR") {
          errors.push({
            code: "INVALID_OPERATION_TARGET",
            message: `Enqueue in scene "${scene.id}" targeted "${intent.targetSlot}" instead of "REAR". FIFO violation!`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
            sceneId: scene.id,
            expected: "REAR",
            actual: intent.targetSlot,
          });
        }

        const enqueuedElem = scene.objects.find(
          (o) => o.properties?.isRear === true || o.name.includes("Enqueued")
        );

        if (enqueuedElem) {
          const translateAnim = scene.animations.find(
            (a) => a.objectId === enqueuedElem.id && a.type === "TRANSLATE"
          );

          if (!translateAnim) {
            errors.push({
              code: "MISSING_ENQUEUE_ANIMATION",
              message: `Enqueued element "${enqueuedElem.id}" lacks translation motion.`,
              severity: SHARED_VERIFICATION_SEVERITY.ERROR,
              validator: "VKVE",
              sceneId: scene.id,
            });
          } else if (translateAnim.from && translateAnim.to) {
            const fromX = (translateAnim.from as { x: number }).x;
            const toX = (translateAnim.to as { x: number }).x;

            // In our layout, Rear is on the right (+X) and enters leftward (fromX > toX)
            if (fromX <= toX) {
              errors.push({
                code: "REVERSED_MOTION_DIRECTION",
                message: `Enqueue motion in scene "${scene.id}" is inverted! Moved from X=${fromX} to X=${toX}.`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: enqueuedElem.id,
                animationId: translateAnim.id,
                expected: `Entrance from rear aperture (from.x > to.x)`,
                actual: `from.x=${fromX} <= to.x=${toX}`,
              });
            }
          }
        }
      }

      // Semantic check for DEQUEUE
      if (intent.operation === "DEQUEUE") {
        if (intent.targetSlot !== "FRONT") {
          errors.push({
            code: "INVALID_OPERATION_TARGET",
            message: `Dequeue in scene "${scene.id}" targeted "${intent.targetSlot}" instead of "FRONT". FIFO violation!`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
            sceneId: scene.id,
            expected: "FRONT",
            actual: intent.targetSlot,
          });
        }

        const dequeuedElem = scene.objects.find(
          (o) => o.properties?.isRemoved === true || o.name.includes("Dequeued")
        );

        if (dequeuedElem) {
          const correspondingTransition = trace.transitions[sIndex - 1];
          if (correspondingTransition) {
            const dequeuedSlot = dequeuedElem.properties?.slotIndex;
            if (dequeuedSlot !== 0) {
              errors.push({
                code: "INVALID_OPERATION_TARGET",
                message: `Dequeue in scene "${scene.id}" removed element at slot ${dequeuedSlot}, but the front element was at slot 0. FIFO violation!`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: dequeuedElem.id,
                expected: "Removal from slot 0 (FRONT)",
                actual: `Removal from slot ${dequeuedSlot}`,
              });
            }
          }

          // Dequeued element must exit leftward (toX < fromX)
          const translateAnim = scene.animations.find(
            (a) => a.objectId === dequeuedElem.id && a.type === "TRANSLATE"
          );

          if (translateAnim && translateAnim.from && translateAnim.to) {
            const fromX = (translateAnim.from as { x: number }).x;
            const toX = (translateAnim.to as { x: number }).x;

            if (toX >= fromX) {
              errors.push({
                code: "REVERSED_MOTION_DIRECTION",
                message: `Dequeue motion in scene "${scene.id}" is inverted! Moved toward rear from X=${fromX} to X=${toX}.`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: dequeuedElem.id,
                animationId: translateAnim.id,
                expected: `Leftward exit through front aperture (to.x < from.x)`,
                actual: `to.x=${toX} >= from.x=${fromX}`,
              });
            }
          }
        }
      }
    });

    const valid = errors.length === 0;
    const confidenceScore = valid ? (warnings.length === 0 ? 1.0 : 0.88) : 0.0;

    return {
      valid,
      status: valid ? SHARED_VERIFICATION_STATUS.PASSED : SHARED_VERIFICATION_STATUS.FAILED,
      confidenceScore,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const queueVkveValidator = new QueueVkveValidator();
