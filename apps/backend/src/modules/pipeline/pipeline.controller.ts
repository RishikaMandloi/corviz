import { Request, Response } from "express";
import { asyncHandler, sendResponse } from "../../utils";
import { pipelineService } from "./pipeline.service";
import { topicRepository } from "../topic/topic.repository";
import {
  IPipelineGenerateRequest,
  IPipelineInteractionRequest,
} from "../../shared/contracts";

class PipelineController {
  /**
   * GET /api/v1/pipeline/topics
   * Returns all 10 supported topic metadata records.
   */
  getTopics = asyncHandler(async (_req: Request, res: Response) => {
    const topics = await topicRepository.getVerifiedTopics();
    sendResponse(res, {
      statusCode: 200,
      message: "Supported topics fetched successfully.",
      data: topics,
    });
  });

  /**
   * POST /api/v1/pipeline/generate
   * Generates a fully verified learning pipeline experience.
   */
  generate = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as IPipelineGenerateRequest;
    const result = await pipelineService.generatePipeline(payload);

    sendResponse(res, {
      statusCode: 200,
      message: "Verified learning pipeline generated successfully.",
      data: result,
    });
  });

  /**
   * POST /api/v1/pipeline/interact
   * Processes a dynamic student operation (e.g. Push, Pop) and recalculates state/scene.
   */
  interact = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as IPipelineInteractionRequest;
    const result = await pipelineService.interactPipeline(payload);

    sendResponse(res, {
      statusCode: 200,
      message: "Interactive state transition computed successfully.",
      data: result,
    });
  });

  /**
   * GET /api/v1/pipeline/:id
   * Fetches an existing pipeline session.
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = pipelineService.getPipelineById(id as string);

    sendResponse(res, {
      statusCode: 200,
      message: "Pipeline session fetched successfully.",
      data: result,
    });
  });

  /**
   * POST /api/v1/pipeline/verify
   * Standalone verification endpoint for testing scene graphs.
   */
  verify = asyncHandler(async (req: Request, res: Response) => {
    const { sceneGraph, trace } = req.body;
    const result = pipelineService.verifySceneGraph(sceneGraph, trace);

    sendResponse(res, {
      statusCode: 200,
      message: "Scene graph verification completed.",
      data: result,
    });
  });
}

export const pipelineController = new PipelineController();

