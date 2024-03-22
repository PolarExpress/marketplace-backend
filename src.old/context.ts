/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
/**
 * Context contains all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows us to easily mock these dependencies in
 * tests, and to easily switch out implementations.
 */
export type Context = {
  prisma: PrismaClient;
  fs: typeof fs;
};

export const createContext = (): Context => {
  return {
    prisma: new PrismaClient(),
    fs: fs
  };
};
