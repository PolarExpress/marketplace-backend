/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { MongoClient, Collection } from "mongodb";
import fs from "fs/promises";

import { Addon, Author, User } from "./types";

/**
 * Context contains all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows us to easily mock these dependencies in
 * tests, and to easily switch out implementations.
 */
export interface Context {
  addons: Collection<Addon>;
  authors: Collection<Author>;
  users: Collection<User>;
  fs: typeof fs;
}

export async function createContext(): Promise<Context> {
  const mongo = await MongoClient.connect(process.env.DATABASE_URL!);

  const db = mongo.db(process.env.DATABASE_NAME!);
  const addons = db.collection<Addon>("addons");
  const authors = db.collection<Author>("authors");
  const users = db.collection<User>("users");

  return { addons, authors, users, fs };
}
