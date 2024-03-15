import { PrismaClient } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { Context } from "../src/context";
export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};
export declare const createMockContext: () => [MockContext, Context];
