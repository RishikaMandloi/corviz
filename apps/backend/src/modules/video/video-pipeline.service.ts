import {
  ISceneGraph,
} from "./planner/scene-planner.types";

import {
  verificationService,
} from "./verification";

class VideoPipelineService {
  /**
   * Verify generated scene graph
   * before it reaches rendering.
   */
  verifySceneGraph(
    sceneGraph: ISceneGraph
  ) {
    return verificationService
      .verifySceneGraph(
        sceneGraph
      );
  }

  /**
   * Continue only when the
   * scene graph is valid.
   */
  prepareForRendering(
    sceneGraph: ISceneGraph
  ): ISceneGraph {
    return verificationService
      .assertSceneGraphValid(
        sceneGraph
      );
  }
}

export const videoPipelineService =
  new VideoPipelineService();