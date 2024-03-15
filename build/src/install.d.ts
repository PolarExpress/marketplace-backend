import { Request, Response } from "express";
import { Context } from "./context";
/**
 * The request type for the installation of an addon.
 */
interface InstallRequest extends Request {
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
export declare const installRoute: (ctx: Context) => (req: InstallRequest, res: Response) => Promise<void>;
/**
 * Handles the uninstallation of an addon for a user.
 *
 * @param ctx - The context instance.
 * @returns An async function that handles the uninstallation route.
 */
export declare const uninstallRoute: (ctx: Context) => (req: InstallRequest, res: Response) => Promise<void>;
export {};
