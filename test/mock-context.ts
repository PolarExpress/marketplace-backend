import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Context } from "../src/context";

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): [MockContext, Context] => {
  const context = {
    prisma: mockDeep<PrismaClient>()
  };
  return [context, context];
};
