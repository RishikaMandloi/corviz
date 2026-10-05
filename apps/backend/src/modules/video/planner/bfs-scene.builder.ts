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

export class BfsSceneBuilder {
  private readonly GRAPH_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
    A: { x: 0, y: 2.0, z: 0 },
    B: { x: -2.2, y: 0.6, z: 0 },
    C: { x: 2.2, y: 0.6, z: 0 },
    D: { x: -2.2, y: -0.8, z: 0 },
    E: { x: 2.2, y: -0.8, z: 0 },
  };

  private addGraphEdges(state: IStateExecutionTrace["initialState"], objects: ISceneObject[]): void {
    const graph = state.metadata?.graph as Record<string, string[]> | undefined;
    const current = String(state.pointers.current ?? "");
    const newlyEnqueued = state.metadata?.newlyEnqueued as string[] | undefined;
    Object.entries(graph ?? {}).forEach(([from, neighbors]) => {
      neighbors.forEach((to) => {
        const fromPosition = this.GRAPH_POSITIONS[from] ?? { x: 0, y: 0, z: 0 };
        const toPosition = this.GRAPH_POSITIONS[to] ?? { x: 0, y: 0, z: 0 };
        const dx = toPosition.x - fromPosition.x;
        const dy = toPosition.y - fromPosition.y;
        const length = Math.hypot(dx, dy);
        objects.push({
          id: `edge_${from}_${to}`,
          type: "EDGE",
          name: `${from} to ${to}`,
          position: { x: (fromPosition.x + toPosition.x) / 2, y: (fromPosition.y + toPosition.y) / 2, z: -0.1 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: length, y: 0.04, z: 0.02 },
          properties: {
            from,
            to,
            angle: Math.atan2(-dy, dx) * 180 / Math.PI,
            isNewlyDiscovered: current === from && newlyEnqueued?.includes(to) === true,
          },
        });
      });
    });
  }

  build(trace: IStateExecutionTrace): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    const plannedScenes: IPlannedScene[] = [];
    const graphScenes: ISceneGraphScene[] = [];

    // Scene 1: Initial BFS Setup
    const initPlanned: IPlannedScene = {
      id: "scene-bfs-init",
      order: 1,
      title: "Initial BFS Graph & Queue Setup",
      intent: "INTRODUCTION",
      duration: 4.0,
      visualDescription: `Graph vertices [${trace.initialState.elements.join(", ")}] initialized. Start vertex ${String(trace.initialState.metadata?.startVertex ?? "A")} is enqueued in auxiliary FIFO Queue.`,
      cameraShot: "MEDIUM",
      transition: "FADE",
      narration: {
        text: `Welcome to Breadth-First Search visual analysis. BFS explores vertices layer by layer using an auxiliary FIFO Queue. Vertex ${String(trace.initialState.metadata?.startVertex ?? "A")} begins enqueued, ready to discover its immediate neighbors.`,
      },
    };
    plannedScenes.push(initPlanned);
    graphScenes.push(this.buildInitialScene(trace.initialState, initPlanned));

    // Transition Scenes
    trace.transitions.forEach((transition, idx) => {
      const order = idx + 2;
      const sceneId = `scene-bfs-step-${transition.stepIndex}`;

      const planned: IPlannedScene = {
        id: sceneId,
        order,
        title: `Step ${transition.stepIndex}: Dequeue & Expand Neighborhood`,
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
      topicId: "BFS",
    };

    const plan: IScenePlan = {
      version: "1.0.0",
      concept: "Breadth-First Search (BFS)",
      learningObjective: "Understand level-order exploration, FIFO Queue tracking, and visited set maintenance.",
      scenes: plannedScenes,
      totalDuration,
      sceneGraph,
    };

    return { plan, sceneGraph };
  }

  private buildInitialScene(
    state: { elements: unknown[]; pointers: Record<string, number | null | string>; metadata?: Record<string, unknown> },
    planned: IPlannedScene
  ): ISceneGraphScene {
    const objects: ISceneObject[] = [];
    const animations: ISceneAnimation[] = [];
    this.addGraphEdges(state as IStateExecutionTrace["initialState"], objects);

    // Graph Vertices
    const visitedVertices = (state.metadata?.visited as string[]) ?? [];
    (state.elements as string[]).forEach((vertex) => {
      const pos = this.GRAPH_POSITIONS[vertex] || { x: 0, y: 0, z: 0 };
      const objId = `node_${vertex}`;

      objects.push({
        id: objId,
        type: "NODE",
        name: `Vertex ${vertex}`,
        position: pos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { label: vertex, isStart: vertex === state.metadata?.startVertex, isVisited: visitedVertices.includes(vertex), isCurrent: vertex === String(state.pointers.current) },
      });

      animations.push({
        id: `anim_appear_${objId}`,
        objectId: objId,
        type: "APPEAR",
        startTime: 0,
        duration: 0.6,
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    });

    // Queue Chamber at bottom
    objects.push({
      id: "bfs_queue_container",
      type: "CONTAINER",
      name: "FIFO Traversal Queue",
      position: { x: 0, y: -2.3, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 6.0, y: 1.2, z: 1.0 },
      properties: { label: "BFS QUEUE", aperture: "BOTH", queue: state.metadata?.queue ?? [], visited: state.metadata?.visited ?? [], traversalOrder: state.metadata?.traversalOrder ?? [], current: state.pointers.current },
    });

    // Current pointer
    const currentPosition = this.GRAPH_POSITIONS[String(state.pointers.current)] ?? { x: 0, y: 0, z: 0 };
    objects.push({
      id: "current_pointer",
      type: "POINTER",
      name: "Queue Front",
      position: { x: currentPosition.x, y: currentPosition.y + 0.9, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.7, z: 0.4 },
      properties: { label: "CURRENT", targetSlot: "QUEUE_FRONT", targetVertex: state.pointers.current },
    });

    const camera: ISceneCamera = {
      position: { x: 0, y: 0, z: 7.8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 52,
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
          { id: "m1", timestamp: 0.0, event: "GRAPH_VISIBLE" },
          { id: "m2", timestamp: 1.0, event: "QUEUE_INITIALIZED" },
        ],
      },
      semanticIntent: {
        operation: "INITIALIZE",
        targetSlot: "QUEUE_FRONT",
        expectedStateSnapshot: {
          elements: [...state.elements],
          pointers: { ...state.pointers },
          statusMessage: "Initial BFS state",
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
    this.addGraphEdges(transition.resultingState, objects);
    const elements = transition.resultingState.elements as string[];
    const visited = (transition.resultingState.metadata?.visited as string[]) || [];

    // Graph Vertices
    elements.forEach((vertex) => {
      const pos = this.GRAPH_POSITIONS[vertex] || { x: 0, y: 0, z: 0 };
      const objId = `node_${vertex}`;

      objects.push({
        id: objId,
        type: "NODE",
        name: `Vertex ${vertex}`,
        position: pos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.1, y: 1.1, z: 1.0 },
        properties: { label: vertex, isVisited: visited.includes(vertex), isCurrent: vertex === String(transition.resultingState.pointers.current) },
      });
    });

    // Queue Container
    objects.push({
      id: "bfs_queue_container",
      type: "CONTAINER",
      name: "FIFO Traversal Queue",
      position: { x: 0, y: -2.3, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 6.0, y: 1.2, z: 1.0 },
      properties: { label: "BFS QUEUE", aperture: "BOTH", queue: transition.resultingState.metadata?.queue ?? [], visited: transition.resultingState.metadata?.visited ?? [], traversalOrder: transition.resultingState.metadata?.traversalOrder ?? [], current: transition.resultingState.pointers.current, newlyEnqueued: transition.resultingState.metadata?.newlyEnqueued ?? [] },
    });

    const currentPosition = this.GRAPH_POSITIONS[String(transition.resultingState.pointers.current)] ?? { x: 0, y: 0, z: 0 };
    objects.push({
      id: "current_pointer",
      type: "POINTER",
      name: "Queue Front",
      position: { x: currentPosition.x, y: currentPosition.y + 0.9, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.7, z: 0.4 },
      properties: { label: "CURRENT", targetSlot: "QUEUE_FRONT", targetVertex: transition.resultingState.pointers.current },
    });

    // Highlight affected elements
    if (transition.affectedElementIds.length > 0) {
      transition.affectedElementIds.forEach((id) => {
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
      position: { x: 0, y: 0, z: 7.8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 52,
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
          { id: "m1", timestamp: 0.2, event: "DEQUEUE_VERTEX" },
          { id: "m2", timestamp: 1.5, event: "NEIGHBORS_ENQUEUED" },
        ],
      },
      semanticIntent: {
        operation: transition.operation.type,
        targetSlot: "QUEUE_FRONT",
        expectedStateSnapshot: transition.resultingState,
      },
      verificationStatus: "PENDING",
    };
  }
}

export const bfsSceneBuilder = new BfsSceneBuilder();
