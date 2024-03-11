/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { Context } from "./context";
import { installRoute, uninstallRoute } from "./install";
import { body } from "express-validator";
import { asyncCatch } from "./utils";
import { handleValidationResult } from "./validate";

export function buildApp(ctx: Context) {
  const app = express();

  app.use(express.json());

  app.post(
    "/install",
    body("userId").exists().isString(),
    body("addonId").exists().isString(),
    handleValidationResult,
    asyncCatch(installRoute(ctx))
  );

  app.post(
    "/uninstall",
    body("userId").exists().isString(),
    body("addonId").exists().isString(),
    handleValidationResult,
    asyncCatch(uninstallRoute(ctx))
  );

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction): void => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      next();
    }
  );

  return app;
}
