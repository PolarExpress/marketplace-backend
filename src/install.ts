/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Request, Response } from "express";
import { throwFn } from "./utils";
import { Context } from "./context";

interface InstallRequest extends Request {
  body: {
    userId: string;
    addonId: string;
  };
}

export const installRoute =
  (ctx: Context) => async (req: InstallRequest, res: Response) => {
    const { userId, addonId } = req.body;

    const user =
      (await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: { installedAddons: true }
      })) ?? throwFn(new Error(`User "${userId}" not found`));

    const addon =
      (await ctx.prisma.addon.findUnique({
        where: { id: addonId }
      })) ?? throwFn(new Error(`Addon "${addonId}" not found`));

    // check if user doesn't already have the addon installed
    if (user.installedAddons.some(a => a.id === addon.id)) {
      throw new Error(
        `User "${user.id}" already has addon "${addon.id}" installed`
      );
    }
    // add relation between user and addon
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
