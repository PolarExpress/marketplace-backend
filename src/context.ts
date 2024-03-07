/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

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
