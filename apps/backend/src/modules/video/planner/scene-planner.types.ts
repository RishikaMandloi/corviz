import {
  CAMERA_SHOT,
  SCENE_INTENT,
  TRANSITION_TYPE,
} from "./scene-planner.constants";

export type SceneIntent =
  (typeof SCENE_INTENT)[keyof typeof SCENE_INTENT];

export type CameraShot =
  (typeof CAMERA_SHOT)[keyof typeof CAMERA_SHOT];

export type TransitionType =
  (typeof TRANSITION_TYPE)[keyof typeof TRANSITION_TYPE];

export interface IScenePlannerInput {
  concept: string;

  learningObjective?: string;

  audienceLevel?:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED";

  language?: string;

  estimatedDuration?: number;
}

export interface IPlannedScene {
  id: string;

  order: number;

  title: string;

  intent: SceneIntent;

  duration: number;

  visualDescription: string;

  cameraShot: CameraShot;

  transition:
    TransitionType;

  narration: {
    text: string;
  };
}

export interface IScenePlan {
  version: string;

  concept: string;

  learningObjective?: string;

  scenes: IPlannedScene[];

  totalDuration: number;
  sceneGraph?: ISceneGraph;
}

export interface ISceneVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ISceneObject {
  id: string;

  type: string;

  name: string;

  position: ISceneVector3;

  rotation: ISceneVector3;

  scale: ISceneVector3;

  properties?: Record<
    string,
    unknown
  >;
}

export interface ISceneAnimation {
  id: string;

  objectId: string;

  type: string;

  startTime: number;

  duration: number;

  from?: Record<
    string,
    unknown
  >;

  to?: Record<
    string,
    unknown
  >;
}

export interface ISceneCamera {
  position: ISceneVector3;

  target: ISceneVector3;

  fov: number;
}

export interface ISceneNarration {
  text: string;

  startTime: number;

  duration?: number;
}

export interface ISceneGraphScene {
  id: string;

  order: number;

  title: string;

  duration: number;

  status: string;

  objects: ISceneObject[];

  animations: ISceneAnimation[];

  camera: ISceneCamera;

  narration?: ISceneNarration;

  verificationStatus: string;
}

export interface ISceneGraph {
  scenes: ISceneGraphScene[];
}