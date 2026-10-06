import { Router } from "express";

import { topicController } from "./topic.controller";

const router = Router();

router.get("/topics", topicController.listTopics);
router.get("/topics/:topicId", topicController.getTopicById);
router.post("/topics/import-public-source", topicController.ingestPublicSource);

export default router;
