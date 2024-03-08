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
import { installRoute, uninstallRoute } from "./routes/install";
import { body } from "express-validator";
import { asyncCatch } from "./utils";
import { handleValidationResult } from "./middlewares/validation";
import { getAddonsRoute } from "./routes/addons";

export function buildApp(ctx: Context) {
  const app = express();
  app.use(express.json());

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

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

  app.get(
    "/addons",
    // insert validation middleware here
    // see https://express-validator.github.io/docs for documentation
    handleValidationResult, // handle validation
    asyncCatch(getAddonsRoute(ctx)) // handle request
  );

  //////////////////////////////////////////////////////////////////////////////

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction): void => {
      console.error(err);
      res.status(500).json({ error: err.message });
      next();
    }
  );

  return app;
}
