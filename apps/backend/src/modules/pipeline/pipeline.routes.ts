import { Router } from "express";
import { pipelineController } from "./pipeline.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { generatePipelineSchema, interactPipelineSchema, verifyPipelineSchema } from "./pipeline.validation";

const router = Router();

router.get("/pipeline/topics", pipelineController.getTopics);
router.post("/pipeline/generate", validateRequest(generatePipelineSchema), pipelineController.generate);
router.post("/pipeline/interact", validateRequest(interactPipelineSchema), pipelineController.interact);
router.post("/pipeline/verify", validateRequest(verifyPipelineSchema), pipelineController.verify);
router.get("/pipeline/:id", pipelineController.getById);

export default router;

