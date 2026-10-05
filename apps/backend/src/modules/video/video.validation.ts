import { z } from "zod";

import {
  ANIMATION_TYPES,
  SCENE_STATUS,
  VERIFICATION_STATUS,
  VIDEO_OBJECT_TYPES,
} from "./video.constants";

/**
 * Position
 */
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/**
 * Rotation
 */
const rotationSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/**
 * Scale
 */
const scaleSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/**
 * Scene Object
 */
const sceneObjectSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    VIDEO_OBJECT_TYPES.TEXT,
    VIDEO_OBJECT_TYPES.MODEL,
    VIDEO_OBJECT_TYPES.IMAGE,
    VIDEO_OBJECT_TYPES.PARTICLE,
    VIDEO_OBJECT_TYPES.LIGHT,
    VIDEO_OBJECT_TYPES.GROUP,
  ]),
  name: z.string().min(1),

  position: positionSchema.optional(),

  rotation: rotationSchema.optional(),

  scale: scaleSchema.optional(),

  properties: z
    .record(z.string(), z.unknown())
    .optional(),
});

/**
 * Scene Animation
 */
const sceneAnimationSchema =
  z.object({
    id: z.string().min(1),

    objectId: z.string().min(1),

    type: z.enum([
      ANIMATION_TYPES.APPEAR,
      ANIMATION_TYPES.DISAPPEAR,
      ANIMATION_TYPES.MOVE,
      ANIMATION_TYPES.SCALE,
      ANIMATION_TYPES.ROTATE,
      ANIMATION_TYPES.HIGHLIGHT,
      ANIMATION_TYPES.TRANSFORM,
    ]),

    startTime: z
      .number()
      .min(0),

    duration: z
      .number()
      .min(0),

    from: z
      .record(z.string(), z.unknown())
      .optional(),

    to: z
      .record(z.string(), z.unknown())
      .optional(),
  });

/**
 * Camera
 */
const sceneCameraSchema =
  z.object({
    position: positionSchema,

    target: positionSchema,

    fov: z
      .number()
      .min(1)
      .max(180),
  });

/**
 * Narration
 */
const sceneNarrationSchema =
  z.object({
    text: z.string().min(1),

    startTime: z
      .number()
      .min(0),

    duration: z
      .number()
      .min(0)
      .optional(),

    voice: z.string().optional(),
  });

/**
 * Scene
 */
const sceneSchema =
  z.object({
    id: z.string().min(1),

    order: z
      .number()
      .int()
      .min(0),

    title: z.string().min(1),

    duration: z
      .number()
      .min(0),

    status: z
      .enum([
        SCENE_STATUS.DRAFT,
        SCENE_STATUS.READY,
        SCENE_STATUS.RENDERING,
        SCENE_STATUS.VERIFIED,
        SCENE_STATUS.FAILED,
      ])
      .optional(),

    objects: z
      .array(sceneObjectSchema)
      .default([]),

    animations: z
      .array(sceneAnimationSchema)
      .default([]),

    camera: sceneCameraSchema,

    narration:
      sceneNarrationSchema.optional(),

    verificationStatus: z
      .enum([
        VERIFICATION_STATUS.PENDING,
        VERIFICATION_STATUS.PASSED,
        VERIFICATION_STATUS.FAILED,
      ])
      .optional(),
  });

/**
 * Create Video
 *
 * Initial video creation only.
 * AI-generated scenes will be handled later.
 */
export const createVideoSchema =
  z.object({
    title: z
      .string()
      .min(3)
      .max(200),

    concept: z
      .string()
      .min(2)
      .max(500),

    description: z
      .string()
      .max(2000)
      .optional(),

    scenes: z
      .array(sceneSchema)
      .default([]),
  });

/**
 * Update Video
 */
export const updateVideoSchema =
  z.object({
    title: z
      .string()
      .min(3)
      .max(200)
      .optional(),

    description: z
      .string()
      .max(2000)
      .optional(),

    scenes: z
      .array(sceneSchema)
      .optional(),
  });