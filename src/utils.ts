/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { NextFunction, Request, Response } from "express";


declare module "express" {
  interface Request {
    query: any; // type hack to allow express-validator to sanitize query parameters
  }
}

type EndpointFn = (req: Request, res: Response) => Promise<void>;

/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 */
export const throwFn = (e: Error): never => {
  throw e;
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
