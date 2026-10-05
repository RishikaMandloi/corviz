import {
  ANIMATION_TYPES,
  SCENE_STATUS,
  VERIFICATION_STATUS,
  VIDEO_OBJECT_TYPES,
  VIDEO_STATUS,
} from "./video.constants";

export type VideoStatus =
  (typeof VIDEO_STATUS)[keyof typeof VIDEO_STATUS];

export type SceneStatus =
  (typeof SCENE_STATUS)[keyof typeof SCENE_STATUS];

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export type VideoObjectType =
  (typeof VIDEO_OBJECT_TYPES)[keyof typeof VIDEO_OBJECT_TYPES];

export type AnimationType =
  (typeof ANIMATION_TYPES)[keyof typeof ANIMATION_TYPES];

export interface ISceneObject {
  id: string;
  type: VideoObjectType;
  name: string;

  position?: {
    x: number;
    y: number;
    z: number;
  };

  rotation?: {
    x: number;
    y: number;
    z: number;
  };

  scale?: {
    x: number;
    y: number;
    z: number;
  };

  properties?: Record<
    string,
    unknown
  >;
}

export interface ISceneAnimation {
  id: string;
  objectId: string;
  type: AnimationType;

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
  position: {
    x: number;
    y: number;
    z: number;
  };

  target: {
    x: number;
    y: number;
    z: number;
  };

  fov: number;
}

export interface ISceneNarration {
  text: string;
  startTime: number;
  duration?: number;
  voice?: string;
}

export interface IScene {
  id: string;
  order: number;
  title: string;

  duration: number;

  status: SceneStatus;

  objects: ISceneObject[];

  animations: ISceneAnimation[];

  camera: ISceneCamera;

  narration?: ISceneNarration;

  verificationStatus: VerificationStatus;
}

export interface IVideo {
  title: string;

  concept: string;

  description?: string;

  status: VideoStatus;

  scenes: IScene[];

  totalDuration: number;

  verificationStatus: VerificationStatus;
}