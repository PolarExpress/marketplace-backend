/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Context } from "../context";
import { Addon, AddonCategory } from "@prisma/client";
import { join } from "node:path";
import { z } from "zod";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

interface GetAddonsRequest {
  page: number;
  category?: AddonCategory;
}

const getAddonsSchema = z.object({
  page: z.coerce.number().int().gte(0).default(0),
  category: z.nativeEnum(AddonCategory).optional()
});

interface GetAddonsResponse {
  addons: Addon[];
}

export const getAddonsHandler =
  (ctx: Context) =>
  async (req: GetAddonsRequest): Promise<GetAddonsResponse> => {
    const { page, category } = getAddonsSchema.parse(req);

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

    return { addons };
  };

////////////////////////////////////////////////////////////////////////////////

interface GetAddonByIdRequest {
  id: string;
}

const getAddonByIdSchema = z.object({
  id: z.string()
});

interface GetAddonByIdResponse {
  addon: Addon;
}

export const getAddonByIdHandler =
  (ctx: Context) =>
  async (req: GetAddonByIdRequest): Promise<GetAddonByIdResponse> => {
    getAddonByIdSchema.parse(req);

    const addon = await ctx.prisma.addon.findUnique({
      where: {
        id: req.id
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
      throw new Error("Addon not found");
    }

    return { addon };
  };

////////////////////////////////////////////////////////////////////////////////

interface GetAddonReadMeByIdRequest {
  id: string;
}

const getAddonReadMeByIdSchema = z.object({
  id: z.string()
});

interface GetAddonReadMeByIdResponse {
  readme: string;
}

export const getAddonReadMeByIdHandler =
  (ctx: Context) =>
  async (
    req: GetAddonReadMeByIdRequest
  ): Promise<GetAddonReadMeByIdResponse> => {
    getAddonReadMeByIdSchema.parse(req);

    try {
      const data = await ctx.fs.readFile(
        join(__dirname, "../../", "data", req.id, "README.md")
      );
      return { readme: data.toString() };
    } catch {
      throw new Error("Could not load addon data from file store");
    }
  };

////////////////////////////////////////////////////////////////////////////////
