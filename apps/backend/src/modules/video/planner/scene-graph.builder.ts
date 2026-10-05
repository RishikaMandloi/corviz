import { Types } from "mongoose";

import {
  IPlannedScene,
  IScenePlan,
  ISceneGraph,
   ISceneGraphScene,
} from "./scene-planner.types";

import {
  ANIMATION_TYPES,
  SCENE_STATUS,
  VERIFICATION_STATUS,
  VIDEO_OBJECT_TYPES,
} from "../video.constants";



class SceneGraphBuilder {
  /**
   * Convert planner output into
   * renderer-compatible scene graph.
   */
 build(
  plan: IScenePlan
): ISceneGraph {
  if (!plan.scenes.length) {
    throw new Error(
      "Scene plan must contain at least one scene."
    );
  }

  return {
    scenes: plan.scenes.map(
      (scene) =>
        this.buildScene(scene)
    ),
  };
}

  /**
   * Build individual scene.
   */
  private buildScene(
    scene: IPlannedScene
  ):ISceneGraphScene {
    if (scene.duration <= 0) {
      throw new Error(
        `Scene "${scene.id}" must have a valid duration.`
      );
    }

    const sceneObjectId =
      new Types.ObjectId().toString();

    return {
      id: scene.id,

      order: scene.order,

      title: scene.title,

      duration: scene.duration,

      status:
        SCENE_STATUS.DRAFT,

      objects: [
        {
          id: sceneObjectId,

          type:
            VIDEO_OBJECT_TYPES.TEXT,

          name:
            "Educational Concept",

          position: {
            x: 0,
            y: 0,
            z: 0,
          },

          rotation: {
            x: 0,
            y: 0,
            z: 0,
          },

          scale: {
            x: 1,
            y: 1,
            z: 1,
          },

          properties: {
            text:
              scene.visualDescription,
          },
        },
      ],

      animations: [
        {
          id:
            new Types.ObjectId().toString(),

          objectId:
            sceneObjectId,

          type:
            ANIMATION_TYPES.APPEAR,

          startTime: 0,

          duration:
            Math.min(
              1,
              scene.duration
            ),

          from: {
            opacity: 0,
          },

          to: {
            opacity: 1,
          },
        },
      ],

      camera: {
        position: {
          x: 0,
          y: 2,
          z: 8,
        },

        target: {
          x: 0,
          y: 0,
          z: 0,
        },

        fov: 45,
      },

      narration: {
        text:
          scene.narration.text,

        startTime: 0,

        duration:
          scene.duration,
      },

      verificationStatus:
        VERIFICATION_STATUS.PENDING,
    };
  }
}

export const sceneGraphBuilder =
  new SceneGraphBuilder();