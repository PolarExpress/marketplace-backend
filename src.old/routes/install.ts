/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Request, Response } from "express";
import { Context } from "../context";

/**
 * The request type for the installation of an addon.
 */
interface InstallRequest extends Request {
  // The validation middleware will ensure that the body contains the required
  // fields, so we can safely assume that they are present and don't need to
  // mark them as optional.
  body: {
    userId: string;
    addonId: string;
  };
}

/**
 * Handles the installation of an addon for a user.
 *
 * @param ctx - The context instance.
 * @returns An async function that handles the installation request.
 */
export const installRoute =
  (ctx: Context) => async (req: InstallRequest, res: Response) => {
    const { userId, addonId } = req.body;

    // Find the user by id. If the user is not found, throw an error.
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { installedAddons: true }
    });

    if (!user) {
      res.status(400).json({ error: `User "${userId}" not found` });
      return;
    }

    // Find the addon by id. If the addon is not found, throw an error.
    const addon = await ctx.prisma.addon.findUnique({
      where: { id: addonId }
    });

    if (!addon) {
      res.status(400).json({ error: `Addon "${addonId}" not found` });
      return;
    }

    // Check if user actually has the addon installed
    if (user.installedAddons.some(a => a.id === addon.id)) {
      res.status(400).json({
        error: `User "${user.id}" does not have addon "${addon.id}" installed`
      });
      return;
    }

    // Add relation between user and addon
    res.json(
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          installedAddons: {
            connect: { id: addon.id }
          }
        }
      })
    );
  };

/**
 * Handles the uninstallation of an addon for a user.
 *
 * @param ctx - The context instance.
 * @returns An async function that handles the uninstallation route.
 */
export const uninstallRoute =
  (ctx: Context) => async (req: InstallRequest, res: Response) => {
    const { userId, addonId } = req.body;

    // Find the user by id. If the user is not found, throw an error.
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { installedAddons: true }
    });

    if (!user) {
      res.status(400).json({ error: `User "${userId}" not found` });
      return;
    }

    // Find the addon by id. If the addon is not found, throw an error.
    const addon = await ctx.prisma.addon.findUnique({
      where: { id: addonId }
    });

    if (!addon) {
      res.status(400).json({ error: `Addon "${addonId}" not found` });
      return;
    }

    // Check if user actually has the addon installed
    if (!user.installedAddons.some(a => a.id === addon.id)) {
      res.status(400).json({
        error: `User "${user.id}" does not have addon "${addon.id}" installed`
      });
      return;
    }

    // Remove relation between user and addon
    res.json(
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          installedAddons: {
            disconnect: { id: addon.id }
          }
        }
      })
    );
  };
