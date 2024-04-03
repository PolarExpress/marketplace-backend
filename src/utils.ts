/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { NextFunction, Request, Response } from "express";
import { Handler, SessionData } from "./types";
import { Addon, AddonCategory, User } from "@prisma/client";

// type hack to allow express-validator to sanitize query parameters
declare module "express" {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any;
  }
}

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

/**
 * Throws a `PanicError` with the given message.
 *
 * @param message - The message to include in the error.
 */
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
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const expressHandler =
  (handler: Handler) => (req: Request, res: Response, next: NextFunction) =>
    handler(req.body)
      .then(result => res.status(200).json(result))
      .catch(error => next(error));

////////////////////////////////////////////////////////////////////////////////
// Test utils
////////////////////////////////////////////////////////////////////////////////

/**
 * @returns A SessionData object to use while testing
 */
export const mockSession = (): SessionData => {
  return {
    username: "username",
    userID: "userID",
    impersonateID: "impersonateID",
    sessionID: "sessionID",
    saveStateID: "saveStateID",
    roomID: "roomID",
    jwt: "jwt"
  };
};

/**
 * @returns A User object with the given id and an empty name and email
 */
export const dummyUser = (id: string): User => ({
  id,
  name: "",
  email: ""
});

/**
 * @returns An Addon object with the given id, category (defaults to DATA_SOURCE) and authorId (defaults to empty string)
 */
export const dummyAddon = (
  id: string,
  category: AddonCategory = AddonCategory.DATA_SOURCE,
  authorId: string = ""
): Addon => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category,
  authorId
});
