/**
 * @synapse/shared
 * Universal contracts shared between backend verification engines and frontend visualizers.
 */

// ============================================================
// 1. TOPICS & TAXONOMY (EXACTLY 10 SUPPORTED TOPICS)
// ============================================================

export const SUPPORTED_TOPIC_IDS = {
  STACK: "STACK",
  QUEUE: "QUEUE",
  BINARY_SEARCH: "BINARY_SEARCH",
  BUBBLE_SORT: "BUBBLE_SORT",
  LINEAR_SEARCH: "LINEAR_SEARCH",
  LINKED_LIST: "LINKED_LIST",
  BST: "BST",
  SELECTION_SORT: "SELECTION_SORT",
  TWO_POINTERS: "TWO_POINTERS",
  BFS: "BFS",
} as const;

export type SupportedTopicId =
  (typeof SUPPORTED_TOPIC_IDS)[keyof typeof SUPPORTED_TOPIC_IDS];

export type TopicCategory =
  | "DATA_STRUCTURE"
  | "SEARCH_ALGORITHM"
  | "SORT_ALGORITHM"
  | "ALGORITHMIC_TECHNIQUE"
  | "GRAPH_ALGORITHM";

export interface ITopicMetadata {
  id: SupportedTopicId;
  name: string;
  category: TopicCategory;
  summary: string;
  supportedOperations: string[];
  defaultInitialValues: unknown[];
  complexity: {
    time: string;
    space: string;
  };
}

// ============================================================
// 2. CONCEPTUAL KNOWLEDGE REPRESENTATION (CKR)
// ============================================================

export interface ICkrEntity {
  id: string;
  name: string;
  role: string;
  cardinality: string;
}

export interface ICkrInvariant {
  id: string;
  rule: string;
  enforcement: "STRICT" | "CONDITIONAL";
  failureDescription: string;
}

export interface ICkrOperationRule {
  operation: string;
  targetSlot: string; // e.g., "TOP" for Stack Push/Pop, "REAR" for Queue Enqueue
  preconditions: string[];
  postconditions: string[];
  effectDescription: string;
}

export interface ICkrEdgeCase {
  id: string;
  trigger: string;
  expectedBehavior: string;
  mitigation: string;
}

export interface IConceptKnowledge {
  topicId: SupportedTopicId;
  topicName: string;
  category: TopicCategory;
  definition: string;
  learningObjectives: string[];
  prerequisites: string[];
  entities: ICkrEntity[];
  invariants: ICkrInvariant[];
  rules: ICkrOperationRule[];
  edgeCases: ICkrEdgeCase[];
  commonMisconceptions: string[];
}

// ============================================================
// 3. STATE MACHINE & TRANSITIONS
// ============================================================

export interface IStateOperation {
  type: string; // e.g. "PUSH", "POP", "PEEK"
  payload?: Record<string, unknown>;
}

export interface IStateSnapshot {
  elements: unknown[];
  pointers: Record<string, number | null | string>; // e.g. { top: 2 } or { front: 0, rear: 2 }
  statusMessage: string;
  metadata?: Record<string, unknown>;
}

export interface IStateTransition {
  stepIndex: number;
  operation: IStateOperation;
  previousState: IStateSnapshot;
  resultingState: IStateSnapshot;
  affectedElementIds: string[];
  explanation: string;
  isValidTransition: boolean;
  edgeCaseTriggered?: string;
}

export interface IStateExecutionTrace {
  initialState: IStateSnapshot;
  transitions: IStateTransition[];
  finalState: IStateSnapshot;
}

// ============================================================
// 4. SCENE GRAPH & VISUAL METADATA
// ============================================================

export interface ISceneVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ISceneObject {
  id: string;
  type: string; // "CONTAINER" | "BOX" | "POINTER" | "TEXT" | "HIGHLIGHT" | "ARROW"
  name: string;
  position: ISceneVector3;
  rotation: ISceneVector3;
  scale: ISceneVector3;
  properties?: Record<string, unknown>;
}

export interface ISceneAnimation {
  id: string;
  objectId: string;
  type: string; // "APPEAR" | "DISAPPEAR" | "TRANSLATE" | "HIGHLIGHT" | "PULSE"
  startTime: number;
  duration: number;
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
  easing?: string;
}

export interface ISceneCamera {
  position: ISceneVector3;
  target: ISceneVector3;
  fov: number;
}

export interface ISceneMilestone {
  id: string;
  timestamp: number;
  event: string;
  narrationCue?: string;
}

export interface ISceneNarration {
  text: string;
  startTime: number;
  duration?: number;
  milestones?: ISceneMilestone[];
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
  semanticIntent?: {
    operation: string;
    targetSlot?: string;
    affectedValue?: unknown;
    expectedStateSnapshot?: IStateSnapshot;
  };
  verificationStatus: string;
}

export interface IPlannedScene {
  id: string;
  order: number;
  title: string;
  intent: string;
  duration: number;
  visualDescription: string;
  cameraShot: string;
  transition: string;
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

export interface ISceneGraph {
  scenes: ISceneGraphScene[];
  totalDuration: number;
  topicId: SupportedTopicId;
  totalDuration: number;
  topicId: SupportedTopicId;
}

// ============================================================
// 5. VERIFICATION (KVE & VKVE)
// ============================================================

export const SHARED_VERIFICATION_SEVERITY = {
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
} as const;

export type SharedVerificationSeverity =
  (typeof SHARED_VERIFICATION_SEVERITY)[keyof typeof SHARED_VERIFICATION_SEVERITY];

export const SHARED_VERIFICATION_STATUS = {
  PENDING: "PENDING",
  PASSED: "PASSED",
  FAILED: "FAILED",
  NEEDS_REVIEW: "NEEDS_REVIEW",
} as const;

export type SharedVerificationStatus =
  (typeof SHARED_VERIFICATION_STATUS)[keyof typeof SHARED_VERIFICATION_STATUS];

export interface IVerificationIssue {
  code: string;
  message: string;
  severity: SharedVerificationSeverity;
  validator: "KVE" | "STRUCTURAL_VAL" | "VKVE" | "SELF_HEAL";
  sceneId?: string;
  objectId?: string;
  animationId?: string;
  expected?: string;
  actual?: string;
  suggestedCorrection?: string;
}

export interface IVerificationResult {
  valid: boolean;
  status: SharedVerificationStatus;
  confidenceScore: number;
  errors: IVerificationIssue[];
  warnings: IVerificationIssue[];
  checkedAt: string; // ISO date string
}

// ============================================================
// 6. DRY RUN ENGINE
// ============================================================

export interface IDryRunRow {
  step: number;
  operation: string;
  stateRepresentation: string;
  variables: Record<string, unknown>;
  description: string;
  highlighted?: boolean;
}

export interface IDryRunTrace {
  topicId: SupportedTopicId;
  columns: string[];
  rows: IDryRunRow[];
}

// ============================================================
// 7. VERIFIED QUIZ ENGINE
// ============================================================

export interface IQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  id: string;
  question: string;
  options: IQuizOption[];
  correctAnswerId: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  bloomLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE";
  derivedFromStepIndex?: number;
}

export interface IVerifiedQuiz {
  topicId: SupportedTopicId;
  title: string;
  questions: IQuizQuestion[];
  generatedAt: string;
}

// ============================================================
// 8. PIPELINE REQUESTS & RESPONSES
// ============================================================

export interface IPipelineGenerateRequest {
  topicId: SupportedTopicId;
  initialValues?: unknown[];
  operations?: IStateOperation[];
  initializeOnly?: boolean;
}

export interface IPipelineInteractionRequest {
  pipelineId: string;
  operation: IStateOperation;
}

export interface INarrationSegment {
  sceneId: string;
  order: number;
  text: string;
  start: number;
  duration: number;
  milestones: Array<{ timestamp: number; cue: string }>;
}

export interface IPipelineGenerateResponse {
  success: boolean;
  pipelineId: string;
  topic: ITopicMetadata;
  ckr: IConceptKnowledge;
  stateTrace: IStateExecutionTrace;
  sceneGraph: ISceneGraph;
  verificationReport: IVerificationResult;
  narrationScript: INarrationSegment[];
  writtenExplanation: {
    summary: string;
    keyPoints: string[];
    steps: Array<{ step: number; title: string; detail: string }>;
    invariants: string[];
    edgeCases: string[];
  };
  dryRun: IDryRunTrace;
  quiz: IVerifiedQuiz;
}

export interface IPipelineInteractionResponse {
  success: boolean;
  updatedState: IStateSnapshot;
  transition: IStateTransition;
  updatedScene: ISceneGraphScene;
  verificationReport: IVerificationResult;
  dryRunRow: IDryRunRow;
  explanation: string;
  narration: INarrationSegment;
  quiz: IVerifiedQuiz;
}
