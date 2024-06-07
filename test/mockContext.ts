/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Db, MongoClient, ObjectId, WithId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Context } from "../src/context";
import { MinioService } from "../src/minio";
import { Addon, AddonCategory, Author, User } from "../src/types";

/**
 * List of 2 dummy authors for testing purposes.
 */
export const dummyAuthors: WithId<Author>[] = [
  { userId: "1" },
  { userId: "2" }
].map(author => ({ _id: new ObjectId(), ...author }));

/**
 * List of 3 dummy addons for testing purposes.
 */
export const dummyAddons: WithId<Addon>[] = [
  {
    authorId: dummyAuthors[0]._id.toString(),
    category: AddonCategory.VISUALISATION,
    isDefault: false,
    icon: "icon.png",
    name: "Addon A",
    summary: "This is A"
  },
  {
    authorId: dummyAuthors[0]._id.toString(),
    category: AddonCategory.MACHINE_LEARNING,
    isDefault: false,
    icon: "icon.png",
    name: "Addon B",
    summary: "This is B"
  },
  {
    authorId: dummyAuthors[1]._id.toString(),
    category: AddonCategory.DATA_SOURCE,
    isDefault: true,
    icon: "icon.png",
    name: "Addon C",
    summary: "This is C"
  }
].map(addon => ({ _id: new ObjectId(), ...addon }));

/**
 * List of 1 dummy user for testing purposes.
 */
export const dummyUsers: WithId<User>[] = [
  { installedAddons: [], userId: "1" },
  { installedAddons: [], userId: "2" },
  {
    installedAddons: [
      dummyAddons[0]._id.toString(),
      dummyAddons[2]._id.toString()
    ],
    userId: "3"
  }
].map(user => ({ _id: new ObjectId(), ...user }));

let mongo: MongoMemoryServer, connection: MongoClient, database: Db;

// Set up the in-memory MongoDB server and populate it with dummy data.
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  connection = await MongoClient.connect(mongo.getUri());
  database = connection.db("test");

  const addons = database.collection("addons");
  const authors = database.collection("authors");
  const users = database.collection("users");

  await addons.deleteMany();
  await authors.deleteMany();
  await users.deleteMany();

  await addons.insertMany(dummyAddons);
  await authors.insertMany(dummyAuthors);
  await users.insertMany(dummyUsers);
}, 20_000);

// Clean up the in-memory MongoDB server after all tests have run.
afterAll(async () => {
  await connection.close();
  await mongo.stop();
}, 10_000);

/**
 * Mock context type that extends the real context with mocked Minio service.
 */
export type MockContext = {
  minio: DeepMockProxy<MinioService>;
} & Context;

/**
 * Creates a mock context for testing.
 *
 * @returns The mock context and the real context.
 */
export function createMockContext(): [MockContext, Context] {
  const context = {
    addons: database.collection<Addon>("addons"),
    authors: database.collection<Author>("authors"),
    minio: mockDeep<MinioService>(),
    users: database.collection<User>("users")
  };
  return [context, context];
}

/**
 * Mocks a session for a given user ID.
 *
 * @param   userID The user ID to mock the session for.
 *
 * @returns        The mocked session object.
 */
export function mockSession(userID: string) {
  return {
    impersonateID: "impersonateID",
    jwt: "jwt",
    roomID: "roomID",
    saveStateID: "saveStateID",
    sessionID: "sessionID",
    userID,
    username: "username"
  };
}
