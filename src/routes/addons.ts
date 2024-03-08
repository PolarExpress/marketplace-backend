/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Request, Response } from "express";
import { Context } from "../context";

interface GetAddonsRequest extends Request {
  // use this to get typed access to request data (e.g. body, query, ...)
  // see install.ts for an example
}

export const getAddonsRoute =
  (ctx: Context) => async (req: GetAddonsRequest, res: Response) => {
    // implement the route here
    // - use ctx.prisma to access your database
    // - use res.status and res.json to send a response
  };
