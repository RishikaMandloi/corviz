import { Router } from "express";
import { tutorController } from "./tutor.controller";

const router = Router();

router.post("/tutor/ask", tutorController.ask);

export default router;
