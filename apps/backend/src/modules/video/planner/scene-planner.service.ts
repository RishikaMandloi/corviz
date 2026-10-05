import {
  CAMERA_SHOT,
  SCENE_INTENT,
  SCENE_PLAN_VERSION,
  TRANSITION_TYPE,
} from "./scene-planner.constants";

import {
  IScenePlan,
  IScenePlannerInput,
} from "./scene-planner.types";

import {
  sceneGraphBuilder,
} from "./scene-graph.builder";

import {
  sceneGraphValidator,
} from "./scene-graph.validator";

class ScenePlannerService {
  /**
   * Create initial deterministic scene plan.
   *
   * AI generation will be plugged into
   * this layer later.
   */
  async createPlan(
    input: IScenePlannerInput
  ): Promise<IScenePlan> {
    const concept =
      input.concept.trim();

    if (!concept) {
      throw new Error(
        "Concept is required."
      );
    }

    const estimatedDuration =
      input.estimatedDuration ||
      60;

    const scenes =
      this.buildInitialScenes(
        concept,
        estimatedDuration
      );

    /**
     * Create initial scene plan
     */
    const plan: IScenePlan = {
      version:
        SCENE_PLAN_VERSION,

      concept,

      learningObjective:
        input.learningObjective,

      scenes,

      totalDuration:
        scenes.reduce(
          (total, scene) =>
            total + scene.duration,
          0
        ),
    };

    /**
     * Convert scene plan
     * into renderer-compatible
     * scene graph.
     */
    const sceneGraph =
      sceneGraphBuilder.build(
        plan
      );

    /**
     * Combine plan and
     * generated scene graph.
     */
    const finalPlan:IScenePlan = {
      ...plan,
      sceneGraph,
    };

    /**
     * Validate final scene graph.
     */
    sceneGraphValidator.validate(
      sceneGraph
    );

    return finalPlan;
  }

  /**
   * Temporary deterministic planner.
   *
   * This is NOT the final AI planner.
   */
  private buildInitialScenes(
    concept: string,
    totalDuration: number
  ) {
    const introDuration =
      Math.min(
        8,
        totalDuration
      );

    const explanationDuration =
      Math.max(
        10,
        totalDuration -
          introDuration
      );

    return [
      {
        id: "scene-1",

        order: 1,

        title:
          `Introduction to ${concept}`,

        intent:
          SCENE_INTENT.INTRODUCTION,

        duration:
          introDuration,

        visualDescription:
          `Cinematic introduction establishing the concept of ${concept}.`,

        cameraShot:
          CAMERA_SHOT.WIDE,

        transition:
          TRANSITION_TYPE.FADE,

        narration: {
          text:
            `In this lesson, we will understand ${concept}.`,
        },
      },

      {
        id: "scene-2",

        order: 2,

        title:
          `Understanding ${concept}`,

        intent:
          SCENE_INTENT.EXPLANATION,

        duration:
          explanationDuration,

        visualDescription:
          `A focused cinematic explanation of ${concept} using educational 3D visual elements.`,

        cameraShot:
          CAMERA_SHOT.MEDIUM,

        transition:
          TRANSITION_TYPE.DISSOLVE,

        narration: {
          text:
            `Let's understand how ${concept} works step by step.`,
        },
      },
    ];
  }
}

export const scenePlannerService =
  new ScenePlannerService();