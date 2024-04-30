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

/**
 * Context contains all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows us to easily mock these dependencies in
 * tests, and to easily switch out implementations.
 */
export interface Context {
  addons: Collection<Addon>;
  authors: Collection<Author>;
  minio: MinioService;
  users: Collection<User>;
}

export async function createContext(): Promise<Context> {
  const mongo = await MongoClient.connect(process.env.MONGO_URI!);

  const db = mongo.db(process.env.MP_DATABASE_NAME!);
  const addons = db.collection<Addon>("addons");
  const authors = db.collection<Author>("authors");
  const users = db.collection<User>("users");

  const minio = new MinioService();

  return { addons, authors, minio, users };
}
