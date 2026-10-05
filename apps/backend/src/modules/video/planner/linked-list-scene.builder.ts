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

export class LinkedListSceneBuilder {
  private readonly NODE_SPACING = 2.2;
  private readonly BASE_X = -2.6;
  private readonly Y_POS = 0;

  build(trace: IStateExecutionTrace): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];

    // Scene 1: Initial Setup
    const initPlanned: IPlannedScene = {
      id: "scene-linked_list-init",
      order: 1,
      title: "Initial Singly Linked List Setup",
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `Singly linked list with nodes [${trace.initialState.elements.join(" -> ")} -> null]. Head points to index 0.`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to Singly Linked List visual analysis. Unlike contiguous arrays, a linked list stores data in individual nodes, each holding a value and a next pointer referencing its successor. The Head pointer designates the entry point of the list.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(trace.initialState, initPlanned));

    // Transition Scenes
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const op = transition.operation;
      const sceneId = `scene-linked_list-step-${transition.stepIndex}`;

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
      topicId: "LINKED_LIST",
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: "Singly Linked List",
      learningObjective: "Understand node structure, dynamic pointer links, Head tracking, and O(1) Head insertion/deletion.",
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

    // Nodes
    state.elements.forEach((val, idx) => {
      const xPos = this.BASE_X + idx * this.NODE_SPACING;
      const nodeId = `node_${idx}`;

      objects.push({
        id: nodeId,
        type: "NODE",
        name: `Node ${val}`,
        position: { x: xPos, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.4, y: 1.0, z: 1.0 },
        properties: { value: val, index: idx, hasNext: idx < state.elements.length - 1, nextIndex: idx < state.elements.length - 1 ? idx + 1 : null },
      });

      animations.push({
        id: `anim_appear_${nodeId}`,
        objectId: nodeId,
        type: "APPEAR",
        startTime: 0,
        duration: 0.6,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    });

    // Head pointer
    if (state.pointers.head !== null && state.elements.length > 0) {
      objects.push({
        id: "head_pointer",
        type: "POINTER",
        name: "Head Pointer",
        position: { x: this.BASE_X, y: 1.3, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.6, y: 0.8, z: 0.4 },
        properties: { label: "HEAD", targetIndex: 0, targetSlot: "HEAD" },
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
          { id: "m1", timestamp: 0.0, event: "NODES_VISIBLE" },
          { id: "m2", timestamp: 1.0, event: "HEAD_FOCUSED" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "HEAD",
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
    transition: IStateTransition,
    planned: IPlannedScene
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];
    const elements = transition.resultingState.elements;
    const op = transition.operation;
    const opType = op.type.toUpperCase();

    elements.forEach((val, idx) => {
      const xPos = this.BASE_X + idx * this.NODE_SPACING;
      const nodeId = `node_${idx}`;

      objects.push({
        id: nodeId,
        type: "NODE",
        name: `Node ${val}`,
        position: { x: xPos, y: this.Y_POS, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.4, y: 1.0, z: 1.0 },
        properties: { value: val, index: idx, hasNext: idx < elements.length - 1, nextIndex: idx < elements.length - 1 ? idx + 1 : null },
      });
    });

    if (opType === "INSERT_HEAD") {
      animations.push({
        id: "anim_spawn_new_node",
        objectId: "node_0",
        type: "APPEAR",
        startTime: 0.2,
        duration: 0.6,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    }

    // Head pointer
    if (elements.length > 0) {
      objects.push({
        id: "head_pointer",
        type: "POINTER",
        name: "Head Pointer",
        position: { x: this.BASE_X, y: 1.3, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.6, y: 0.8, z: 0.4 },
        properties: { label: "HEAD", targetIndex: 0, targetSlot: "HEAD" },
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
          { id: "m1", timestamp: 0.2, event: `${opType}_START` },
          { id: "m2", timestamp: 1.5, event: "HEAD_REPOINTED" },
        ],
      },
      semanticIntent: {
        operation: opType,
        targetSlot: "HEAD",
        affectedValue: op.payload?.value,
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }
}

export const linkedListSceneBuilder = new LinkedListSceneBuilder();
