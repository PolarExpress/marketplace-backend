import { PrismaClient } from "@prisma/client";
/**
 * Context contains all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows us to easily mock these dependencies in
 * tests, and to easily switch out implementations.
 */
export type Context = {
    prisma: PrismaClient;
};
export declare const createContext: () => Context;
