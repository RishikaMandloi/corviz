import { z } from "zod";

const topicIdSchema = z.enum([
  "STACK",
  "QUEUE",
  "BINARY_SEARCH",
  "BUBBLE_SORT",
  "LINEAR_SEARCH",
  "LINKED_LIST",
  "BST",
  "SELECTION_SORT",
  "TWO_POINTERS",
  "BFS",
]);

const operationSchema = z.object({
  type: z.string().trim().min(1).max(64),
  payload: z.record(z.string(), z.unknown()).optional(),
}).strict();

const stateSnapshotSchema = z.object({
  elements: z.array(z.unknown()),
  pointers: z.record(z.string(), z.union([z.number().finite(), z.string(), z.null()])),
  statusMessage: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const generatePipelineSchema = z.object({
  topicId: topicIdSchema,
  initialValues: z.array(z.unknown()).max(500).optional(),
  operations: z.array(operationSchema).max(500).optional(),
  initializeOnly: z.boolean().optional(),
}).strict();

export const interactPipelineSchema = z.object({
  pipelineId: z.string().uuid(),
  operation: operationSchema,
}).strict();

export const verifyPipelineSchema = z.object({
  sceneGraph: z.object({
    topicId: topicIdSchema,
    scenes: z.array(z.unknown()).min(1).max(500),
  }).passthrough(),
  trace: z.object({
    initialState: stateSnapshotSchema,
    transitions: z.array(z.unknown()).max(500),
    finalState: stateSnapshotSchema,
  }).passthrough().optional(),
}).strict();
