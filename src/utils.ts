/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { NextFunction, Request, Response } from "express";
import { Handler } from "ts-amqp-socket";

// type hack to allow express-validator to sanitize query parameters
declare module "express" {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any;
  }
}

/**
 * `throw` wrapped in a function, so it can be used in null coalescing
 * statements.
 *
 * @param e - The error that is thrown.
 */
export const throwFunction = (error: Error): never => {
  throw error;
};

export class PanicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PanicError";
  }
}

/**
 * Throws a `PanicError` with the given message.
 *
 * @param message - The message to include in the error.
 */
export const panic = (message: string): never => {
  throw new PanicError(message);
};

/**
 * Wraps an asynchronous endpoint function with error handling. Any errors
 * thrown by the endpoint function will be passed to the `next` function.
 *
 * @param   fn - The asynchronous endpoint function to wrap.
 *
 * @returns    A middleware function that handles errors thrown by the endpoint
 *   function.
 */
export const asyncCatch =
  (function_: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction) =>
    function_(request, response).catch(next);

export const expressHandler =
  (handler: Handler) =>
  (request: Request, response: Response, next: NextFunction) =>
    handler(request.body)
      .then(result => response.status(200).json(result))
      .catch(error => next(error));
