import { Schema, model } from "mongoose";

import {
  ANIMATION_TYPES,
  SCENE_STATUS,
  VERIFICATION_STATUS,
  VIDEO_OBJECT_TYPES,
  VIDEO_STATUS,
} from "./video.constants";

/**
 * Scene Object
 */
const sceneObjectSchema =
  new Schema(
    {
      id: {
        type: String,
        required: true,
      },

      type: {
        type: String,
        enum: Object.values(
          VIDEO_OBJECT_TYPES
        ),
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      position: {
        x: Number,
        y: Number,
        z: Number,
      },

      rotation: {
        x: Number,
        y: Number,
        z: Number,
      },

      scale: {
        x: Number,
        y: Number,
        z: Number,
      },

      properties: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      _id: false,
    }
  );

/**
 * Scene Animation
 */
const sceneAnimationSchema =
  new Schema(
    {
      id: {
        type: String,
        required: true,
      },

      objectId: {
        type: String,
        required: true,
      },

      type: {
        type: String,
        enum: Object.values(
          ANIMATION_TYPES
        ),
        required: true,
      },

      startTime: {
        type: Number,
        required: true,
        min: 0,
      },

      duration: {
        type: Number,
        required: true,
        min: 0,
      },

      from: {
        type: Schema.Types.Mixed,
      },

      to: {
        type: Schema.Types.Mixed,
      },
    },
    {
      _id: false,
    }
  );

/**
 * Scene Camera
 */
const sceneCameraSchema =
  new Schema(
    {
      position: {
        x: {
          type: Number,
          required: true,
        },
        y: {
          type: Number,
          required: true,
        },
        z: {
          type: Number,
          required: true,
        },
      },

      target: {
        x: {
          type: Number,
          required: true,
        },
        y: {
          type: Number,
          required: true,
        },
        z: {
          type: Number,
          required: true,
        },
      },

      fov: {
        type: Number,
        required: true,
        min: 1,
        max: 180,
      },
    },
    {
      _id: false,
    }
  );

/**
 * Scene Narration
 */
const sceneNarrationSchema =
  new Schema(
    {
      text: {
        type: String,
        required: true,
      },

      startTime: {
        type: Number,
        required: true,
        min: 0,
      },

      duration: {
        type: Number,
        min: 0,
      },

      voice: {
        type: String,
      },
    },
    {
      _id: false,
    }
  );

/**
 * Scene
 */
const sceneSchema =
  new Schema(
    {
      id: {
        type: String,
        required: true,
      },

      order: {
        type: Number,
        required: true,
        min: 0,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      duration: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: Object.values(
          SCENE_STATUS
        ),
        default:
          SCENE_STATUS.DRAFT,
      },

      objects: {
        type: [sceneObjectSchema],
        default: [],
      },

      animations: {
        type: [sceneAnimationSchema],
        default: [],
      },

      camera: {
        type: sceneCameraSchema,
        required: true,
      },

      narration: {
        type: sceneNarrationSchema,
      },

      verificationStatus: {
        type: String,
        enum: Object.values(
          VERIFICATION_STATUS
        ),
        default:
          VERIFICATION_STATUS.PENDING,
      },
    },
    {
      _id: false,
    }
  );

/**
 * Video
 */
const videoSchema =
  new Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      concept: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
      },

      status: {
        type: String,
        enum: Object.values(
          VIDEO_STATUS
        ),
        default:
          VIDEO_STATUS.DRAFT,
      },

      scenes: {
        type: [sceneSchema],
        default: [],
      },

      totalDuration: {
        type: Number,
        default: 0,
        min: 0,
      },

      verificationStatus: {
        type: String,
        enum: Object.values(
          VERIFICATION_STATUS
        ),
        default:
          VERIFICATION_STATUS.PENDING,
      },
    },
    {
      timestamps: true,
    }
  );

export const Video =
  model("Video", videoSchema);