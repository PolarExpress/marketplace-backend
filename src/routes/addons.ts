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

// TODO: move this to a better place
const pageSize = 20;

/**
 * The request type for getting addons.
 */

interface GetAddonsRequest extends Request {
  query: {
    page: number;
    category?: AddonCategory;
  };
}

export const getAddonsRoute =
  (ctx: Context) => async (req: GetAddonsRequest, res: Response) => {
    const { page, category } = req.query;

    const addons = await ctx.prisma.addon.findMany({
      skip: page * pageSize,
      take: pageSize,
      where: {
        category: category ?? undefined
      }
    });
    res.status(200).json(addons);
  };
