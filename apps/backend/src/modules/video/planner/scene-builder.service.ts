import {
  ISceneGraph,
  IScenePlan,
  IStateExecutionTrace,
  SupportedTopicId,
} from "../../../shared/contracts";
import { stackSceneBuilder } from "./stack-scene.builder";
import { queueSceneBuilder } from "./queue-scene.builder";
import { arrayAlgorithmSceneBuilder } from "./array-algorithm-scene.builder";
import { linkedListSceneBuilder } from "./linked-list-scene.builder";
import { bstSceneBuilder } from "./bst-scene.builder";
import { bfsSceneBuilder } from "./bfs-scene.builder";

class SceneBuilderService {
  build(
    topicId: SupportedTopicId,
    trace: IStateExecutionTrace
  ): { plan: IScenePlan; sceneGraph: ISceneGraph } {
    switch (topicId) {
      case "STACK":
        return stackSceneBuilder.build(trace);

      case "QUEUE":
        return queueSceneBuilder.build(trace);

      case "BINARY_SEARCH":
      case "BUBBLE_SORT":
      case "LINEAR_SEARCH":
      case "SELECTION_SORT":
      case "TWO_POINTERS":
        return arrayAlgorithmSceneBuilder.build(topicId, trace);

      case "LINKED_LIST":
        return linkedListSceneBuilder.build(trace);

      case "BST":
        return bstSceneBuilder.build(trace);

      case "BFS":
        return bfsSceneBuilder.build(trace);

      default:
        throw new Error(`No scene builder implemented for topic "${topicId}".`);
    }
  }
}

export const sceneBuilderService = new SceneBuilderService();
