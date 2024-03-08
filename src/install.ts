import { Addon, User } from "@prisma/client";
import { Context } from "./context";
import { Request, Response } from "express";
import { throwFn } from "./utils";

interface InstallRequest extends Request {
  body: {
    userId?: string;
    addonId?: string;
  };
}

export async function installRoute(req: InstallRequest, res: Response) {
  const { userId, addonId } = req.body;

  if (userId === undefined || addonId === undefined) {
    throw new Error("userId and addonId are required");
  }

  const user =
    (await req.ctx!.prisma.user.findUnique({
      where: { id: userId },
      include: { installedAddons: true }
    })) ?? throwFn(new Error(`User "${userId}" not found`));

  const addon =
    (await req.ctx!.prisma.addon.findUnique({
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
    await req.ctx!.prisma.user.update({
      where: { id: user.id },
      data: {
        installedAddons: {
          connect: { id: addon.id }
        }
      }
    })
  );
}
