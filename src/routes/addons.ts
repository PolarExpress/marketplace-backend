/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Context } from "../context";
import { AddonCategory } from "@prisma/client";
import { join } from "node:path";
import { z } from "zod";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

const getAddonsSchema = z.object({
  page: z.coerce.number().int().gte(0).default(0),
  category: z.nativeEnum(AddonCategory).optional()
});

export const getAddonsHandler =
  (ctx: Context) => async (req: object): Promise<object> => {
    const args = getAddonsSchema.parse(req);

    const addons = await ctx.prisma.addon.findMany({
      skip: args.page * pageSize,
      take: pageSize,
      where: {
        category: args.category ?? undefined
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


const getAddonByIdSchema = z.object({
  id: z.string()
});


export const getAddonByIdHandler =
  (ctx: Context) => async (req: object): Promise<object> => {
    const args = getAddonByIdSchema.parse(req);

    const addon = await ctx.prisma.addon.findUnique({
      where: {
        id: args.id
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


const getAddonReadMeByIdSchema = z.object({
  id: z.string()
});

export const getAddonReadMeByIdHandler =
  (ctx: Context) => async (req: object): Promise<object> => {
    const args = getAddonReadMeByIdSchema.parse(req);

    try {
      const data = await ctx.fs.readFile(
        join(__dirname, "../../", "data", args.id, "README.md")
      );
      return { readme: data.toString() };
    } catch {
      throw new Error("Could not load addon data from file store");
    }
  };

////////////////////////////////////////////////////////////////////////////////
