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
import { AmqpSocket, AmqpConfig, createRoutingKeyStore, createAmqpSocket } from "ts-amqp-socket";

import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsHandler,
  getAddonsByUserIdHandler
} from "./routes/addons";
import path from "path";

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

  app.use("/store", cors(), express.static(path.join(__dirname, "../data")));

  return app;
}

export async function buildAmqp(ctx: Context) {
  const amqpConfig: AmqpConfig = {
    queue: {
      request: "mp-backend-request-queue"
    },
    exchange: {
      request: "requests-exchange",
      response: "ui-direct-exchange"
    },
    routingKey: {
      request: "mp-backend-request"
    },

    successType: "mp_backend_result",
    errorType: "mp_backend_error",

    bodyMapper: message => {
      return JSON.parse(
        JSON.parse(message.content.toString()).fromFrontend.body
      );
    }
  };

  const routingKeyStore = await createRoutingKeyStore();
  const amqp = await createAmqpSocket(amqpConfig, routingKeyStore);

  amqp.handle("install", installHandler(ctx));
  amqp.handle("uninstall", uninstallHandler(ctx));

  amqp.handle("addons/get", getAddonsHandler(ctx));
  amqp.handle("addons/get-by-id", getAddonByIdHandler(ctx));
  amqp.handle("addons/get-readme", getAddonReadMeByIdHandler(ctx));
  amqp.handle("addons/get-by-user", getAddonsByUserIdHandler(ctx));

  return amqp;
}

export async function buildApp(ctx: Context): Promise<App> {
  const express = buildExpress(ctx);
  const amqp = await buildAmqp(ctx);

  return new App(express, amqp);
}
