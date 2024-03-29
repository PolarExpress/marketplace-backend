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
import { join } from "node:path";

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
      },
      include: {
        author: {
          include: {
            user: true
          }
        }
      }
    });
    res.status(200).json(addons);
  };

interface GetAddonByIdRequest extends Request {}

export const getAddonByIdRoute =
  (ctx: Context) => async (req: GetAddonByIdRequest, res: Response) => {
    const { id } = req.params;
    const addon = await ctx.prisma.addon.findUnique({
      where: {
        id
      },
      include: {
        author: {
          include: {
            user: true
          }
        }
      }
    });

    if (addon === null) {
      res.status(404).json({ error: "Addon not found" });
    } else {
      res.status(200).json(addon);
    }
  };

export const getAddonReadMeByIdRoute =
  (ctx: Context) => async (req: GetAddonByIdRequest, res: Response) => {
    const { id } = req.params;
    try {
      const data = await ctx.fs.readFile(
        join(__dirname, "../../", "data", id, "README.md")
      );
      res.status(200).send(data);
    } catch {
      res
        .status(400)
        .json({ error: "Could not load addon data from file store" });
    }
  };
