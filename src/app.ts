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
import { body, query } from "express-validator";
import { asyncCatch } from "./utils";
import { handleValidationResult } from "./middlewares/validation";
import { getAddonsRoute } from "./routes/addons";
import cors from "cors";
import { AddonCategory } from "prisma/prisma-client";

export function buildApp(ctx: Context) {
  const app = express();
  app.use(express.json());

  app.use(
    cors({
      origin: "http://localhost:5173"
    })
  );

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  app.post(
    "/install",
    body("userId")
      .exists()
      .withMessage("No userId specified")
      .isString()
      .withMessage("userId needs to be a string"),
    body("addonId")
      .exists()
      .withMessage("No addonId specified")
      .isString()
      .withMessage("addonId needs to be a string"),
    handleValidationResult,
    asyncCatch(installRoute(ctx))
  );

  app.post(
    "/uninstall",
    body("userId")
      .exists()
      .withMessage("No userId specified")
      .isString()
      .withMessage("userId needs to be a string"),
    body("addonId")
      .exists()
      .withMessage("No addonId specified")
      .isString()
      .withMessage("addonId needs to be a string"),
    handleValidationResult,
    asyncCatch(uninstallRoute(ctx))
  );

  app.get(
    "/addons",
    query("page").default(0).isNumeric().toInt(),
    query("category")
      .optional()
      .isIn(Object.values(AddonCategory))
      .withMessage(
        `Invalid category, must be one of: ${Object.values(AddonCategory).join(", ")}`
      ),
    handleValidationResult, // handle validation
    asyncCatch(getAddonsRoute(ctx)) // handle request
  );

  //////////////////////////////////////////////////////////////////////////////

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction): void => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      next();
    }
  );

  return app;
}
