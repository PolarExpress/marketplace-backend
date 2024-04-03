/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { MongoClient, Collection } from "mongodb";
import fs from "fs/promises";

import { Author, Addon } from "./types";

/**
 * Context contains all the dependencies that are required by the resolvers
 * (e.g. PrismaClient). This allows us to easily mock these dependencies in
 * tests, and to easily switch out implementations.
 */
export interface Context {
  addons: Collection<Addon>;
  authors: Collection<Author>;
  fs: typeof fs;
}

export async function createContext(): Promise<Context> {
  const mongo = new MongoClient(process.env.DATABASE_URL!);
  await mongo.connect();

  const db = mongo.db("marketplace");
  const addons = db.collection<Addon>("addons");
  const authors = db.collection<Author>("authors");

  return { addons, authors, fs };
}
