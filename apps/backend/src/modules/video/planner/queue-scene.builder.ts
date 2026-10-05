import {
  ISceneAnimation,
  ISceneCamera,
  ISceneGraph,
  ISceneGraphScene,
  ISceneObject,
  IScenePlan,
  IStateExecutionTrace,
  IStateTransition,
  IPlannedScene,
} from "../../../shared/contracts";

export class QueueSceneBuilder {
  private readonly SLOT_WIDTH = 1.3;
  private readonly BASE_X = -2.4;
  private readonly Y_POS = 0;
  private readonly SPAWN_X = 4.5;
  private readonly EXIT_X = -4.5;

  build(trace: IStateExecutionTrace): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];

    // Scene 1: Initial Queue State
    const initPlanned: IPlannedScene = {
      id: "scene-queue-init",
      order: 1,
      title: "Initial Queue Setup",
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `Queue container initialized with elements [${trace.initialState.elements.join(", ")}]. Front at index ${trace.initialState.pointers.front}, Rear at index ${trace.initialState.pointers.rear}.`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to Queue visual analysis. A Queue enforces the First-In, First-Out (FIFO) discipline. Elements enter exclusively at the Rear and leave exclusively from the Front. Notice the horizontal chamber with separate entrance and exit apertures.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(trace.initialState, initPlanned));

    // Subsequent Scenes
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const op = transition.operation;
      const sceneId = `scene-queue-step-${transition.stepIndex}`;

      const planned: IPlannedScene = {
        id: sceneId,
        order,
        title: `Step ${transition.stepIndex}: ${op.type} Operation`,
        intent: "OPERATION",
        duration: 5.0,
        visualDescription: transition.explanation,
        cameraShot: "CLOSE_UP",
        transition: "CUT",
        narration: {
          text: transition.explanation,
        },
      };

      plannedScenes.push(planned);
      graphScenes.push(this.buildTransitionScene(transition, planned));
    });

    const totalDuration = plannedScenes.reduce((sum, s) => sum + s.duration, 0);

    const sceneGraph: ISceneGraph = {
      scenes: graphScenes,
      totalDuration,
      topicId: "QUEUE",
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: "Queue (FIFO)",
      learningObjective: "Understand FIFO ordering, Enqueue at Rear, Dequeue at Front, and pointer progression.",
      scenes: plannedScenes,
      totalDuration,
      sceneGraph,
    };

    return { plan, sceneGraph };
  }

  private buildInitialScene(
    state: { elements: unknown[]; pointers: Record<string, number | null | string> },
    planned: IPlannedScene
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];

    // Horizontal Container
    objects.push({
      id: "queue_container",
      type: "CONTAINER",
      name: "Queue Chamber",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 7.5, y: 1.8, z: 1.2 },
      properties: { aperture: "BOTH", direction: "HORIZONTAL", queue: [...state.elements], front: state.pointers.front, rear: state.pointers.rear },
    });

    state.elements.forEach((val, idx) => {
      const xPos = this.BASE_X + idx * this.SLOT_WIDTH;
      const elemId = `elem_${idx}`;

      objects.push({
        id: elemId,
        type: "BOX",
        name: `Element ${val}`,
        position: { x: xPos, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: {
          value: val,
          slotIndex: idx,
          isFront: idx === (state.pointers.front as number),
          isRear: idx === (state.pointers.rear as number),
        },
      });

      animations.push({
        id: `anim_appear_${elemId}`,
        objectId: elemId,
        type: "APPEAR",
        startTime: 0,
        duration: 0.8,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    });

    // Front Pointer
    const frontIdx = state.pointers.front as number | null;
    if (frontIdx !== null && frontIdx >= 0) {
      objects.push({
        id: "front_pointer",
        type: "POINTER",
        name: "Front Pointer",
        position: { x: this.BASE_X + frontIdx * this.SLOT_WIDTH, y: -1.4, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.8, z: 0.4 },
        properties: { label: "FRONT", targetIndex: frontIdx, targetSlot: "FRONT" },
      });
    }

    // Rear Pointer
    const rearIdx = state.pointers.rear as number | null;
    if (rearIdx !== null && rearIdx >= 0) {
      objects.push({
        id: "rear_pointer",
        type: "POINTER",
        name: "Rear Pointer",
        position: { x: this.BASE_X + rearIdx * this.SLOT_WIDTH, y: 1.4, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.8, z: 0.4 },
        properties: { label: "REAR", targetIndex: rearIdx, targetSlot: "REAR" },
      });
    }

    const camera: ISceneCamera = {
      position: { x: 0, y: 0, z: 7.5 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50,
    };

    return {
      id: planned.id,
      order: planned.order,
      title: planned.title,
      duration: planned.duration,
      status: "READY",
      objects,
      animations,
      camera,
      narration: {
        text: planned.narration.text,
        startTime: 0,
        duration: planned.duration,
        milestones: [
          { id: "m1", timestamp: 0.0, event: "CONTAINER_PRESENT" },
          { id: "m2", timestamp: 0.8, event: "ELEMENTS_VISIBLE" },
          { id: "m3", timestamp: 1.5, event: "POINTERS_ALIGNED" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "FRONT",
        expectedStateSnapshot: {
          elements: [...state.elements],
          pointers: { ...state.pointers },
          statusMessage: "Initial queue state",
        },
      },
      verificationStatus: "PENDING",
    };
  }

  private buildTransitionScene(
    transition: IStateTransition,
    planned: IPlannedScene
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];
    const op = transition.operation;
    const opType = op.type.toUpperCase();

    // Container
    objects.push({
      id: "queue_container",
      type: "CONTAINER",
      name: "Queue Chamber",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 7.5, y: 1.8, z: 1.2 },
      properties: { aperture: "BOTH", direction: "HORIZONTAL", queue: [...transition.resultingState.elements], front: transition.resultingState.pointers.front, rear: transition.resultingState.pointers.rear },
    });

    if (opType === "ENQUEUE") {
      const val = (op.payload?.value as number) ?? 40;
      const prevElements = transition.previousState.elements;
      const newRearIdx = transition.resultingState.pointers.rear as number;
      const targetX = this.BASE_X + newRearIdx * this.SLOT_WIDTH;

      // Existing elements
      prevElements.forEach((v, idx) => {
        const xPos = this.BASE_X + idx * this.SLOT_WIDTH;
        objects.push({
          id: `elem_${idx}`,
          type: "BOX",
          name: `Element ${v}`,
          position: { x: xPos, y: this.Y_POS, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1.1, y: 1.1, z: 1.0 },
          properties: { value: v, slotIndex: idx },
        });
      });

      // New element entering from REAR (right side)
      const newElemId = `elem_${newRearIdx}`;
      objects.push({
        id: newElemId,
        type: "BOX",
        name: `Enqueued Element ${val}`,
        position: { x: this.SPAWN_X, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { value: val, slotIndex: newRearIdx, isRear: true },
      });

      animations.push({
        id: `anim_spawn_${newElemId}`,
        objectId: newElemId,
        type: "APPEAR",
        startTime: 0.2,
        duration: 0.4,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });

      // Leftward translation from rear into target slot
      animations.push({
        id: `anim_translate_${newElemId}`,
        objectId: newElemId,
        type: "TRANSLATE",
        startTime: 0.8,
        duration: 1.6,
        from: { x: this.SPAWN_X, y: this.Y_POS, z: 0 },
        to: { x: targetX, y: this.Y_POS, z: 0 },
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      });

      // Rear pointer updates to new rear
      objects.push({
        id: "rear_pointer",
        type: "POINTER",
        name: "Rear Pointer",
        position: { x: targetX, y: 1.4, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.8, z: 0.4 },
        properties: { label: "REAR", targetIndex: newRearIdx, targetSlot: "REAR" },
      });

      // Front pointer stays at index 0
      objects.push({
        id: "front_pointer",
        type: "POINTER",
        name: "Front Pointer",
        position: { x: this.BASE_X, y: -1.4, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.8, z: 0.4 },
        properties: { label: "FRONT", targetIndex: 0, targetSlot: "FRONT" },
      });
    } else if (opType === "DEQUEUE") {
      const prevElements = transition.previousState.elements;
      const dequeuedVal = prevElements[0];
      const dequeuedElemId = "elem_0";

      // Dequeued element begins at front slot and translates leftward out of aperture
      objects.push({
        id: dequeuedElemId,
        type: "BOX",
        name: `Dequeued Element ${dequeuedVal}`,
        position: { x: this.BASE_X, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { value: dequeuedVal, slotIndex: 0, isRemoved: true },
      });

      animations.push({
        id: `anim_highlight_${dequeuedElemId}`,
        objectId: dequeuedElemId,
        type: "HIGHLIGHT",
        startTime: 0.2,
        duration: 0.6,
      });

      // Leftward translation exiting through Front aperture
      animations.push({
        id: `anim_translate_${dequeuedElemId}`,
        objectId: dequeuedElemId,
        type: "TRANSLATE",
        startTime: 0.9,
        duration: 1.6,
        from: { x: this.BASE_X, y: this.Y_POS, z: 0 },
        to: { x: this.EXIT_X, y: this.Y_POS, z: 0 },
      });

      animations.push({
        id: `anim_disappear_${dequeuedElemId}`,
        objectId: dequeuedElemId,
        type: "DISAPPEAR",
        startTime: 2.6,
        duration: 0.4,
        from: { opacity: 1 },
        to: { opacity: 0 },
      });

      // Remaining elements shift left into new positions
      prevElements.slice(1).forEach((v, idx) => {
        const oldX = this.BASE_X + (idx + 1) * this.SLOT_WIDTH;
        const newX = this.BASE_X + idx * this.SLOT_WIDTH;
        const elemId = `elem_${idx + 1}`;

        objects.push({
          id: elemId,
          type: "BOX",
          name: `Element ${v}`,
          position: { x: oldX, y: this.Y_POS, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1.1, y: 1.1, z: 1.0 },
          properties: { value: v, slotIndex: idx },
        });

        animations.push({
          id: `anim_shift_${elemId}`,
          objectId: elemId,
          type: "TRANSLATE",
          startTime: 1.8,
          duration: 0.8,
          from: { x: oldX, y: this.Y_POS, z: 0 },
          to: { x: newX, y: this.Y_POS, z: 0 },
        });
      });

      // Front and rear pointers
      if (prevElements.length > 1) {
        objects.push({
          id: "front_pointer",
          type: "POINTER",
          name: "Front Pointer",
          position: { x: this.BASE_X, y: -1.4, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.8, z: 0.4 },
          properties: { label: "FRONT", targetIndex: 0, targetSlot: "FRONT" },
        });
      }
    }

    const camera: ISceneCamera = {
      position: { x: 0, y: 0, z: 7.2 },
      target: { x: 0, y: 0, z: 0 },
      fov: 48,
    };

    return {
      id: planned.id,
      order: planned.order,
      title: planned.title,
      duration: planned.duration,
      status: "READY",
      objects,
      animations,
      camera,
      narration: {
        text: planned.narration.text,
        startTime: 0,
        duration: planned.duration,
        milestones: [
          { id: "m1", timestamp: 0.2, event: `${opType}_PREPARE` },
          { id: "m2", timestamp: 1.0, event: `${opType}_IN_MOTION` },
          { id: "m3", timestamp: 2.5, event: `${opType}_STATE_SETTLED` },
        ],
      },
      semanticIntent: {
        operation: opType,
        targetSlot: opType === "ENQUEUE" ? "REAR" : "FRONT",
        affectedValue: op.payload?.value,
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }
}

export const queueSceneBuilder = new QueueSceneBuilder();
