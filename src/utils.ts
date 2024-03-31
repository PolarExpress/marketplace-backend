/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { NextFunction, Request, Response } from "express";

// type hack to allow express-validator to sanitize query parameters
declare module "express" {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any;
  }
}

type EndpointFn = (req: Request, res: Response) => Promise<void>;

/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 */
export const throwFn = (e: Error): never => {
  throw e;
};

export class PanicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PanicError";
  }
}

export const panic = (message: string): never => {
  throw new PanicError(message);
};

/**
 * Wraps an asynchronous endpoint function with error handling.
 * Any errors thrown by the endpoint function will be passed to the `next` function.
 *
 * @param fn - The asynchronous endpoint function to wrap.
 * @returns A middleware function that handles errors thrown by the endpoint function.
 */
export const asyncCatch =
  (fn: EndpointFn) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);
