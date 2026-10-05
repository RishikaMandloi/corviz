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
  SupportedTopicId,
} from "../../../shared/contracts";

export class ArrayAlgorithmSceneBuilder {
  private readonly CELL_WIDTH = 1.3;
  private readonly Y_POS = 0;

  build(
    topicId: SupportedTopicId,
    trace: IStateExecutionTrace
  ): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];
    const n = trace.initialState.elements.length;
    const startX = -((n - 1) * this.CELL_WIDTH) / 2;

    // Scene 1: Initial Setup
    const initPlanned: IPlannedScene = {
      id: `scene-${topicId.toLowerCase()}-init`,
      order: 1,
      title: `Initial ${topicId} Setup`,
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `Array initialized with [${trace.initialState.elements.join(", ")}].`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to the verified visual analysis for ${topicId.replace(/_/g, " ")}. Here is the initial array state with ${n} elements. Observe the index positions and active control pointers.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(topicId, trace.initialState, initPlanned, startX));

    // Transition Scenes
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const op = transition.operation;
      const sceneId = `scene-${topicId.toLowerCase()}-step-${transition.stepIndex}`;

      const planned: IPlannedScene = {
        id: sceneId,
        order,
        title: `Step ${transition.stepIndex}: ${op.type}`,
        intent: "OPERATION",
        duration: 4.5,
        visualDescription: transition.explanation,
        cameraShot: "CLOSE_UP",
        transition: "CUT",
        narration: {
          text: transition.explanation,
        },
      };

      plannedScenes.push(planned);
      graphScenes.push(this.buildTransitionScene(topicId, transition, planned, startX));
    });

    const totalDuration = plannedScenes.reduce((sum, s) => sum + s.duration, 0);

    const sceneGraph: ISceneGraph = {
      scenes: graphScenes,
      totalDuration,
      topicId,
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: topicId.replace(/_/g, " "),
      learningObjective: `Master ${topicId.replace(/_/g, " ")} mechanics through verified step-by-step visual transitions.`,
      scenes: plannedScenes,
      totalDuration,
      sceneGraph,
    };

    return { plan, sceneGraph };
  }

  private buildInitialScene(
    topicId: SupportedTopicId,
    state: { elements: unknown[]; pointers: Record<string, number | null | string> },
    planned: IPlannedScene,
    startX: number
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];

    // Array Container Bar
    objects.push({
      id: "array_container",
      type: "CONTAINER",
      name: "Array Memory Strip",
      position: { x: 0, y: this.Y_POS, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: Math.max(7.0, state.elements.length * this.CELL_WIDTH + 1), y: 1.6, z: 1.2 },
      properties: { length: state.elements.length },
    });

    state.elements.forEach((val, idx) => {
      const xPos = startX + idx * this.CELL_WIDTH;
      const elemId = `elem_${idx}`;

      objects.push({
        id: elemId,
        type: "BOX",
        name: `Cell [${idx}] = ${val}`,
        position: { x: xPos, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { value: val, index: idx },
      });

      animations.push({
        id: `anim_appear_${elemId}`,
        objectId: elemId,
        type: "APPEAR",
        startTime: 0,
        duration: 0.6,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    });

    // Topic-specific initial pointers
    this.addTopicPointers(topicId, state.pointers, objects, startX);

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
          { id: "m1", timestamp: 0.0, event: "ARRAY_VISIBLE" },
          { id: "m2", timestamp: 1.0, event: "POINTERS_READY" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "ARRAY",
        expectedStateSnapshot: {
          elements: [...state.elements],
          pointers: { ...state.pointers },
          statusMessage: "Initial state",
        },
      },
      verificationStatus: "PENDING",
    };
  }

  private buildTransitionScene(
    topicId: SupportedTopicId,
    transition: IStateTransition,
    planned: IPlannedScene,
    startX: number
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];
    const elements = transition.resultingState.elements;

    // Array Container Bar
    objects.push({
      id: "array_container",
      type: "CONTAINER",
      name: "Array Memory Strip",
      position: { x: 0, y: this.Y_POS, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: Math.max(7.0, elements.length * this.CELL_WIDTH + 1), y: 1.6, z: 1.2 },
      properties: { length: elements.length },
    });

    elements.forEach((val, idx) => {
      const xPos = startX + idx * this.CELL_WIDTH;
      const elemId = `elem_${idx}`;

      objects.push({
        id: elemId,
        type: "BOX",
        name: `Cell [${idx}] = ${val}`,
        position: { x: xPos, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { value: val, index: idx },
      });
    });

    // Pointers
    this.addTopicPointers(topicId, transition.resultingState.pointers, objects, startX);

    // Dynamic Animations based on transition
    if (transition.affectedElementIds.length > 0) {
      // A no-op swap (selection minimum already at the boundary) legitimately
      // references the same element twice. Scene animation IDs must remain unique.
      Array.from(new Set(transition.affectedElementIds)).forEach((id) => {
        animations.push({
          id: `anim_highlight_${id}`,
          objectId: id,
          type: "HIGHLIGHT",
          startTime: 0.3,
          duration: 0.8,
        });
      });
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
          { id: "m1", timestamp: 0.2, event: "ACTION_START" },
          { id: "m2", timestamp: 1.5, event: "STATE_SETTLED" },
        ],
      },
      semanticIntent: {
        operation: transition.operation.type,
        targetSlot: "ARRAY",
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }

  private addTopicPointers(
    topicId: SupportedTopicId,
    pointers: Record<string, number | null | string>,
    objects: ISceneObject[],
    startX: number
  ): void {
    if (topicId === "BINARY_SEARCH") {
      const low = pointers.low as number | null;
      const mid = pointers.mid as number | null;
      const high = pointers.high as number | null;

      if (low !== null && low >= 0) {
        objects.push({
          id: "low_pointer",
          type: "POINTER",
          name: "Low Pointer",
          position: { x: startX + low * this.CELL_WIDTH, y: -1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "LOW", targetIndex: low, targetSlot: "LOW" },
        });
      }

      if (high !== null && high >= 0) {
        objects.push({
          id: "high_pointer",
          type: "POINTER",
          name: "High Pointer",
          position: { x: startX + high * this.CELL_WIDTH, y: -1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "HIGH", targetIndex: high, targetSlot: "HIGH" },
        });
      }

      if (mid !== null && mid >= 0) {
        objects.push({
          id: "mid_pointer",
          type: "POINTER",
          name: "Mid Pointer",
          position: { x: startX + mid * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "MID", targetIndex: mid, targetSlot: "MID" },
        });
      }
    } else if (topicId === "LINEAR_SEARCH") {
      const idx = pointers.currentIndex as number | null;
      if (idx !== null && idx >= 0) {
        objects.push({
          id: "current_pointer",
          type: "POINTER",
          name: "Search Index",
          position: { x: startX + idx * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "i", targetIndex: idx, targetSlot: "CURRENT_INDEX" },
        });
      }
    } else if (topicId === "BUBBLE_SORT") {
      const j = pointers.j as number | null;
      if (j !== null && j >= 0) {
        objects.push({
          id: "j_pointer",
          type: "POINTER",
          name: "Pair Left",
          position: { x: startX + j * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "j", targetIndex: j, targetSlot: "ADJACENT" },
        });
        objects.push({
          id: "j1_pointer",
          type: "POINTER",
          name: "Pair Right",
          position: { x: startX + (j + 1) * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "j+1", targetIndex: j + 1, targetSlot: "ADJACENT" },
        });
      }
    } else if (topicId === "SELECTION_SORT") {
      const boundary = pointers.sortedBoundary as number | null;
      const minIdx = pointers.minIdx as number | null;

      if (boundary !== null && boundary >= 0) {
        objects.push({
          id: "boundary_pointer",
          type: "POINTER",
          name: "Sorted Boundary",
          position: { x: startX + boundary * this.CELL_WIDTH, y: -1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "BOUNDARY", targetIndex: boundary, targetSlot: "PARTITION_BOUNDARY" },
        });
      }

      if (minIdx !== null && minIdx >= 0) {
        objects.push({
          id: "min_pointer",
          type: "POINTER",
          name: "Min Pointer",
          position: { x: startX + minIdx * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "MIN", targetIndex: minIdx, targetSlot: "PARTITION_BOUNDARY" },
        });
      }
    } else if (topicId === "TWO_POINTERS") {
      const left = pointers.left as number | null;
      const right = pointers.right as number | null;

      if (left !== null && left >= 0) {
        objects.push({
          id: "left_pointer",
          type: "POINTER",
          name: "Left Pointer",
          position: { x: startX + left * this.CELL_WIDTH, y: -1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "LEFT", targetIndex: left, targetSlot: "POINTER_PAIR" },
        });
      }

      if (right !== null && right >= 0) {
        objects.push({
          id: "right_pointer",
          type: "POINTER",
          name: "Right Pointer",
          position: { x: startX + right * this.CELL_WIDTH, y: 1.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.5, y: 0.6, z: 0.4 },
          properties: { label: "RIGHT", targetIndex: right, targetSlot: "POINTER_PAIR" },
        });
      }
    }
  }
}

export const arrayAlgorithmSceneBuilder = new ArrayAlgorithmSceneBuilder();
