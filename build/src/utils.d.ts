import { NextFunction, Request, Response } from "express";
type EndpointFn = (req: Request, res: Response) => Promise<void>;
/**
 * `throw` wrapped in a function, so we can use it in null coalescing statements.
 */
export declare const throwFn: (e: Error) => never;
/**
 * Wraps an asynchronous endpoint function with error handling.
 * Any errors thrown by the endpoint function will be passed to the `next` function.
 *
 * @param fn - The asynchronous endpoint function to wrap.
 * @returns A middleware function that handles errors thrown by the endpoint function.
 */
export declare const asyncCatch: (
  fn: EndpointFn
) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
