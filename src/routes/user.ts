import { Request, Response } from "express";
import { Context } from "../context";

/**
 
 */

interface GetUserRequest extends Request {}

export const getUserByIdRoute =
  (ctx: Context) => async (req: GetUserRequest, res: Response) => {
    const { id } = req.params;
    const user = await ctx.prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      res.status(404).json({ error: `User "${id}" not found` });
      return;
    }
    res.status(200).json(user);
  };
