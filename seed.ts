/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { randCompanyName, randText, seed, randUuid } from "@ngneat/falso";
import { MongoClient, ObjectId, WithId } from "mongodb";
import "dotenv/config";

import { Addon, AddonCategory, Author, User } from "./src/types";
import { MinioService } from "./src/minio";

// Seeding individual entities

type Seeded<T> = WithId<T>;

function seed_user(): Seeded<User> {
  return {
    userId: randUuid(),
    installedAddons: [],
    _id: new ObjectId()
  };
}

function seed_author(user: WithId<User>): Seeded<Author> {
  return {
    userId: user.userId,
    _id: new ObjectId()
  };
}

function seed_addon(author: WithId<Author>): Seeded<Addon> {
  return {
    name: randCompanyName(),
    summary: randText({ charCount: 50 }),
    icon: "icon.png",
    category: chooseFrom(Object.values(AddonCategory)),
    authorId: author._id.toString(),
    _id: new ObjectId()
  };
}

// Run all seeding functions

async function main() {
  // Set the seed if one is given.
  seed(process.argv[2]);

  const minio = new MinioService();
  const mongo = await MongoClient.connect(process.env.MONGO_URI!);
  const db = mongo.db(process.env.MP_DATABASE_NAME!);
  const col_addons = db.collection("addons");
  const col_authors = db.collection("authors");
  const col_users = db.collection("users");

  // Delete all the data that is already there, ...
  console.log("Deleting previous data...");
  await col_addons.deleteMany();
  await col_authors.deleteMany();
  await col_users.deleteMany();

  const exists = await minio.client.bucketExists(minio.addonBucket);
  exists
    ? await minio.emptyBucket(minio.addonBucket)
    : await minio.client.makeBucket(minio.addonBucket);

  // ... and fill it up with the seeded data
  console.log("Creating users...");
  const users = range(12).map(() => seed_user());
  await col_users.insertMany(users);

  console.log("Creating authors...");
  const authors = chooseFromN(users, 5).map(user => seed_author(user));
  await col_authors.insertMany(authors);

  console.log("Creating addons...");
  const addons: Seeded<Addon>[] = [];
  for (let i = 0; i < 12; i++) {
    const random = Math.floor(Math.random() * authors.length);
    const addon = seed_addon(authors[random]);
    addons.push(addon);
    await col_addons.insertOne(addon);

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
    await col_users.updateOne(
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
  const indices = choices.map((_, i) => i),
    result = [];
  for (let i = 0; i < n; i++)
    result.push(
      indices.splice(Math.floor(Math.random() * indices.length), 1)[0]
    );
  return result.map(i => choices[i]);
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
  return Array(end ? end - start : start)
    .fill(0)
    .map((_, i) => start + i);
}
