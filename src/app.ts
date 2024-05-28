/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import {
  AmqpConfig,
  AmqpSocket,
  createAmqpSocket,
  createRoutingKeyStore
} from "ts-amqp-socket";

import { Context } from "./context";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsByUserIdHandler,
  getAddonsHandler
} from "./routes/addons";
import { installHandler, uninstallHandler } from "./routes/install";
import { asyncCatch, ensureCustomError, expressHandler } from "./utils";

////////////////////////////////////////////////////////////////////////////////

export class App {
  public constructor(
    public express: express.Express,
    public amqp: AmqpSocket
  ) {}

  /**
   * Starts the server to listen for HTTP and AMQP requests.
   *
   * @param port The port number to listen on.
   */
  public listen(port: number): void {
    this.express.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    this.amqp.listen();
    console.log("Listening for amqp messages");
  }
}

/**
 * Builds an Express instance.
 *
 * @param   context The context to use for handling the requests.
 *
 * @returns         An Express instance.
 */
export function buildExpress(context: Context): Express {
  const app = express();
  app.use(express.json());
  app.use(cors());

  app.post("/addons/get", expressHandler(getAddonsHandler(context)));
  app.post("/addons/get-by-id", expressHandler(getAddonByIdHandler(context)));
  app.post(
    "/addons/get-readme",
    expressHandler(getAddonReadMeByIdHandler(context))
  );

  app.use(
    (
      error: Error,
      request: Request,
      response: Response,
      next: NextFunction
    ): void => {
      console.error(error);

      const customError = ensureCustomError(error);

      response
        .status(customError.statusCode)
        .json({ error: customError.message });

      next();
    }
  );

  app.get(
    "/store/:filepath(*)",
    cors(),
    asyncCatch(context.minio.serveFile.bind(context.minio))
  );

  return app;
}

/**
 * Creates an AMQP socket using the context object given.
 *
 * @param   context The context to handle.
 *
 * @returns         An AMQP socket.
 */
export async function buildAmqp(context: Context) {
  const amqpConfig: AmqpConfig = {
    bodyMapper: message => {
      return JSON.parse(
        JSON.parse(message.content.toString()).fromFrontend.body
      );
    },
    errorType: "mp_backend_error",
    exchange: {
      request: "requests-exchange",
      response: "ui-direct-exchange"
    },

    queue: {
      request: "mp-backend-request-queue"
    },
    routingKey: {
      request: "mp-backend-request"
    },

    successType: "mp_backend_result"
  };

  const routingKeyStore = await createRoutingKeyStore();
  const amqp = await createAmqpSocket(amqpConfig, routingKeyStore);

  amqp.handle("install", installHandler(context));
  amqp.handle("uninstall", uninstallHandler(context));

  amqp.handle("addons/get", getAddonsHandler(context));
  amqp.handle("addons/get-by-id", getAddonByIdHandler(context));
  amqp.handle("addons/get-readme", getAddonReadMeByIdHandler(context));
  amqp.handle("addons/get-by-user", getAddonsByUserIdHandler(context));

  return amqp;
}

/**
 * Builds the app by using the express and AMQP builder functions.
 *
 * @param   context The context object to use.
 *
 * @returns         An App instance.
 */
export async function buildApp(context: Context): Promise<App> {
  const express = buildExpress(context);
  const amqp = await buildAmqp(context);

  return new App(express, amqp);
}
