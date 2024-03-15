import { NextFunction, Request, Response } from "express";
export declare function handleValidationResult(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
