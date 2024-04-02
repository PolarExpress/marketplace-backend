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

////////////////////////////////////////////////////////////////////////////////

export class App {
  public constructor(
    public express: express.Express,
    public amqp: AmqpSocket
  ) {}

  public listen(port: number): void {
    this.express.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    this.amqp.listen();
    console.log("Listening for amqp messages");
  }
}

export function buildExpress(ctx: Context): Express {
  const app = express();
  app.use(express.json());

  app.use(cors());

  app.post("/addons/get", expressHandler(getAddonsHandler(ctx)));
  app.post("/addons/get-by-id", expressHandler(getAddonByIdHandler(ctx)));
  app.post(
    "/addons/get-readme",
    expressHandler(getAddonReadMeByIdHandler(ctx))
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

export async function buildAmqp(ctx: Context) {
  const routingKeyStore = await createRoutingKeyStore();
  const amqp = await createAmqpSocket(routingKeyStore);

  amqp.handle("install", installHandler(ctx));
  amqp.handle("uninstall", uninstallHandler(ctx));

  amqp.handle("addons/get", getAddonsHandler(ctx));
  amqp.handle("addons/get-by-id", getAddonByIdHandler(ctx));
  amqp.handle("addons/get-readme", getAddonReadMeByIdHandler(ctx));

  return amqp;
}

export async function buildApp(ctx: Context): Promise<App> {
  const express = buildExpress(ctx);
  const amqp = await buildAmqp(ctx);

  return new App(express, amqp);
}
