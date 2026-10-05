import { Request, Response } from "express";
import { asyncHandler, sendResponse } from "../../utils";
import { tutorService } from "./tutor.service";
import { ITutorAskRequest } from "./tutor.types";

class TutorController {
  ask = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ITutorAskRequest;
    const result = await tutorService.ask(payload);
    sendResponse(res, {
      statusCode: 200,
      message: "Tutor response generated successfully.",
      data: result,
    });
  });
}

export const tutorController = new TutorController();
