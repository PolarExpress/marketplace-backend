/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Context } from "../context";
import { SessionData } from "../types";
import { z } from "zod";

////////////////////////////////////////////////////////////////////////////////

interface InstallRequest {    
  addonID: string;
}

const installSchema = z.object({
  addonID: z.string()
});

interface InstallResponseData {}

export const installHandler =
  (ctx: Context) =>
  async (req: InstallRequest, session: SessionData): Promise<InstallResponseData> => {    
    installSchema.parse(req);
    
    // Find the user by id. If the user is not found, throw an error.
    const user = await ctx.prisma.user.findUnique({
      where: { id: session.userID },
      include: { installedAddons: true }
    });

    if (!user) {
      throw new Error(`User "${session.userID}" not found`);
    }

    // Find the addon by id. If the addon is not found, throw an error.
    const addon = await ctx.prisma.addon.findUnique({
      where: { id: req.addonID }
    });

    if (!addon) {
      throw new Error(`Addon "${req.addonID}" not found`);
    }

    // Check if user actually has the addon installed
    if (user.installedAddons.some(a => a.id === addon.id)) {
      throw new Error(
        `User "${user.id}" does not have addon "${addon.id}" installed`
      );
    }

    // Add relation between user and addon
    return await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        installedAddons: {
          connect: { id: addon.id }
        }
      }
    });
  };

////////////////////////////////////////////////////////////////////////////////

interface UninstallRequest {    
  addonID: string;
}

export const uninstallSchema = z.object({
  addonID: z.string()
});

interface UninstallResponse {}

export const uninstallHandler =
  (ctx: Context) =>
  async (req: UninstallRequest, session: SessionData): Promise<UninstallResponse> => {    
    uninstallSchema.parse(req);

    // Find the user by id. If the user is not found, throw an error.
    const user = await ctx.prisma.user.findUnique({
      where: { id: session.userID },
      include: { installedAddons: true }
    });

    if (!user) {
      throw new Error(`User "${session.userID}" not found`);
    }

    // Find the addon by id. If the addon is not found, throw an error.
    const addon = await ctx.prisma.addon.findUnique({
      where: { id: req.addonID }
    });

    if (!addon) {
      throw new Error(`Addon "${req.addonID}" not found`);
    }

    // Check if user actually has the addon installed
    if (!user.installedAddons.some(a => a.id === addon.id)) {
      throw new Error(
        `User "${user.id}" does not have addon "${addon.id}" installed`
      );
    }

    // Remove relation between user and addon
    return await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        installedAddons: {
          disconnect: { id: addon.id }
        }
      }
    });
  };

////////////////////////////////////////////////////////////////////////////////