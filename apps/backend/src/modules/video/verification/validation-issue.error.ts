import {
  VerificationErrorCode,
  VERIFICATION_SEVERITY,
} from "./verification.constants";

import {
  VerificationSeverity,
} from "./verification.types";

export class ValidationIssueError
  extends Error {
  public readonly code: VerificationErrorCode;

  public readonly severity: VerificationSeverity;

  public readonly sceneId?: string;

  public readonly objectId?: string;

  public readonly animationId?: string;

  constructor({
    code,
    message,
    severity = VERIFICATION_SEVERITY.ERROR,
    sceneId,
    objectId,
    animationId,
  }: {
    code: VerificationErrorCode;
    message: string;
    severity?: VerificationSeverity;
    sceneId?: string;
    objectId?: string;
    animationId?: string;
  }) {
    super(message);

    this.name =
      "ValidationIssueError";

    this.code = code;
    this.severity = severity;

    this.sceneId = sceneId;
    this.objectId = objectId;
    this.animationId =
      animationId;

    Object.setPrototypeOf(
      this,
      ValidationIssueError.prototype
    );
  }
}