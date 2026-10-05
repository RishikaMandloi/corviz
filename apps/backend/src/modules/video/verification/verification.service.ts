import {
  ISceneGraph,
} from "../planner/scene-planner.types";

import {
  sceneGraphValidator,
} from "../planner/scene-graph.validator";

import {
  IVerificationResult,
} from "./verification.types";

class VerificationService {
  /**
   * Verify Scene Graph
   */
  verifySceneGraph(
    sceneGraph: ISceneGraph
  ): IVerificationResult {
    return sceneGraphValidator
      .validateWithResult(
        sceneGraph
      );
  }

  /**
   * Verify Scene Graph
   *
   * Throws when the graph is invalid.
   *
   * Useful when the next pipeline stage
   * must NOT execute after validation failure.
   */
  assertSceneGraphValid(
    sceneGraph: ISceneGraph
  ): ISceneGraph {
    const result =
      this.verifySceneGraph(
        sceneGraph
      );

    if (!result.valid) {
      throw new Error(
        "Scene graph verification failed."
      );
    }

    return sceneGraph;
  }
}

export const verificationService =
  new VerificationService();