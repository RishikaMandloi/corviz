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

export class BstSceneBuilder {
  private relations(elements: unknown[]): Array<{ parentIndex: number | null; leftIndex: number | null; rightIndex: number | null }> {
    const result: Array<{ parentIndex: number | null; leftIndex: number | null; rightIndex: number | null }> = elements.map(() => ({ parentIndex: null, leftIndex: null, rightIndex: null }));
    for (let index = 1; index < elements.length; index++) {
      const value = Number(elements[index]); let parent = 0;
      while (true) { const branch = value < Number(elements[parent]) ? "leftIndex" : "rightIndex"; const child = result[parent][branch]; if (child === null) { result[parent][branch] = index; result[index].parentIndex = parent; break; } parent = child; }
    }
    return result;
  }

  private layout(elements: unknown[]): Array<{ x: number; y: number; z: number }> {
    const relations = this.relations(elements);
    const inOrder: number[] = [];
    const visit = (index: number | null) => {
      if (index === null) return;
      visit(relations[index].leftIndex);
      inOrder.push(index);
      visit(relations[index].rightIndex);
    };
    if (elements.length > 0) visit(0);
    const rank = new Map(inOrder.map((index, position) => [index, position]));
    const positions = elements.map(() => ({ x: 0, y: 0, z: 0 }));
    const depth = (index: number): number => {
      const parent = relations[index].parentIndex;
      return parent === null ? 0 : depth(parent) + 1;
    };
    elements.forEach((_value, index) => {
      positions[index] = {
        x: ((rank.get(index) ?? index) - (elements.length - 1) / 2) * 1.05,
        y: 1.9 - depth(index) * 1.15,
        z: 0,
      };
    });
    return positions;
  }

  build(trace: IStateExecutionTrace): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];

    // Scene 1: Initial BST State
    const initPlanned: IPlannedScene = {
      id: "scene-bst-init",
      order: 1,
      title: "Initial Binary Search Tree",
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `BST initialized with root ${trace.initialState.elements[0]}, left child ${trace.initialState.elements[1]}, right child ${trace.initialState.elements[2]}.`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to Binary Search Tree visual analysis. A BST is a hierarchical structure enforcing that for any node, all keys in the left subtree are strictly smaller, and all keys in the right subtree are strictly greater. Notice the Root pointer at the tree summit.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(trace.initialState, initPlanned));

    // Transition Scenes
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const op = transition.operation;
      const sceneId = `scene-bst-step-${transition.stepIndex}`;

      const planned: IPlannedScene = {
        id: sceneId,
        order,
        title: `Step ${transition.stepIndex}: ${op.type}`,
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
      topicId: "BST",
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: "Binary Search Tree",
      learningObjective: "Understand hierarchical BST ordering (left < node < right), recursive search, and leaf insertion.",
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

    const relations = this.relations(state.elements);
    const positions = this.layout(state.elements);
    const traversalPath = (state as { metadata?: Record<string, unknown> }).metadata?.traversalPath as number[] | undefined;
    state.elements.forEach((val, idx) => {
      const pos = positions[idx];
      const nodeId = `node_${idx}`;

      objects.push({
        id: nodeId,
        type: "NODE",
        name: `BST Node ${val}`,
        position: pos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1.2, z: 1.0 },
        properties: { value: val, index: idx, isRoot: idx === 0, isOnTraversalPath: traversalPath?.includes(idx) ?? false, ...relations[idx] },
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

    // Root pointer
    const rootPosition = positions[0] ?? { x: 0, y: 1.8, z: 0 };
    objects.push({
      id: "root_pointer",
      type: "POINTER",
      name: "Root Pointer",
      position: { x: rootPosition.x, y: rootPosition.y + 0.9, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.6, y: 0.8, z: 0.4 },
      properties: { label: "ROOT", targetIndex: 0, targetSlot: "ROOT" },
    });

    const camera: ISceneCamera = {
      position: { x: 0, y: 0.5, z: 7.8 },
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
          { id: "m1", timestamp: 0.0, event: "TREE_VISIBLE" },
          { id: "m2", timestamp: 1.0, event: "ROOT_FOCUSED" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "ROOT",
        expectedStateSnapshot: {
          elements: [...state.elements],
          pointers: { ...state.pointers },
          statusMessage: "Initial tree",
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

    const relations = this.relations(elements);
    const positions = this.layout(elements);
    const traversalPath = transition.resultingState.metadata?.traversalPath as number[] | undefined;
    elements.forEach((val, idx) => {
      const pos = positions[idx];
      const nodeId = `node_${idx}`;

      objects.push({
        id: nodeId,
        type: "NODE",
        name: `BST Node ${val}`,
        position: pos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1.2, z: 1.0 },
        properties: { value: val, index: idx, isRoot: idx === 0, isOnTraversalPath: traversalPath?.includes(idx) ?? false, ...relations[idx] },
      });
    });

    // Root pointer
    const rootPosition = positions[0] ?? { x: 0, y: 1.8, z: 0 };
    objects.push({
      id: "root_pointer",
      type: "POINTER",
      name: "Root Pointer",
      position: { x: rootPosition.x, y: rootPosition.y + 0.9, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.6, y: 0.8, z: 0.4 },
      properties: { label: "ROOT", targetIndex: 0, targetSlot: "ROOT" },
    });

    const pathObjectIds = (traversalPath ?? []).map((index) => `node_${index}`);
    const animatedObjectIds = Array.from(new Set([...pathObjectIds, ...transition.affectedElementIds]));
    if (animatedObjectIds.length > 0) {
      animatedObjectIds.forEach((id) => {
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
      position: { x: 0, y: 0.5, z: 7.5 },
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
          { id: "m1", timestamp: 0.2, event: "SEARCH_OR_INSERT_START" },
          { id: "m2", timestamp: 1.5, event: "TREE_INVARIANT_PRESERVED" },
        ],
      },
      semanticIntent: {
        operation: op.type,
        targetSlot: "TREE_BRANCH",
        affectedValue: op.payload?.value,
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }
}

export const bstSceneBuilder = new BstSceneBuilder();
