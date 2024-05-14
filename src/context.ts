/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Collection, MongoClient } from "mongodb";

import { MinioService } from "./minio";
import { Addon, Author, User } from "./types";
import { panic } from "./utils";

/**
 * Context containing all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows for easy mocking of these dependencies in
 * tests, and switching out implementations.
 */
export interface Context {
  addons: Collection<Addon>;
  authors: Collection<Author>;
  minio: MinioService;
  users: Collection<User>;
}

/**
 * Creates a context with a mongodb database and its collections, and minIO
 * services.
 *
 * @returns A context object.
 */
export async function createContext(): Promise<Context> {
  if (!(process.env.MONGO_URI && process.env.MP_DATABASE_NAME)) {
    panic("No MongoDB environment variable set, context creation failed.");
  }

  const mongo = await MongoClient.connect(process.env.MONGO_URI!);

  const database = mongo.db(process.env.MP_DATABASE_NAME!);
  const addons = database.collection<Addon>("addons");
  const authors = database.collection<Author>("authors");
  const users = database.collection<User>("users");

  const minio = new MinioService();

  return { addons, authors, minio, users };
}
