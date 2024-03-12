/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Request, Response } from "express";
import { Context } from "../context";
import { AddonCategory } from "prisma/prisma-client";

interface GetAddonsRequest extends Request {
  // use this to get typed access to request data (e.g. body, query, ...)
  // see install.ts for an example

  query: {
    page?: string;
    category?: string;
  };
}

export const getAddonsRoute =
  (ctx: Context) => async (req: GetAddonsRequest, res: Response) => {
    // implement the route here
    // - use ctx.prisma to access your database
    // - use res.status and res.json to send a response

    const pageSize = 20;

    // Extract page and category from the request body
    const { page, category } = req.query;
    const pageNumber = page ? parseInt(page, 10) : 1;
    const categoryEnum = category ? (category as AddonCategory) : undefined;

    if (!page && !category) {
      // Neither page nor category is provided
      const addons = await ctx.prisma.addon.findMany();
      res.status(200).json(addons);
    } else if (page && !category) {
      // Only page is provided
      const addons = await ctx.prisma.addon.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize
      });
      res.status(200).json(addons);
    } else if (!page && category) {
      // Only category is provided
      const addons = await ctx.prisma.addon.findMany({
        where: {
          category: categoryEnum
        }
      });
      res.status(200).json(addons);
    } else if (page && category) {
      // Both page and category are provided
      const addons = await ctx.prisma.addon.findMany({
        where: {
          category: categoryEnum
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize
      });
      res.status(200).json(addons);
    }
  };
