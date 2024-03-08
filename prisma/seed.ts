/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory, PrismaClient, User } from "@prisma/client";
import { randCompanyName, randEmail, randText, seed } from "@ngneat/falso";

const prisma = new PrismaClient();

// Seeding individual entities

type Seeded<T> = Omit<T, "id">;

function seed_user(): Seeded<User> {
  return {
    email: randEmail()
  };
}

function seed_addon(): Seeded<Addon> {
  return {
    name: randCompanyName(),
    summary: randText({ charCount: 50 }),
    category: chooseFrom(Object.values(AddonCategory)),
    icon: ""
  };
}

// Run all seeding functions

async function main() {
  // Set the seed if one is given.
  seed(process.argv[2]);

  // Delete all the data that is already there, ...
  await prisma.user.deleteMany();
  await prisma.addon.deleteMany();

  // ... and fill it up with the seeded data
  const addons = await Promise.all(
    range(10).map(() => prisma.addon.create({ data: seed_addon() }))
  );

  for (let i = 0; i < 10; i++) {
    const installs = chooseFrom([0, 0, 0, 0, 1, 2]);
    await prisma.user.create({
      data: {
        ...seed_user(),
        installedAddons: { connect: chooseFromN(addons, installs) }
      }
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
