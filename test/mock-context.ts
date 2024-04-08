/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { DeepMockProxy, mockDeep } from "jest-mock-extended";

import { Context } from "../src/context";
import { Addon, AddonCategory, Author, User } from "../src/types";

import { MongoMemoryServer } from "mongodb-memory-server";
import { Db, MongoClient, ObjectId, WithId } from "mongodb";
import { AddonStorage } from "../src/addonStorage";

export const dummyAuthors: WithId<Author>[] = [
  { userId: "1" },
  { userId: "2" }
].map(author => ({ _id: new ObjectId(), ...author }));

export const dummyAddons: WithId<Addon>[] = [
  {
    name: "A",
    summary: "This is A",
    icon: "icon.png",
    category: AddonCategory.VISUALISATION,
    authorId: dummyAuthors[0]._id.toString()
  },
  {
    name: "B",
    summary: "This is B",
    icon: "icon.png",
    category: AddonCategory.MACHINE_LEARNING,
    authorId: dummyAuthors[0]._id.toString()
  },
  {
    name: "C",
    summary: "This is C",
    icon: "icon.png",
    category: AddonCategory.DATA_SOURCE,
    authorId: dummyAuthors[1]._id.toString()
  }
].map(addon => ({ _id: new ObjectId(), ...addon }));

export const dummyUsers: WithId<User>[] = [
  { userId: "1", installedAddons: [] },
  { userId: "2", installedAddons: [] },
  {
    userId: "3",
    installedAddons: [
      dummyAddons[0]._id.toString(),
      dummyAddons[2]._id.toString()
    ]
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

export type MockContext = Context & {
  addonStorage: DeepMockProxy<AddonStorage>;
};

export function createMockContext(): [MockContext, Context] {
  const context = {
    addons: db.collection<Addon>("addons"),
    authors: db.collection<Author>("authors"),
    users: db.collection<User>("users"),
    addonStorage: mockDeep<AddonStorage>()
  };
  return [context, context];
}

export function mockSession(userID: string) {
  return {
    username: "username",
    userID,
    impersonateID: "impersonateID",
    sessionID: "sessionID",
    saveStateID: "saveStateID",
    roomID: "roomID",
    jwt: "jwt"
  };
}
