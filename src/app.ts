/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

import { Context } from "./context";
import { expressHandler } from "./utils";

import { installHandler, uninstallHandler } from "./routes/install";
import { AmqpSocket, createAmqpSocket } from "./amqp";
import { createRoutingKeyStore } from "./routingKeyStore";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsHandler
} from "./routes/addons";

export interface App {
  express: express.Express;
  amqp: AmqpSocket;
}

export function buildExpress(ctx: Context): Express {
  const app = express();
  app.use(express.json());

  app.use(cors());

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  app.get(
    "/addons",
    expressHandler(getAddonsHandler(ctx)) // handle request
  );

  app.get("/addons/:id", expressHandler(getAddonByIdHandler(ctx)));

  app.get("/addons/:id/readme", expressHandler(getAddonReadMeByIdHandler(ctx)));

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
  amqp.handle("get-addon-by-id", getAddonByIdHandler(ctx));
  amqp.handle("get-addon-readme-by-id", getAddonReadMeByIdHandler(ctx));

  return amqp;
}

export async function buildApp(ctx: Context): Promise<App> {
  const express = buildExpress(ctx);
  const amqp = await buildAmqp(ctx);

  return { express, amqp };
}
