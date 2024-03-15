/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Context } from "../src/context";
import fs from 'fs/promises';

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
  fs: DeepMockProxy<typeof fs>;
};

export const createMockContext = (): [MockContext, Context] => {
  const context = {
    prisma: mockDeep<PrismaClient>(),
    fs: mockDeep<typeof fs>(),
  };
  return [context, context];
};
