import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { enhance } from "@zenstackhq/runtime";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { getSessionUser } from "./auth";

export type Context = {
  prismaRaw: PrismaClient;
  prisma: PrismaClient;
};

export type MockContext = {
  prismaRaw: DeepMockProxy<PrismaClient>;
  prisma: DeepMockProxy<PrismaClient>;
};

export function createContext(req: Request): Context {
  const prisma = new PrismaClient();
  req.ctx = {
    prismaRaw: prisma,
    prisma: enhance(prisma, { user: getSessionUser(req) })
  };
  return req.ctx;
}

export const createMockContext = (
  userId?: string
): [MockContext, (req: Request) => Context] => {
  const prismaRaw = mockDeep<PrismaClient>();
  const prisma =
    userId === undefined
      ? prismaRaw
      : enhance(prismaRaw, { user: { id: userId } });

  const context = { prismaRaw, prisma };
  return [context, (_: Request) => context];
};
