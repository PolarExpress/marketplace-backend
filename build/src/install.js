"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallRoute = exports.installRoute = void 0;
/**
 * Handles the installation of an addon for a user.
 *
 * @param ctx - The context instance.
 * @returns An async function that handles the installation request.
 */
const installRoute = ctx => (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { userId, addonId } = req.body;
    // Find the user by id. If the user is not found, throw an error.
    const user = yield ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { installedAddons: true }
    });
    if (!user) {
      res.status(400).json({ error: `User "${userId}" not found` });
      return;
    }
    // Find the addon by id. If the addon is not found, throw an error.
    const addon = yield ctx.prisma.addon.findUnique({
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
      yield ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          installedAddons: {
            connect: { id: addon.id }
          }
        }
      })
    );
  });
exports.installRoute = installRoute;
/**
 * Handles the uninstallation of an addon for a user.
 *
 * @param ctx - The context instance.
 * @returns An async function that handles the uninstallation route.
 */
const uninstallRoute = ctx => (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { userId, addonId } = req.body;
    // Find the user by id. If the user is not found, throw an error.
    const user = yield ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { installedAddons: true }
    });
    if (!user) {
      res.status(400).json({ error: `User "${userId}" not found` });
      return;
    }
    // Find the addon by id. If the addon is not found, throw an error.
    const addon = yield ctx.prisma.addon.findUnique({
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
      yield ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          installedAddons: {
            disconnect: { id: addon.id }
          }
        }
      })
    );
  });
exports.uninstallRoute = uninstallRoute;
