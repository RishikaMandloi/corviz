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

export class StackSceneBuilder {
  private readonly SLOT_HEIGHT = 0.7;
  private readonly BASE_Y = -2.2;
  private readonly SPAWN_Y = 4.2;
  private readonly EXIT_Y = 4.8;
  private readonly CONTAINER_WIDTH = 2.8;
  private readonly CONTAINER_HEIGHT = 6.0;

  /**
   * Build complete Scene Plan and Scene Graph from a verified State Execution Trace.
   */
  build(trace: IStateExecutionTrace): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];

    // Scene 1: Initial Stack State
    const initPlanned: IPlannedScene = {
      id: "scene-stack-init",
      order: 1,
      title: "Initial Stack Setup",
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `Stack container initialized with elements [${trace.initialState.elements.join(", ")}]. Top is at index ${trace.initialState.pointers.top}.`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to Stack visual analysis. A stack follows the Last-In, First-Out rule. Notice the container is closed on three sides and open only at the top. Currently, there are ${trace.initialState.elements.length} elements in the stack, and the Top pointer designates the uppermost element.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(trace.initialState, initPlanned));

    // Subsequent Scenes: One scene per state transition
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const op = transition.operation;
      const sceneId = `scene-stack-step-${transition.stepIndex}`;

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
      topicId: "STACK",
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: "Stack (LIFO)",
      learningObjective: "Understand Stack Push/Pop operations, Top pointer tracking, and LIFO enforcement.",
      scenes: plannedScenes,
      totalDuration,
      sceneGraph,
    };

    return { plan, sceneGraph };
  }

  /**
   * Build initial scene showing resting elements and top pointer.
   */
  private buildInitialScene(
    state: { elements: unknown[]; pointers: Record<string, number | null | string> },
    planned: IPlannedScene
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];

    // Container
    objects.push({
      id: "stack_container",
      type: "CONTAINER",
      name: "Stack Chamber",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: this.CONTAINER_WIDTH, y: this.CONTAINER_HEIGHT, z: 1.4 },
      properties: {
        aperture: "TOP",
        openY: this.SPAWN_Y,
        capacity: 8,
      },
    });

    // Elements already in stack
    state.elements.forEach((val, idx) => {
      const yPos = this.BASE_Y + idx * this.SLOT_HEIGHT;
      const elemId = `elem_${idx}`;

      objects.push({
        id: elemId,
        type: "BOX",
        name: `Element ${val}`,
        position: { x: 0, y: yPos, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2.2, y: 0.6, z: 1.0 },
        properties: {
          value: val,
          slotIndex: idx,
          isTop: idx === (state.pointers.top as number),
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

    // Top pointer
    const topIdx = state.pointers.top as number | null;
    if (topIdx !== null && topIdx >= 0) {
      const topY = this.BASE_Y + topIdx * this.SLOT_HEIGHT;
      objects.push({
        id: "top_pointer",
        type: "POINTER",
        name: "Top Pointer",
        position: { x: 1.8, y: topY, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.0, y: 0.4, z: 0.4 },
        properties: {
          label: "TOP",
          targetIndex: topIdx,
          targetSlot: "TOP",
        },
      });

      animations.push({
        id: "anim_appear_top_pointer",
        objectId: "top_pointer",
        type: "APPEAR",
        startTime: 0.5,
        duration: 0.6,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    }

    const camera: ISceneCamera = {
      position: { x: 0, y: 0.5, z: 7.5 },
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
          { id: "m1", timestamp: 0.0, event: "CONTAINER_PRESENT" },
          { id: "m2", timestamp: 0.8, event: "ELEMENTS_VISIBLE" },
          { id: "m3", timestamp: 1.5, event: "TOP_POINTER_FOCUSED" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "TOP",
        expectedStateSnapshot: {
          elements: [...state.elements],
          pointers: { ...state.pointers },
          statusMessage: "Initial state",
        },
      },
      verificationStatus: "PENDING",
    };
  }

  /**
   * Build transition scene representing Push, Pop, or Peek with accurate motion.
   */
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
      id: "stack_container",
      type: "CONTAINER",
      name: "Stack Chamber",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: this.CONTAINER_WIDTH, y: this.CONTAINER_HEIGHT, z: 1.4 },
      properties: { aperture: "TOP", capacity: 8 },
    });

    if (opType === "PUSH") {
      const val = (op.payload?.value as number) ?? 99;
      const prevElements = transition.previousState.elements;
      const newTopIdx = transition.resultingState.pointers.top as number;
      const targetY = this.BASE_Y + newTopIdx * this.SLOT_HEIGHT;

      // Existing base elements
      prevElements.forEach((v, idx) => {
        const yPos = this.BASE_Y + idx * this.SLOT_HEIGHT;
        objects.push({
          id: `elem_${idx}`,
          type: "BOX",
          name: `Element ${v}`,
          position: { x: 0, y: yPos, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2.2, y: 0.6, z: 1.0 },
          properties: { value: v, slotIndex: idx },
        });
      });

      // New element entering from top aperture
      const newElemId = `elem_${newTopIdx}`;
      objects.push({
        id: newElemId,
        type: "BOX",
        name: `Pushed Element ${val}`,
        position: { x: 0, y: this.SPAWN_Y, z: 0 }, // spawns above container
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2.2, y: 0.6, z: 1.0 },
        properties: {
          value: val,
          slotIndex: newTopIdx,
          isTop: true,
        },
      });

      // Spawn appear
      animations.push({
        id: `anim_spawn_${newElemId}`,
        objectId: newElemId,
        type: "APPEAR",
        startTime: 0.2,
        duration: 0.4,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });

      // Translation downwards through the top aperture into its target slot
      animations.push({
        id: `anim_translate_${newElemId}`,
        objectId: newElemId,
        type: "TRANSLATE",
        startTime: 0.8,
        duration: 1.6,
        from: { x: 0, y: this.SPAWN_Y, z: 0 },
        to: { x: 0, y: targetY, z: 0 },
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      });

      // Top pointer moves to new top
      objects.push({
        id: "top_pointer",
        type: "POINTER",
        name: "Top Pointer",
        position: {
          x: 1.8,
          y: transition.previousState.pointers.top !== null
            ? this.BASE_Y + (transition.previousState.pointers.top as number) * this.SLOT_HEIGHT
            : this.BASE_Y - 0.5,
          z: 0,
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.0, y: 0.4, z: 0.4 },
        properties: { label: "TOP", targetIndex: newTopIdx, targetSlot: "TOP" },
      });

      animations.push({
        id: "anim_move_top_pointer",
        objectId: "top_pointer",
        type: "TRANSLATE",
        startTime: 1.8,
        duration: 0.8,
        from: {
          x: 1.8,
          y: transition.previousState.pointers.top !== null
            ? this.BASE_Y + (transition.previousState.pointers.top as number) * this.SLOT_HEIGHT
            : this.BASE_Y - 0.5,
          z: 0,
        },
        to: { x: 1.8, y: targetY, z: 0 },
      });
    } else if (opType === "POP") {
      const prevElements = transition.previousState.elements;
      const prevTopIdx = transition.previousState.pointers.top as number;
      const poppedVal = prevElements[prevTopIdx];
      const startY = this.BASE_Y + prevTopIdx * this.SLOT_HEIGHT;
      const poppedElemId = `elem_${prevTopIdx}`;

      // Remaining elements stay in place
      prevElements.slice(0, prevTopIdx).forEach((v, idx) => {
        const yPos = this.BASE_Y + idx * this.SLOT_HEIGHT;
        objects.push({
          id: `elem_${idx}`,
          type: "BOX",
          name: `Element ${v}`,
          position: { x: 0, y: yPos, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 2.2, y: 0.6, z: 1.0 },
          properties: { value: v, slotIndex: idx },
        });
      });

      // Popped element begins at top slot and translates upwards out of the aperture
      objects.push({
        id: poppedElemId,
        type: "BOX",
        name: `Popped Element ${poppedVal}`,
        position: { x: 0, y: startY, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2.2, y: 0.6, z: 1.0 },
        properties: { value: poppedVal, slotIndex: prevTopIdx, isRemoved: true },
      });

      // Highlight before removal
      animations.push({
        id: `anim_highlight_${poppedElemId}`,
        objectId: poppedElemId,
        type: "HIGHLIGHT",
        startTime: 0.2,
        duration: 0.6,
      });

      // Upward translation out of the container
      animations.push({
        id: `anim_translate_${poppedElemId}`,
        objectId: poppedElemId,
        type: "TRANSLATE",
        startTime: 0.9,
        duration: 1.6,
        from: { x: 0, y: startY, z: 0 },
        to: { x: 0, y: this.EXIT_Y, z: 0 }, // upwards exit
      });

      // Disappear after exiting
      animations.push({
        id: `anim_disappear_${poppedElemId}`,
        objectId: poppedElemId,
        type: "DISAPPEAR",
        startTime: 2.6,
        duration: 0.4,
        from: { opacity: 1 },
        to: { opacity: 0 },
      });

      // Top pointer updates to preceding element or hides
      const newTopIdx = transition.resultingState.pointers.top as number | null;
      if (newTopIdx !== null && newTopIdx >= 0) {
        const newTopY = this.BASE_Y + newTopIdx * this.SLOT_HEIGHT;
        objects.push({
          id: "top_pointer",
          type: "POINTER",
          name: "Top Pointer",
          position: { x: 1.8, y: startY, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1.0, y: 0.4, z: 0.4 },
          properties: { label: "TOP", targetIndex: newTopIdx, targetSlot: "TOP" },
        });

        animations.push({
          id: "anim_move_top_pointer",
          objectId: "top_pointer",
          type: "TRANSLATE",
          startTime: 2.2,
          duration: 0.8,
          from: { x: 1.8, y: startY, z: 0 },
          to: { x: 1.8, y: newTopY, z: 0 },
        });
      }
    }

    const camera: ISceneCamera = {
      position: { x: 0, y: 0.5, z: 7.2 },
      target: { x: 0, y: 0, z: 0 },
      fov: 46,
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
        targetSlot: "TOP",
        affectedValue: op.payload?.value,
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }
}

export const stackSceneBuilder = new StackSceneBuilder();

