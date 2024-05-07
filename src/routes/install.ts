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

export const installHandler =
  (context: Context) => async (request: object, session: SessionData) => {
    const arguments_ = installSchema.parse(request);

    let user = await context.users.findOne({ userId: session.userID });
    if (!user) {
      const inserted_user = await context.users.insertOne({
        installedAddons: [],
        userId: session.userID
      });
      user = (await context.users.findOne({
        _id: inserted_user.insertedId
      })) as WithId<User>;
    }

    // Find the addon by id. If the addon is not found, throw an error.
    const addon =
      (await context.addons.findOne({
        _id: new ObjectId(arguments_.addonID)
      })) ?? throwFunction(new Error("Could not find an addon with given id"));

    // Check if user actually has the addon installed
    if (
      user.installedAddons.some(installedAddon =>
        addon._id.equals(installedAddon)
      )
    ) {
      throw new Error(
        `User "${session.userID}" already has addon "${addon._id}" installed`
      );
    }

    // Add relation between user and addon
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

export const uninstallHandler =
  (context: Context) => async (request: object, session: SessionData) => {
    const arguments_ = uninstallSchema.parse(request);

    // Find the user by id. If the user is not found, throw an error.
    const user =
      (await context.users.findOne({ userId: session.userID })) ??
      throwFunction(new Error("Could not find the user in the session"));

    // Find the addon by id. If the addon is not found, throw an error.
    const addon =
      (await context.addons.findOne({
        _id: new ObjectId(arguments_.addonID)
      })) ?? throwFunction(new Error("Could not find an addon with given id"));

    // Check if user actually has the addon installed
    if (
      !user.installedAddons.some(installedAddon =>
        addon._id.equals(installedAddon)
      )
    ) {
      throw new Error(
        `User "${session.userID}" does not have addon "${arguments_.addonID}" installed`
      );
    }

    // Remove relation between user and addon
    const updatedInstalledAddons = user.installedAddons.filter(
      addon => addon !== arguments_.addonID
    );
    await context.users.updateOne(
      { userId: session.userID },
      { $set: { installedAddons: updatedInstalledAddons } }
    );
  };

////////////////////////////////////////////////////////////////////////////////
