/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { ObjectId, WithId } from "mongodb";
import { SessionData } from "ts-amqp-socket";
import { z } from "zod";

import { Context } from "../context";
import { User } from "../types";
import { throwFunction } from "../utils";

////////////////////////////////////////////////////////////////////////////////

const installSchema = z.object({
  addonID: z.string()
});

/**
 * Handler to install an addon for a user. If the user does not exist, it
 * creates a new user.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const installHandler =
  (context: Context) => async (request: object, session: SessionData) => {
    const arguments_ = installSchema.parse(request);

    // Find or create the user document
    let user = await context.users.findOne({ userId: session.userID });
    if (!user) {
      const insertedUser = await context.users.insertOne({
        installedAddons: [],
        userId: session.userID
      });
      user = (await context.users.findOne({
        _id: insertedUser.insertedId
      })) as WithId<User>;
    }

    // Ensure the addon exists
    const addon =
      (await context.addons.findOne({
        _id: new ObjectId(arguments_.addonID)
      })) ?? throwFunction(new Error("Could not find an addon with given id"));

    // Check if the addon is already installed
    if (
      user.installedAddons.some(installedAddon =>
        addon._id.equals(installedAddon)
      )
    ) {
      throw new Error(
        `User "${session.userID}" already has addon "${addon._id}" installed`
      );
    }

    // Update the user's installed addons
    const updatedInstalledAddons = [
      ...user.installedAddons,
      arguments_.addonID
    ];
    await context.users.updateOne(
      { userId: session.userID },
      { $set: { installedAddons: updatedInstalledAddons } }
    );
  };

////////////////////////////////////////////////////////////////////////////////

const uninstallSchema = z.object({
  addonID: z.string()
});

/**
 * Handler to uninstall an addon for a user.
 *
 * @param   context The context object containing database collections and the
 *   MinIO service.
 *
 * @returns         The handler function to process the request.
 */
export const uninstallHandler =
  (context: Context) => async (request: object, session: SessionData) => {
    const arguments_ = uninstallSchema.parse(request);

    // Find the user document
    const user =
      (await context.users.findOne({ userId: session.userID })) ??
      throwFunction(new Error("Could not find the user in the session"));

    // Ensure the addon exists
    const addon =
      (await context.addons.findOne({
        _id: new ObjectId(arguments_.addonID)
      })) ?? throwFunction(new Error("Could not find an addon with given id"));

    // Check if the addon is installed
    if (
      !user.installedAddons.some(installedAddon =>
        addon._id.equals(installedAddon)
      )
    ) {
      throw new Error(
        `User "${session.userID}" does not have addon "${arguments_.addonID}" installed`
      );
    }

    // Update the user's installed addons
    const updatedInstalledAddons = user.installedAddons.filter(
      addon => addon !== arguments_.addonID
    );
    await context.users.updateOne(
      { userId: session.userID },
      { $set: { installedAddons: updatedInstalledAddons } }
    );
  };

////////////////////////////////////////////////////////////////////////////////
