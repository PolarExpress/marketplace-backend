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
import { AddonNotFoundError, AuthorNotFoundError } from "../errors";
import { Addon, AddonCategory } from "../types";
import { throwFunction } from "../utils";

// TODO: move this to a better place
const pageSize = 20;

////////////////////////////////////////////////////////////////////////////////

const getAddonsSchema = z.object({
  /**
   * Optional category filter.
   */
  category: z.nativeEnum(AddonCategory).optional(),
  /**
   * Page number requested.
   */
  page: z.coerce.number().int().gte(0).default(0),
  /**
   * Search term submitted.
   */
  searchTerm: z.string().default("")
});

/**
 * Handler to get a paginated list of addons with optional filtering by category
 * and search term.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const getAddonsHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonsSchema.parse(request);

    // Create query filter based on search term and optional category
    const queryFilter: Filter<Addon> = {
      name: { $options: "i", $regex: arguments_.searchTerm }
    };

    if (arguments_.category) {
      queryFilter.category = arguments_.category;
    }

    // Pagination logic
    const totalCount = await context.addons.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalCount / pageSize);

    const addons = await context.addons
      .find(queryFilter)
      .skip(arguments_.page * pageSize)
      .limit(pageSize)
      .toArray();

    // Join each addon with its corresponding author
    const joinedAddons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await context.authors.findOne({
            _id: new ObjectId(addon.authorId)
          })) ?? throwFunction(new AuthorNotFoundError(addon.authorId));

        return { ...addon, author };
      })
    );

    return { addons: joinedAddons, totalPages };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonByIdSchema = z.object({
  /**
   * Id of the requested addon.
   */
  id: z.string()
});

/**
 * Handler to get a specific addon by its ID.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const getAddonByIdHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonByIdSchema.parse(request);

    // Find the addon by its ID
    const addon =
      (await context.addons.findOne({
        _id: new ObjectId(arguments_.id)
      })) ?? throwFunction(new AddonNotFoundError(arguments_.id));

    // Find the author of the addon
    const author =
      (await context.authors.findOne({
        _id: new ObjectId(addon.authorId)
      })) ?? throwFunction(new AuthorNotFoundError(addon.authorId));

    return { addon: { ...addon, author } };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonReadMeByIdSchema = z.object({
  /**
   * Id of the addon of the requested ReadMe.
   */
  id: z.string()
});

/**
 * Handler to get the README content of a specific addon by its ID.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const getAddonReadMeByIdHandler =
  (context: Context) =>
  async (request: object): Promise<object> => {
    const arguments_ = getAddonReadMeByIdSchema.parse(request);

    // Read README file from MinIO storage
    const buffer = await context.minio.readFile(
      context.minio.addonBucket,
      `${arguments_.id}/README.md`
    );
    return { readme: buffer.toString() };
  };

////////////////////////////////////////////////////////////////////////////////

const getAddonsByUserIdSchema = z.object({
  /**
   * Optional category filter.
   */
  category: z.nativeEnum(AddonCategory).optional(),
  /**
   * Page number requested.
   */
  page: z.coerce.number().int().gte(0).default(0)
});

/**
 * Interface representing the query filter used to find addons by user ID.
 */
interface AddonQueryFilter extends Filter<Addon> {
  /**
   * Array of addon IDs to filter by.
   */
  _id: { $in: ObjectId[] };
  /**
   * Optional category to filter by.
   */
  category?: AddonCategory;
}

/**
 * Handler to get a paginated list of addons installed by a specific user, with
 * optional filtering by category.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const getAddonsByUserIdHandler =
  (context: Context) =>
  async (request: object, session: SessionData): Promise<object> => {
    const arguments_ = getAddonsByUserIdSchema.parse(request);

    // Find or create the user document
    let user = await context.users.findOne({ userId: session.userID });
    if (!user) {
      const document = {
        installedAddons: [],
        userId: session.userID
      };
      const { insertedId } = await context.users.insertOne(document);
      user = { ...document, _id: insertedId };
    }

    // Create query filter for addons by installed addons and optional category
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

    // Join each addon with its corresponding author
    const joinedAddons = await Promise.all(
      addons.map(async addon => {
        const author =
          (await context.authors.findOne({
            _id: new ObjectId(addon.authorId)
          })) ?? throwFunction(new AuthorNotFoundError(addon.authorId));

        return { ...addon, author };
      })
    );

    return { addons: joinedAddons };
  };

////////////////////////////////////////////////////////////////////////////////
