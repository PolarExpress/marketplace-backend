/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import {
  Addon,
  AddonCategory,
  PrismaClient,
  User,
  Author
} from "@prisma/client";
import {
  randCompanyName,
  randEmail,
  randUserName,
  randText,
  seed
} from "@ngneat/falso";

const prisma = new PrismaClient();

// Seeding individual entities

type Seeded<T> = Omit<T, "id">;

function seed_user(): Seeded<User> {
  return {
    name: randUserName(),
    email: randEmail()
  };
}

function seed_author(user: User): Seeded<Author> {
  return {
    userId: user.id
  };
}

function seed_addon(author: Author): Seeded<Addon> {
  return {
    name: randCompanyName(),
    summary: randText({ charCount: 50 }),
    icon: "",
    category: chooseFrom(Object.values(AddonCategory)),
    authorId: author.id
  };
}

// Run all seeding functions

async function main() {
  // Set the seed if one is given.
  seed(process.argv[2]);

  // Delete all the data that is already there, ...
  await prisma.addon.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();

  // ... and fill it up with the seeded data
  for (let i = 0; i < 12; i++) {
    const created = chooseFrom([1, 1, 1, 1, 2]);
    const installs = chooseFrom([0, 0, 1, 1, 1, 2]);
    await prisma.user.create({
      data: {
        ...seed_user()
      }
    });
  }
  let users: User[] = await prisma.user.findMany();
  let candidAuthors: User[] = [...users];

  for (let i = 0; i < 5; i++) {
    const created = chooseFrom([1, 1, 1, 1, 2]);
    const random = Math.floor(Math.random() * candidAuthors.length);
    await prisma.author.create({
      data: {
        ...seed_author(candidAuthors[random])
      }
    });
    candidAuthors.splice(random, 1);
  }

  let authors: Author[] = await prisma.author.findMany();

  for (let i = 0; i < 12; i++) {
    const random = Math.floor(Math.random() * authors.length);
    await prisma.addon.create({
      data: { ...seed_addon(authors[random]) }
    });
  }

  let addons: Addon[] = await prisma.addon.findMany();

  for (let i = 0; i < users.length; i++) {
    const installs = chooseFrom([0, 1, 1, 2, 2, 3]);
    await prisma.user.update({
      where: { id: users[i].id },
      data: { installedAddons: { connect: chooseFromN(addons, installs) } }
    });
  }
}

main();

// Utility functions

/**
 * Pick a random element from the given list
 * @param choices A list of choices
 * @returns A random element from the list
 */
function chooseFrom<T>(choices: Readonly<T[]>): T {
  return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Draw n elements randomly from the list of choices without repetition
 * @param choices A list of choices
 * @param n The number of desired elements
 * @returns A list of n elements
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
 * Create a list of number based on a range
 * @param start the start of the range, defaults to 0
 * @param end the end of the range, inclusive
 * @returns a list of numbers [start, ..., end]
 */
function range(start: number, end?: number | undefined): number[] {
  return Array(end ? end - start : start)
    .fill(0)
    .map((_, i) => start + i);
}
