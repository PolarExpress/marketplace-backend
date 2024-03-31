/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import express, { Request, Response, NextFunction } from "express";
import { param, query } from "express-validator";
import cors from "cors";

import { Context } from "./context";
import { expressHandler } from "./utils";
import { handleValidationResult } from "./middlewares/validation";
import { AddonCategory } from "prisma/prisma-client";

import { installHandler, uninstallHandler } from "./routes/install";
import { getAddonByIdHandler, getAddonsHandler } from "./routes/addons";
import { AmqpSocket, createAmqpSocket } from "./amqp";
import { createRoutingKeyStore } from "./routingKeyStore";

export interface App {
  express: express.Express;
  amqp: AmqpSocket;
}

export function buildExpress(ctx: Context) {
  const app = express();
  app.use(express.json());

  app.use(
    cors({
      origin: "http://localhost:4201"
    })
  );

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  // app.post(
  //   "/install",
  //   body("userId")
  //     .exists()
  //     .withMessage("No userId specified")
  //     .isString()
  //     .withMessage("userId needs to be a string"),
  //   body("addonId")
  //     .exists()
  //     .withMessage("No addonId specified")
  //     .isString()
  //     .withMessage("addonId needs to be a string"),
  //   handleValidationResult,
    
  // );

  // app.post(
  //   "/uninstall",
  //   body("userId")
  //     .exists()
  //     .withMessage("No userId specified")
  //     .isString()
  //     .withMessage("userId needs to be a string"),
  //   body("addonId")
  //     .exists()
  //     .withMessage("No addonId specified")
  //     .isString()
  //     .withMessage("addonId needs to be a string"),
  //   handleValidationResult,
  //   wrapHandler(uninstallHandler(ctx))
  // );

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
    expressHandler(getAddonsHandler(ctx)) // handle request
  );

  app.get(
    "/addons/:id",
    param("id").isString().withMessage("Invalid id, must be a string"),
    handleValidationResult,
    expressHandler(getAddonByIdHandler(ctx))
  );

  app.get(
    "/addons/:id/readme",
    param("id").isString().withMessage("Invalid id, must be a string"),
    handleValidationResult,
    expressHandler(getAddonByIdHandler(ctx))
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

export async function buildAmqp(ctx: Context) {
  const routingKeyStore = await createRoutingKeyStore();
  const amqp = await createAmqpSocket(routingKeyStore);

  amqp.handle("install", installHandler(ctx));
  amqp.handle("uninstall", uninstallHandler(ctx));

  amqp.handle("get-addons", getAddonsHandler(ctx));

  return amqp;
}

export async function buildApp(ctx: Context): Promise<App> {
  const express = buildExpress(ctx);
  const amqp = await buildAmqp(ctx);

  return { express, amqp };
}
