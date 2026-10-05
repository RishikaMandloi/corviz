import {
  ISceneGraph,
  ISceneGraphScene,
  ISceneObject,
} from "./scene-planner.types";

import {
  IVerificationIssue,
  IVerificationResult,
} from "../verification/verification.types";

import {
  VERIFICATION_ERROR_CODES,
  VERIFICATION_SEVERITY,
} from "../verification/verification.constants";

import {
  ValidationIssueError,
} from "../verification/validation-issue.error";


class SceneGraphValidator {
  /**
   * Validate complete scene graph.
   */
  validate(
    sceneGraph: ISceneGraph
  ): void {
    if (!sceneGraph) {
      throw new Error(
        "Scene graph is required."
      );
    }

    if (
      !Array.isArray(
        sceneGraph.scenes
      ) ||
      sceneGraph.scenes.length === 0
    ) {
      throw new Error(
        "Scene graph must contain at least one scene."
      );
    }

    this.validateSceneIds(
      sceneGraph.scenes
    );

    this.validateSceneOrder(
      sceneGraph.scenes
    );

    for (const scene of sceneGraph.scenes) {
      this.validateScene(
        scene
      );
    }
  }

  /**
   * Validate scene IDs.
   */
  private validateSceneIds(
    scenes: ISceneGraphScene[]
  ): void {
    const sceneIds =
      new Set<string>();

    for (const scene of scenes) {
      if (!scene.id?.trim()) {
        throw new Error(
          "Every scene must have an ID."
        );
      }

      if (
        sceneIds.has(scene.id)
      ) {
        throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .DUPLICATE_SCENE_ID,

  message:
    `Duplicate scene ID: ${scene.id}`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
          });
        }
    }
  }

  /**
   * Scene order must be sequential.
   */
  private validateSceneOrder(
    scenes: ISceneGraphScene[]
  ): void {
    const sortedScenes =
      [...scenes].sort(
        (a, b) =>
          a.order - b.order
      );

    sortedScenes.forEach(
      (scene, index) => {
        const expectedOrder =
          index + 1;

        if (
          scene.order !==
          expectedOrder
        ) {
          throw new Error(
            `Invalid scene order for "${scene.id}". Expected ${expectedOrder}.`
          );
        }
      }
    );
  }

  /**
   * Validate individual scene.
   */
  private validateScene(
    scene: ISceneGraphScene
  ): void {
    this.validateSceneDuration(
      scene
    );

    this.validateObjects(
      scene
    );

    this.validateAnimations(
      scene
    );

    this.validateCamera(
      scene
    );

    this.validateNarration(
      scene
    );
  }

  /**
   * Scene duration validation.
   */
  private validateSceneDuration(
    scene: ISceneGraphScene
  ): void {
    if (
      !Number.isFinite(
        scene.duration
      ) ||
      scene.duration <= 0
    ) {
      throw new Error(
        `Invalid duration for scene "${scene.id}".`
      );
    }
  }

  /**
   * Validate scene objects.
   */
  private validateObjects(
    scene: ISceneGraphScene
  ): void {
    if (
      !Array.isArray(
        scene.objects
      )
    ) {
     throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .MISSING_OBJECT_ID,

  message:
    `Object ID is required in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }

    const objectIds =
      new Set<string>();

    for (const object of scene.objects) {
      this.validateObject(
        scene,
        object,
        objectIds
      );
    }
  }

  /**
   * Validate individual object.
   */
  private validateObject(
    scene: ISceneGraphScene,
    object: ISceneObject,
    objectIds: Set<string>
  ): void {
    if (!object.id?.trim()) {
      throw new Error(
        `Object ID is required in scene "${scene.id}".`
      );
    }

    if (
      objectIds.has(object.id)
    ) {
     throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .DUPLICATE_OBJECT_ID,

  message:
    `Duplicate object ID "${object.id}" in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  objectId:
    object.id,
});
    }

    objectIds.add(
      object.id
    );

    if (!object.type?.trim()) {
      throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_OBJECT_TYPE,

  message:
    `Object type is required for "${object.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  objectId:
    object.id,
});
    }

    this.validateVector(
      object.position,
      `position of object "${object.id}"`
    );

    this.validateVector(
      object.rotation,
      `rotation of object "${object.id}"`
    );

    this.validateVector(
      object.scale,
      `scale of object "${object.id}"`
    );
  }

  /**
   * Validate animations and their
   * referenced objects.
   */
  private validateAnimations(
    scene: ISceneGraphScene
  ): void {
    if (
      !Array.isArray(
        scene.animations
      )
    ) {
     throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .MISSING_ANIMATION_ID,

  message:
    `Animation ID is required in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }

    const objectIds =
      new Set(
        scene.objects.map(
          (object) =>
            object.id
        )
      );

    const animationIds =
      new Set<string>();

    for (const animation of scene.animations) {
      if (
        !animation.id?.trim()
      ) {
        throw new Error(
          `Animation ID is required in scene "${scene.id}".`
        );
      }

      if (
        animationIds.has(
          animation.id
        )
      ) {
        throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .DUPLICATE_ANIMATION_ID,

  message:
    `Duplicate animation ID "${animation.id}" in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,
});
      }

      animationIds.add(
        animation.id
      );

      if (
        !objectIds.has(
          animation.objectId
        )
      ) {
       throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .UNKNOWN_ANIMATION_OBJECT,

  message:
    `Animation "${animation.id}" references unknown object "${animation.objectId}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,

  objectId:
    animation.objectId,
});
      }

      if (
        !animation.type?.trim()
      ) {
       throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_ANIMATION_TYPE,

  message:
    `Animation type is required for "${animation.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,
});
      }

      if (
        !Number.isFinite(
          animation.startTime
        ) ||
        animation.startTime < 0
      ) {
       throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_ANIMATION_START_TIME,

  message:
    `Invalid start time for animation "${animation.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,
});
      }

      if (
        !Number.isFinite(
          animation.duration
        ) ||
        animation.duration <= 0
      ) {
        throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_ANIMATION_DURATION,

  message:
    `Invalid duration for animation "${animation.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,
});
      }

      const animationEnd =
        animation.startTime +
        animation.duration;

      if (
        animationEnd >
        scene.duration
      ) {
       throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .ANIMATION_OUT_OF_BOUNDS,

  message:
    `Animation "${animation.id}" exceeds scene "${scene.id}" duration.`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,

  animationId:
    animation.id,
});
      }
    }
  }

  /**
   * Validate camera configuration.
   */
  private validateCamera(
    scene: ISceneGraphScene
  ): void {
    if (!scene.camera) {
      throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .MISSING_CAMERA,

  message:
    `Camera configuration is required in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }

    this.validateVector(
      scene.camera.position,
      `camera position in scene "${scene.id}"`
    );

    this.validateVector(
      scene.camera.target,
      `camera target in scene "${scene.id}"`
    );

    if (
      !Number.isFinite(
        scene.camera.fov
      ) ||
      scene.camera.fov <= 0 ||
      scene.camera.fov >= 180
    ) {
      throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_CAMERA_FOV,

  message:
    `Invalid camera FOV in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }
  }

  /**
   * Validate narration timeline.
   */
  private validateNarration(
    scene: ISceneGraphScene
  ): void {
    if (!scene.narration) {
      return;
    }

    if (
      !scene.narration.text?.trim()
    ) {
     throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_NARRATION_TEXT,

  message:
    `Narration text cannot be empty in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }

    if (
      !Number.isFinite(
        scene.narration.startTime
      ) ||
      scene.narration.startTime < 0
    ) {
      throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_NARRATION_START_TIME,

  message:
    `Invalid narration start time in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
    }

    if (
      scene.narration.duration !==
      undefined
    ) {
      if (
        !Number.isFinite(
          scene.narration.duration
        ) ||
        scene.narration.duration <= 0
      ) {
       throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .INVALID_NARRATION_DURATION,

  message:
    `Invalid narration duration in scene "${scene.id}".`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
      }

      const narrationEnd =
        scene.narration.startTime +
        scene.narration.duration;

      if (
        narrationEnd >
        scene.duration
      ) {
        throw new ValidationIssueError({
  code:
    VERIFICATION_ERROR_CODES
      .NARRATION_OUT_OF_BOUNDS,

  message:
    `Narration exceeds scene "${scene.id}" duration.`,

  severity:
    VERIFICATION_SEVERITY.ERROR,

  sceneId:
    scene.id,
});
      }
    }
  }

  /**
   * Validate 3D vector.
   */
  private validateVector(
  vector: {
    x: number;
    y: number;
    z: number;
  },
  label: string
): void {
  if (!vector) {
    throw new ValidationIssueError({
      code:
        VERIFICATION_ERROR_CODES
          .INVALID_OBJECT_TRANSFORM,

      message:
        `${label} is required.`,

      severity:
        VERIFICATION_SEVERITY.ERROR,
    });
  }

  if (
    !Number.isFinite(vector.x) ||
    !Number.isFinite(vector.y) ||
    !Number.isFinite(vector.z)
  ) {
    throw new ValidationIssueError({
      code:
        VERIFICATION_ERROR_CODES
          .INVALID_OBJECT_TRANSFORM,

      message:
        `Invalid ${label}.`,

      severity:
        VERIFICATION_SEVERITY.ERROR,
    });
  }
}


validateWithResult(
  sceneGraph: ISceneGraph
): IVerificationResult {
  const errors: IVerificationIssue[] = [];
  const warnings: IVerificationIssue[] = [];

  try {
    this.validate(sceneGraph);
  } catch (error) {
    if (
      error instanceof ValidationIssueError
    ) {
      errors.push({
        code: error.code,
        message: error.message,
        severity: error.severity,
        sceneId: error.sceneId,
        objectId: error.objectId,
        animationId: error.animationId,
      });
    } else {
      errors.push({
        code:
          VERIFICATION_ERROR_CODES
            .SCENE_GRAPH_REQUIRED,

        message:
          error instanceof Error
            ? error.message
            : "Scene graph validation failed.",

        severity:
          VERIFICATION_SEVERITY.ERROR,
      });
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,

    warnings,

    checkedAt:
      new Date(),
  };
}

// private mapValidationError(
//   message: string
// ): IVerificationIssue {
//   let code : VerificationErrorCode =
//     VERIFICATION_ERROR_CODES
//       .SCENE_GRAPH_REQUIRED;

//   if (
//     message.includes(
//       "Duplicate scene ID"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .DUPLICATE_SCENE_ID;
//   } else if (
//     message.includes(
//       "Invalid scene order"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .INVALID_SCENE_ORDER;
//   } else if (
//     message.includes(
//       "Invalid duration for scene"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .INVALID_SCENE_DURATION;
//   } else if (
//     message.includes(
//       "Duplicate object ID"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .DUPLICATE_OBJECT_ID;
//   } else if (
//     message.includes(
//       "Object type is required"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .INVALID_OBJECT_TYPE;
//   } else if (
//     message.includes(
//       "references unknown object"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .UNKNOWN_ANIMATION_OBJECT;
//   } else if (
//     message.includes(
//       "Duplicate animation ID"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .DUPLICATE_ANIMATION_ID;
//   } else if (
//     message.includes(
//       "Animation exceeds"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .ANIMATION_OUT_OF_BOUNDS;
//   } else if (
//     message.includes(
//       "Camera configuration is required"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .MISSING_CAMERA;
//   } else if (
//     message.includes(
//       "Invalid camera FOV"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .INVALID_CAMERA_FOV;
//   } else if (
//     message.includes(
//       "Narration exceeds"
//     )
//   ) {
//     code =
//       VERIFICATION_ERROR_CODES
//         .NARRATION_OUT_OF_BOUNDS;
//   }

//   return {
//     code,

//     message,

//     severity:
//       VERIFICATION_SEVERITY.ERROR,
//   };
// }
}

export const sceneGraphValidator =
  new SceneGraphValidator();