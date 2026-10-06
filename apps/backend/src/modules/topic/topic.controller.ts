import { Request, Response } from "express";

import { asyncHandler, sendResponse } from "../../utils";
import { knowledgeIngestionService } from "../knowledge/knowledge-ingestion.service";
import { topicRepository } from "./topic.repository";

class TopicController {
  listTopics = asyncHandler(async (_req: Request, res: Response) => {
    const topics = await topicRepository.getVerifiedTopics();
    sendResponse(res, {
      statusCode: 200,
      message: "Verified topics fetched successfully.",
      data: topics,
    });
  });

  getTopicById = asyncHandler(async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const topic = await topicRepository.getTopic(topicId as any);

    if (!topic) {
      sendResponse(res, {
        statusCode: 404,
        message: `Topic "${topicId}" is not available in the verified catalog.`,
        data: null,
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      message: "Topic metadata fetched successfully.",
      data: topic,
    });
  });

  ingestPublicSource = asyncHandler(async (req: Request, res: Response) => {
    const { topicId } = req.body as { topicId?: string };
    if (!topicId) {
      sendResponse(res, {
        statusCode: 400,
        message: "A topicId is required for public-source ingestion.",
        data: null,
      });
      return;
    }

    const decision = await knowledgeIngestionService.importPublicTopicMetadata(topicId as any);

    sendResponse(res, {
      statusCode: decision.accepted ? 200 : decision.reason?.toLowerCase().includes("verified") ? 409 : 400,
      message: decision.reason ?? "Public-source ingestion completed.",
      data: decision,
    });
  });
}

export const topicController = new TopicController();
