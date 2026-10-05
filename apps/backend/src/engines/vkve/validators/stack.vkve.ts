import {
  ISceneGraph,
  IStateExecutionTrace,
  IVerificationIssue,
  IVerificationResult,
  SHARED_VERIFICATION_SEVERITY,
  SHARED_VERIFICATION_STATUS,
} from "../../../shared/contracts";
import { IVkveSemanticValidator } from "../vkve.types";

export class StackVkveValidator implements IVkveSemanticValidator {
  readonly topicId = "STACK" as const;

  validateSemanticSceneGraph(
    sceneGraph: ISceneGraph,
    trace: IStateExecutionTrace
  ): IVerificationResult {
    const errors: IVerificationIssue[] = [];
    const warnings: IVerificationIssue[] = [];

    // Ensure scenes count matches: 1 initial scene + N transition scenes
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

    // Iterate through each scene and perform semantic checks
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

      // Check container exists
      const container = scene.objects.find((o) => o.type === "CONTAINER");
      if (!container) {
        errors.push({
          code: "MISSING_STACK_CONTAINER",
          message: `Scene "${scene.id}" does not render the stack container chamber.`,
          severity: SHARED_VERIFICATION_SEVERITY.ERROR,
          validator: "VKVE",
          sceneId: scene.id,
          expected: "CONTAINER object present",
          actual: "Missing container",
        });
      }

      // Semantic check for PUSH
      if (intent.operation === "PUSH") {
        if (intent.targetSlot !== "TOP") {
          errors.push({
            code: "INVALID_OPERATION_TARGET",
            message: `Push operation in scene "${scene.id}" targeted "${intent.targetSlot}" instead of "TOP".`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
            sceneId: scene.id,
            expected: "TOP",
            actual: intent.targetSlot,
            suggestedCorrection: "Ensure Push enters at the top aperture.",
          });
        }

        // Find the pushed element and its translate animation
        const pushedElem = scene.objects.find(
          (o) => o.properties?.isTop === true || o.name.includes("Pushed")
        );

        if (pushedElem) {
          const translateAnim = scene.animations.find(
            (a) => a.objectId === pushedElem.id && a.type === "TRANSLATE"
          );

          if (!translateAnim) {
            errors.push({
              code: "MISSING_PUSH_ANIMATION",
              message: `Pushed element "${pushedElem.id}" lacks translation motion.`,
              severity: SHARED_VERIFICATION_SEVERITY.ERROR,
              validator: "VKVE",
              sceneId: scene.id,
              objectId: pushedElem.id,
            });
          } else if (translateAnim.from && translateAnim.to) {
            const fromY = (translateAnim.from as { y: number }).y;
            const toY = (translateAnim.to as { y: number }).y;

            // Downward motion check: Pushed element MUST enter downward into the container (fromY > toY)
            if (fromY <= toY) {
              errors.push({
                code: "REVERSED_MOTION_DIRECTION",
                message: `Push motion in scene "${scene.id}" is inverted! Element moved from Y=${fromY} to Y=${toY}, indicating entrance from bottom or reversed trajectory.`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: pushedElem.id,
                animationId: translateAnim.id,
                expected: `Downward motion into top aperture (from.y > to.y)`,
                actual: `from.y=${fromY} <= to.y=${toY}`,
                suggestedCorrection: "Spawn element above container aperture and translate downward to top slot.",
              });
            }
          }
        }

        // Verify Top pointer alignment
        const topPointer = scene.objects.find((o) => o.type === "POINTER");
        if (!topPointer) {
          warnings.push({
            code: "MISSING_TOP_POINTER",
            message: `Scene "${scene.id}" lacks Top pointer indicator.`,
            severity: SHARED_VERIFICATION_SEVERITY.WARNING,
            validator: "VKVE",
            sceneId: scene.id,
          });
        } else if (topPointer.properties?.targetSlot !== "TOP") {
          errors.push({
            code: "INVALID_POINTER_TARGET",
            message: `Top pointer in scene "${scene.id}" points to "${topPointer.properties?.targetSlot}" instead of "TOP".`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
            sceneId: scene.id,
            objectId: topPointer.id,
            expected: "TOP",
            actual: String(topPointer.properties?.targetSlot),
          });
        }
      }

      // Semantic check for POP
      if (intent.operation === "POP") {
        if (intent.targetSlot !== "TOP") {
          errors.push({
            code: "INVALID_OPERATION_TARGET",
            message: `Pop operation in scene "${scene.id}" targeted "${intent.targetSlot}" instead of "TOP".`,
            severity: SHARED_VERIFICATION_SEVERITY.ERROR,
            validator: "VKVE",
            sceneId: scene.id,
            expected: "TOP",
            actual: intent.targetSlot,
            suggestedCorrection: "Ensure Pop removes from the top slot.",
          });
        }

        // Find the popped element
        const poppedElem = scene.objects.find(
          (o) => o.properties?.isRemoved === true || o.name.includes("Popped")
        );

        if (poppedElem) {
          const correspondingTransition = trace.transitions[sIndex - 1];
          if (correspondingTransition) {
            const prevTop = correspondingTransition.previousState.pointers.top;
            const poppedSlot = poppedElem.properties?.slotIndex;

            // Semantic check: Did Pop remove the TOP element or the wrong (e.g. BOTTOM) element?
            if (prevTop !== null && poppedSlot !== prevTop) {
              errors.push({
                code: "INVALID_OPERATION_TARGET",
                message: `Pop in scene "${scene.id}" removed element at slot ${poppedSlot}, but the top element was at slot ${prevTop}. LIFO violation!`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: poppedElem.id,
                expected: `Removal from top slot (${prevTop})`,
                actual: `Removal from slot (${poppedSlot})`,
                suggestedCorrection: "Only the uppermost element at index top may be removed during Pop.",
              });
            }
          }

          // Upward motion check: Popped element MUST exit upward through the top aperture (toY > fromY)
          const translateAnim = scene.animations.find(
            (a) => a.objectId === poppedElem.id && a.type === "TRANSLATE"
          );

          if (translateAnim && translateAnim.from && translateAnim.to) {
            const fromY = (translateAnim.from as { y: number }).y;
            const toY = (translateAnim.to as { y: number }).y;

            if (toY <= fromY) {
              errors.push({
                code: "REVERSED_MOTION_DIRECTION",
                message: `Pop motion in scene "${scene.id}" is inverted! Element moved downward from Y=${fromY} to Y=${toY}, rather than exiting upward out of top aperture.`,
                severity: SHARED_VERIFICATION_SEVERITY.ERROR,
                validator: "VKVE",
                sceneId: scene.id,
                objectId: poppedElem.id,
                animationId: translateAnim.id,
                expected: `Upward exit through top aperture (to.y > from.y)`,
                actual: `to.y=${toY} <= from.y=${fromY}`,
                suggestedCorrection: "Translate popped element upward out of container.",
              });
            }
          }
        }
      }

      // Check object state count matches expected state
      if (intent.expectedStateSnapshot) {
        const expectedCount = intent.expectedStateSnapshot.elements.length;
        // count active elements (not marked as removed)
        const activeElements = scene.objects.filter(
          (o) => o.type === "BOX" && !o.properties?.isRemoved
        );

        if (activeElements.length !== expectedCount) {
          warnings.push({
            code: "OBJECT_COUNT_MISMATCH",
            message: `Scene "${scene.id}" has ${activeElements.length} active boxes, expected ${expectedCount}.`,
            severity: SHARED_VERIFICATION_SEVERITY.WARNING,
            validator: "VKVE",
            sceneId: scene.id,
            expected: `${expectedCount} boxes`,
            actual: `${activeElements.length} boxes`,
          });
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

export const stackVkveValidator = new StackVkveValidator();

