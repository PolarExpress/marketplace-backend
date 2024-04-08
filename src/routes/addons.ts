/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { ObjectId, Filter } from "mongodb";
import { join } from "node:path";
import { z } from "zod";

import { Context } from "../context";
import { Addon, AddonCategory, SessionData } from "../types";
import { throwFn } from "../utils";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

const getAddonsSchema = z.object({
  page: z.coerce.number().int().gte(0).default(0),
  category: z.nativeEnum(AddonCategory).optional()
});

export const getAddonsHandler =
  (ctx: Context) =>
  async (req: object): Promise<object> => {
    const args = getAddonsSchema.parse(req);

    const addons = await ctx.addons
      .find(args.category ? { category: args.category } : {})
      .skip(args.page * pageSize)
      .limit(pageSize)
      .toArray();

    const joined_addons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await ctx.authors.findOne({ _id: new ObjectId(addon.authorId) })) ??
          throwFn(new Error("Could not find the addon's author"));
        return { ...addon, author };
      })
    );

    return { addons: joined_addons };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonByIdSchema = z.object({
  id: z.string()
});

export const getAddonByIdHandler =
  (ctx: Context) =>
  async (req: object): Promise<object> => {
    const args = getAddonByIdSchema.parse(req);

    const addon =
      (await ctx.addons.findOne({ _id: new ObjectId(args.id) })) ??
      throwFn(new Error("Could not find the addon with given id"));

    const author =
      (await ctx.authors.findOne({ _id: new ObjectId(addon.authorId) })) ??
      throwFn(new Error("Could nnot find  the addon's author"));

    return { addon: { ...addon, author } };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonReadMeByIdSchema = z.object({
  id: z.string()
});

export const getAddonReadMeByIdHandler =
  (ctx: Context) =>
  async (req: object): Promise<object> => {
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

const getAddonsByUserIdSchema = z.object({
  page: z.coerce.number().int().gte(0).default(0),
  category: z.nativeEnum(AddonCategory).optional()
});

interface AddonQueryFilter extends Filter<Addon> {
  _id: { $in: ObjectId[] };
  category?: AddonCategory;
}

export const getAddonsByUserIdHandler =
  (ctx: Context) =>
  async (req: object, session: SessionData): Promise<object> => {
    const args = getAddonsByUserIdSchema.parse(req);

    let user = await ctx.users.findOne({ userId: session.userID });

    // If the user does not exist, create a new user and insert it into the database
    if (!user) {
      const newUser = {
        userId: session.userID,
        installedAddons: []
      };

      await ctx.users.insertOne(newUser);
      user = await ctx.users.findOne({ userId: session.userID });

      if (!user) {
        throw new Error("Failed to create and retrieve new user");
      }
    }
    const queryFilter: AddonQueryFilter = {
      _id: { $in: user.installedAddons.map(id => new ObjectId(id)) }
    };

    if (args.category) {
      queryFilter.category = args.category;
    }

    const addons = await ctx.addons
      .find(queryFilter)
      .skip(args.page * pageSize)
      .limit(pageSize)
      .toArray();

    const joined_addons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await ctx.authors.findOne({ _id: new ObjectId(addon.authorId) })) ??
          throwFn(new Error("Could not find the addon's author"));
        return { ...addon, author };
      })
    );

    return { addons: joined_addons };
  };
