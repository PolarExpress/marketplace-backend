/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Context } from "../context";
import { Addon, AddonCategory } from "prisma/prisma-client";
import { join } from "node:path";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

interface GetAddonsRequest {
  action: "get-addons";
  page: number;
  category?: AddonCategory;
}

interface GetAddonsResponse {
  addons: Addon[];
}

export const getAddonsHandler =
  (ctx: Context) =>
  async (req: GetAddonsRequest): Promise<GetAddonsResponse> => {
    const { page, category } = req;

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
  action: "get-addon-by-id";
  id: string;
}

interface GetAddonByIdResponse {
  addon: Addon;
}

export const getAddonByIdHandler =
  (ctx: Context) =>
  async (
    req: GetAddonByIdRequest
  ): Promise<GetAddonByIdResponse> => {
    const { id } = req;
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
      throw new Error("Addon not found");
    }

    return { addon };
  };

////////////////////////////////////////////////////////////////////////////////

interface GetAddonReadMeByIdRequest {
  action: "get-addon-readme-by-id";
  id: string;
}

interface GetAddonReadMeByIdResponse {
  readme: string;
}

export const getAddonReadMeByIdHandler =
  (ctx: Context) =>
  async (
    req: GetAddonReadMeByIdRequest
  ): Promise<GetAddonReadMeByIdResponse> => {
    const { id } = req;
    try {
      const data = await ctx.fs.readFile(
        join(__dirname, "../../", "data", id, "README.md")
      );
      return { readme: data.toString() };
    } catch {
      throw new Error("Could not load addon data from file store");
    }
  };

////////////////////////////////////////////////////////////////////////////////
