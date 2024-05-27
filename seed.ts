/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { randCompanyName, randText, randUuid, seed } from "@ngneat/falso";
import "dotenv/config";
import { MongoClient, ObjectId, WithId } from "mongodb";

import environment from "./src/environment";
import { MinioService } from "./src/minio";
import { Addon, AddonCategory, Author, User } from "./src/types";

// Seeding individual entities

type Seeded<T> = WithId<T>;

/**
 * Randomly generates a user to be seeded into the database.
 *
 * @returns A seeded list with users.
 */
function seedUser(): Seeded<User> {
  return {
    _id: new ObjectId(),
    installedAddons: [],
    userId: randUuid()
  };
}

/**
 * Seeds an author in the database when given a specific user.
 *
 * @param   user The user that is also an author.
 *
 * @returns      A seeded list of authors.
 */
function seedAuthor(user: WithId<User>): Seeded<Author> {
  return {
    _id: new ObjectId(),
    userId: user.userId
  };
}

/**
 * Seeds the add-ons in the database when given an author of the add-on.
 *
 * @param   author The author of the add-on specified.
 *
 * @returns        A seeded list of add-ons.
 */
function seedAddon(author: WithId<Author>): Seeded<Addon> {
  return {
    _id: new ObjectId(),
    authorId: author._id.toString(),
    category: chooseFrom(Object.values(AddonCategory)),
    default: false,
    icon: "icon.png",
    name: randCompanyName(),
    summary: randText({ charCount: 50 })
  };
}

// Run all seeding functions

async function main() {
  // Set the seed if one is given.
  seed(process.argv[2]);

  const minio = new MinioService();
  const mongo = await MongoClient.connect(environment.MONGO_URI);

  const database = mongo.db(environment.MP_DATABASE_NAME);
  const colAddons = database.collection("addons");
  const colAuthors = database.collection("authors");
  const colUsers = database.collection("users");

  // Delete all the data that is already there, ...
  console.log("Deleting previous data...");
  await colAddons.deleteMany();
  await colAuthors.deleteMany();
  await colUsers.deleteMany();

  const exists = await minio.client.bucketExists(minio.addonBucket);
  exists
    ? await minio.emptyBucket(minio.addonBucket)
    : await minio.client.makeBucket(minio.addonBucket);

  // ... and fill it up with the seeded data
  console.log("Creating users...");
  const users = range(12).map(() => seedUser());
  await colUsers.insertMany(users);

  console.log("Creating authors...");
  const authors = chooseFromN(users, 5).map(user => seedAuthor(user));
  await colAuthors.insertMany(authors);

  console.log("Creating addons...");
  const addons: Seeded<Addon>[] = [];
  for (let i = 0; i < 12; i++) {
    const random = Math.floor(Math.random() * authors.length);
    const addon = seedAddon(authors[random]);
    addons.push(addon);
    await colAddons.insertOne(addon);

    const readmeContent = `# README for ${addon.name}`;
    const addonDirectory = `${addon._id.toString()}/`;
    await minio.client.putObject(
      minio.addonBucket,
      `${addonDirectory}README.md`,
      readmeContent,
      undefined,
      {
        "Content-Type": "text/markdown"
      }
    );
  }

  console.log("Creating installs...");
  for (const user of users) {
    const installs = chooseFrom([0, 1, 1, 2, 2, 3]);
    await colUsers.updateOne(
      { _id: user._id },
      {
        $set: {
          installedAddons: chooseFromN(addons, installs).map(addon => addon._id)
        }
      }
    );
  }

  await mongo.close();
  console.log("Done seeding!");
}

main();

// Utility functions

/**
 * Pick a random element from the given list.
 *
 * @param   choices A list of choices.
 *
 * @returns         A random element from the list.
 */
function chooseFrom<T>(choices: Readonly<T[]>): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Draw n elements randomly from the list of choices without repetition.
 *
 * @param   choices A list of choices.
 * @param   n       The number of desired elements.
 *
 * @returns         A list of n elements.
 */
function chooseFromN<T>(choices: Readonly<T[]>, n: number): T[] {
  const indices = choices.map((_, index) => index),
    result = [];
  for (let index = 0; index < n; index++)
    result.push(
      indices.splice(Math.floor(Math.random() * indices.length), 1)[0]
    );
  return result.map(index => choices[index]);
}

/**
 * Create a list of number based on a range.
 *
 * @param   start The start of the range, defaults to 0.
 * @param   end   The end of the range, inclusive.
 *
 * @returns       A list of numbers [start, ..., end]
 */
function range(start: number, end?: number | undefined): number[] {
  const length = end ? end - start + 1 : start;
  return Array.from({ length }, (_, index) => start + index);
}
