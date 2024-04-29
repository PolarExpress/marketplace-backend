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

export const dummyAuthors: WithId<Author>[] = [
  { userId: "1" },
  { userId: "2" }
].map(author => ({ _id: new ObjectId(), ...author }));

export const dummyAddons: WithId<Addon>[] = [
  {
    authorId: dummyAuthors[0]._id.toString(),
    category: AddonCategory.VISUALISATION,
    icon: "icon.png",
    name: "Addon A",
    summary: "This is A"
  },
  {
    authorId: dummyAuthors[0]._id.toString(),
    category: AddonCategory.MACHINE_LEARNING,
    icon: "icon.png",
    name: "Addon B",
    summary: "This is B"
  },
  {
    authorId: dummyAuthors[1]._id.toString(),
    category: AddonCategory.DATA_SOURCE,
    icon: "icon.png",
    name: "Addon C",
    summary: "This is C"
  }
].map(addon => ({ _id: new ObjectId(), ...addon }));

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

let mongo: MongoMemoryServer, connection: MongoClient, db: Db;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  connection = await MongoClient.connect(mongo.getUri());
  db = connection.db("test");

  const addons = db.collection("addons");
  const authors = db.collection("authors");
  const users = db.collection("users");

  await addons.deleteMany();
  await authors.deleteMany();
  await users.deleteMany();

  await addons.insertMany(dummyAddons);
  await authors.insertMany(dummyAuthors);
  await users.insertMany(dummyUsers);
});

afterAll(async () => {
  await connection.close();
  await mongo.stop();
});

export type MockContext = {
  minio: DeepMockProxy<MinioService>;
} & Context;

export function createMockContext(): [MockContext, Context] {
  const context = {
    addons: db.collection<Addon>("addons"),
    authors: db.collection<Author>("authors"),
    minio: mockDeep<MinioService>(),
    users: db.collection<User>("users")
  };
  return [context, context];
}

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
