/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Collection, MongoClient, MongoError } from "mongodb";

import environment from "./environment";
import { DatabaseError } from "./errors";
import { MinioService } from "./minio";
import { Addon, Author, User } from "./types";
import { ensureCustomError } from "./utils";

/**
 * Context containing all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows for easy mocking of these dependencies in
 * tests and switching out implementations.
 */
export interface Context {
  addons: Collection<Addon>;
  authors: Collection<Author>;
  minio: MinioService;
  users: Collection<User>;
}

/**
 * Creates a context with the mongodb collections and MinIO service.
 *
 * @returns A context object.
 */
export async function createContext(): Promise<Context> {
  try {
    const mongo = await MongoClient.connect(environment.MONGO_URI);

    const database = mongo.db(environment.MP_DATABASE_NAME);
    const addons = database.collection<Addon>("addons");
    const authors = database.collection<Author>("authors");
    const users = database.collection<User>("users");

    const minio = new MinioService();

    return { addons, authors, minio, users };
  } catch (error) {
    throw error instanceof MongoError
      ? new DatabaseError(`Failed to connect to MongoDB: ${error.message}`)
      : ensureCustomError(error);
  }
}
