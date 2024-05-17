/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Filter, ObjectId } from "mongodb";
import { SessionData } from "ts-amqp-socket";
import { z } from "zod";

import { Context } from "../context";
import { Addon, AddonCategory } from "../types";
import { throwFunction } from "../utils";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

const getAddonsSchema = z.object({
  category: z.nativeEnum(AddonCategory).optional(),
  page: z.coerce.number().int().gte(0).default(0),
  searchTerm: z.string().default("")
});

export const getAddonsHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonsSchema.parse(request);

    const queryFilter: Filter<Addon> = {
      name: { $options: "i", $regex: arguments_.searchTerm }
    };

    if (arguments_.category) {
      queryFilter.category = arguments_.category;
    }

    const totalCount = await context.addons.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalCount / pageSize);

    const addons = await context.addons
      .find(queryFilter)
      .skip(arguments_.page * pageSize)
      .limit(pageSize)
      .toArray();

    const joinedAddons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await context.authors.findOne({
            _id: new ObjectId(addon.authorId)
          })) ?? throwFunction(new Error("Could not find the addon's author"));
        return { ...addon, author };
      })
    );

    return { addons: joinedAddons, totalPages };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonByIdSchema = z.object({
  id: z.string()
});

export const getAddonByIdHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonByIdSchema.parse(request);

    const addon =
      (await context.addons.findOne({ _id: new ObjectId(arguments_.id) })) ??
      throwFunction(new Error("Could not find the addon with given id"));

    const author =
      (await context.authors.findOne({ _id: new ObjectId(addon.authorId) })) ??
      throwFunction(new Error("Could nnot find  the addon's author"));

    return { addon: { ...addon, author } };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonReadMeByIdSchema = z.object({
  id: z.string()
});

export const getAddonReadMeByIdHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonReadMeByIdSchema.parse(request);

    try {
      const buffer = await context.minio.readFile(
        context.minio.addonBucket,
        `${arguments_.id}/README.md`
      );
      return { readme: buffer.toString() };
    } catch {
      throw new Error("Could not load addon data from file store");
    }
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonsByUserIdSchema = z.object({
  category: z.nativeEnum(AddonCategory).optional(),
  page: z.coerce.number().int().gte(0).default(0)
});

interface AddonQueryFilter extends Filter<Addon> {
  _id: { $in: ObjectId[] };
  category?: AddonCategory;
}

export const getAddonsByUserIdHandler =
  (context: Context) =>
  async (request: object, session: SessionData): Promise<object> => {
    const arguments_ = getAddonsByUserIdSchema.parse(request);

    let user = await context.users.findOne({ userId: session.userID });
    if (!user) {
      const document = {
        installedAddons: [],
        userId: session.userID
      };
      const { insertedId } = await context.users.insertOne(document);
      user = { ...document, _id: insertedId };
    }

    const queryFilter: AddonQueryFilter = {
      _id: { $in: user.installedAddons.map(id => new ObjectId(id)) }
    };

    if (arguments_.category) {
      queryFilter.category = arguments_.category;
    }

    const addons = await context.addons
      .find(queryFilter)
      .skip(arguments_.page * pageSize)
      .limit(pageSize)
      .toArray();

    const joinedAddons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await context.authors.findOne({
            _id: new ObjectId(addon.authorId)
          })) ?? throwFunction(new Error("Could not find the addon's author"));
        return { ...addon, author };
      })
    );

    return { addons: joinedAddons };
  };
