/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { RoutingKeyStore, createRoutingKeyStore } from "./routingKeyStore";
import amqp from "amqplib";
import { panic } from "./utils";
import "dotenv/config";

import {
  AmqpRequest,
  AmqpResponse,
  Handler,
  RequestData,
  ResponseData
} from "./types";

/**
 * Configuration for the AMQP socket
 */
const amqpConfig = {
  queue: {
    request: "mp-backend-request-queue"
  },
  exchange: {
    request: "requests-exchange",
    response: "ui-direct-exchange"
  },
  routingKey: {
    request: "mp-backend-request"
  }
};

/**
 * Creates an AMQP socket
 * @param routingKeyStore The routing-key store to use
 * @returns The created AMQP socket
 */
export async function createAmqpSocket(routingKeyStore: RoutingKeyStore) {
  const opt = {
    credentials: amqp.credentials.plain(
      process.env.RABBIT_USER ?? panic("RABBIT_USER not set"),
      process.env.RABBIT_PASSWORD ?? panic("RABBIT_PASSWORD not set")
    )
  };

  const host = process.env.RABBIT_HOST ?? panic("RABBIT_HOST not set");
  const port = process.env.RABBIT_PORT ?? panic("RABBIT_PORT not set");
  const connection = await amqp.connect(`amqp://${host}:${port}`, opt);

  const channel = await connection.createChannel();

  return new AmqpSocket(channel, routingKeyStore);
}

type AHandler = Handler<RequestData, ResponseData>;

/**
 * Context for publishing a message
 * @param routingKey The routing key to send the message to
 * @param callID The call ID of the message
 * @param headers The headers of the message
 */
interface PublishContext {
  routingKey: string;
  callID: string;
  headers: amqp.MessagePropertyHeaders | undefined;
}

export class AmqpSocket {
  private channel: amqp.Channel;
  private routingKeyStore: RoutingKeyStore;

  private handlers: Record<string, AHandler> = {};

  public constructor(channel: amqp.Channel, routingKeyStore: RoutingKeyStore) {
    this.routingKeyStore = routingKeyStore;
    this.channel = channel;

    this.channel.assertQueue(amqpConfig.queue.request);
    this.channel.assertExchange(amqpConfig.exchange.request, "direct");
    this.channel.bindQueue(
      amqpConfig.queue.request,
      amqpConfig.exchange.request,
      amqpConfig.routingKey.request
    );

    this.channel.assertExchange(amqpConfig.exchange.response, "direct");
  }

  /**
   * Registers a handler for a specific action
   * @param key The action to register the handler for
   * @param handler The handler to register
   */
  public handle(key: string, handler: AHandler) {
    this.handlers[key] = handler;
  }

  /**
   * Publishes a message to the frontend
   * @param context Publish context needed to send the message
   * @param response The response to send to the frontend
   * @param type The type of the message (used for type-based callbacks in the frontend)
   * @param status The status of the message (e.g. success, error, ...)
   */
  private publish(
    context: PublishContext,
    response: ResponseData,
    type: string,
    status: string
  ) {
    const responseMessage: AmqpResponse = {
      value: response,
      type: type,
      callID: context.callID,
      status: status
    };

    this.channel.publish(
      amqpConfig.exchange.response,
      context.routingKey,
      Buffer.from(JSON.stringify(responseMessage)),
      { headers: context.headers }
    );
  }

  /**
   * Publishes a success message to the frontend
   * @param context Publish context needed to send the message
   * @param response The response to send to the frontend
   */
  private publishSuccess(context: PublishContext, response: ResponseData) {
    this.publish(context, response, "mp_backend_result", "success");
  }

  /**
   * Publishes an error message to the frontend
   * @param context Publish context needed to send the message
   * @param error The error message to send to the frontend
   */
  private publishError(context: PublishContext, error: string) {
    this.publish(context, error, "mp_backend_error", "error");
  }

  /**
   * Start listening for messages.
   * This function will block the current thread.
   */
  public listen() {
    this.channel.consume(amqpConfig.queue.request, async message => {
      if (!message) {
        return;
      }
      this.channel.ack(message);

      const content = JSON.parse(message.content.toString()) as AmqpRequest;
      const body: RequestData = JSON.parse(content.fromFrontend.body);
      const sessionId = content.sessionData.sessionID;

      console.log("Received message:", content);

      const routingKey = await this.routingKeyStore.get(sessionId);

      console.log("Routing key:", routingKey);
      if (routingKey == null) {
        console.warn("Routing key not found, session is no longer alive");
        console.warn("Ignoring...");
        return;
      }

      const ctx: PublishContext = {
        routingKey: routingKey,
        callID: content.fromFrontend.callID,
        headers: message.properties.headers
      };

      if (body.action == null) {
        this.publishError(ctx, "No action specified");
        return;
      }

      if (!(body.action in this.handlers)) {
        this.publishError(ctx, `Action "${body.action}" doesn't exist`);
        return;
      }

      const handler = this.handlers[body.action];
      const response = await handler(content.sessionData, body);

      this.publishSuccess(ctx, response);
    });
  }
}

async function main() {
  const routingKeyStore = await createRoutingKeyStore();
  const socket = await createAmqpSocket(routingKeyStore);

  socket.handle("test", async () => {
    return { value: "It works!" };
  });
  socket.listen();
}

main();
