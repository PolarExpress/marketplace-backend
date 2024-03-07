import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";

import { mockDeep, DeepMockProxy } from "jest-mock-extended";

export type Context = {
  prisma: PrismaClient;
  prismaEnhanced: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
  prismaEnhanced: DeepMockProxy<PrismaClient>;
};

export function createMockContext(userId?: string): [Context, MockContext] {
  const prisma = mockDeep<PrismaClient>();
  const prismaEnhanced =
    userId === undefined ? prisma : enhance(prisma, { user: { id: userId } });

  const context = { prisma, prismaEnhanced };
  return [context, context];
}
