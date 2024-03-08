import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { Context } from "./context";
import { installRoute } from "./install";
import { body, validationResult } from "express-validator";

// import { enhance } from "@zenstackhq/runtime";

function handleValidationResult(
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

export function buildApp(ctx: Context) {
  const app = express();

  app.use(express.json());

  app.post(
    "/install",
    body("userId").exists().isString(),
    body("addonId").exists().isString(),
    handleValidationResult,
    installRoute(ctx)
  );

  app.use((err: Error, _: Request, res: Response) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });

  return app;
}
