/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

// middleware to handle validation results from express-validator
export function handleValidationResult(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }
  next();
}
