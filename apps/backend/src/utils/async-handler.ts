// import {
//   NextFunction,
//   Request,
//   RequestHandler,
//   Response,
//   ParamsDictionary,
// } from "express";

// import { ParsedQs } from "qs";

// /**
//  * Generic Async Controller
//  */
// type AsyncController<
//   P = ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery = ParsedQs,
// > = (
//   req: Request<P, ResBody, ReqBody, ReqQuery>,
//   res: Response,
//   next: NextFunction
// ) => Promise<void>;

// /**
//  * Async Handler
//  */
// export const asyncHandler = <
//   P = ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery = ParsedQs,
// >(
//   controller: AsyncController<P, ResBody, ReqBody, ReqQuery>
// ): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
//   return (req, res, next) => {
//     Promise.resolve(controller(req, res, next)).catch(next);
//   };
// };

import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (
  controller: AsyncController
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
};