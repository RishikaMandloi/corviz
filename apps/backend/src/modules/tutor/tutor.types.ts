import {
  IDryRunRow,
  IStateOperation,
  IStateSnapshot,
  IStateTransition,
  IVerificationResult,
  SupportedTopicId,
} from "../../shared/contracts";

export type TutorSource = "CKR" | "STATE" | "AI_WITH_VERIFIED_CONTEXT" | "FALLBACK";

export interface ITutorMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ITutorContext {
  topicId: SupportedTopicId;
  topicConcept: string;
  canonicalRules: string[];
  currentState?: IStateSnapshot;
  previousState?: IStateSnapshot;
  currentOperation?: IStateOperation;
  transitionExplanation?: string;
  verifiedScene?: {
    id: string;
    title: string;
    semanticIntent?: { operation?: string };
  };
  dryRunRow?: IDryRunRow;
  verificationReport?: IVerificationResult;
  narrationContext?: string;
  relatedStep?: number;
  conversation?: ITutorMessage[];
}

export interface ITutorProviderResult {
  answer: string;
  source: TutorSource;
  verifiedContext: boolean;
  relatedStep?: number;
}

export interface ITutorProvider {
  generateResponse(question: string, context: ITutorContext): Promise<ITutorProviderResult>;
}

export interface ITutorAskRequest {
  topicId: SupportedTopicId;
  question: string;
  pipelineId?: string;
  currentState?: IStateSnapshot;
  transition?: IStateTransition;
  conversation?: ITutorMessage[];
}

export interface ITutorAskResponse {
  answer: string;
  topicId: SupportedTopicId;
  verifiedContext: boolean;
  source: TutorSource;
  relatedStep?: number;
}
