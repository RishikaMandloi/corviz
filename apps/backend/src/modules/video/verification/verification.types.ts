import {
  VerificationErrorCode,
  VERIFICATION_SEVERITY,
} from "./verification.constants";

export type VerificationSeverity =
  (typeof VERIFICATION_SEVERITY)[keyof typeof VERIFICATION_SEVERITY];

export interface IVerificationIssue {
  code: VerificationErrorCode;

  message: string;

  severity: VerificationSeverity;

  sceneId?: string;

  objectId?: string;

  animationId?: string;
}

export interface IVerificationResult {
  valid: boolean;

  errors: IVerificationIssue[];

  warnings: IVerificationIssue[];

  checkedAt: Date;
}