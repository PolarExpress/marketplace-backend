/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { WithId } from "mongodb";

import {
  dummyAddons,
  dummyAuthors,
  dummyUsers,
  createMockContext,
  mockSession
} from "../mock-context";

import { Addon, AddonCategory, Author } from "../../src/types";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsHandler,
  getAddonsByUserIdHandler
} from "../../src/routes/addons";

type GetAddonsResult = { addons: WithId<Addon & { author: WithId<Author> }>[] };

test("get-addons::valid-query-required-params", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsHandler(ctx)({})) as GetAddonsResult;

  expect(response.addons).toMatchObject(dummyAddons);
  for (const addon of response.addons) {
    expect(dummyAuthors).toContainEqual(addon.author);
  }
});

test("get-addons::valid-query-all-params", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsHandler(ctx)({
    page: 0,
    category: AddonCategory.VISUALISATION,
    searchTerm: dummyAddons[0].name
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[0]]);
  expect(response.addons[0].author).toStrictEqual(dummyAuthors[0]);
});

test("get-addons::invalid-query-invalid-page", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonsHandler(ctx)({
      page: "invalidPage"
    })
  ).rejects.toThrow();
});

test("get-addons::invalid-query-invalid-category", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonsHandler(ctx)({
      category: "invalidCategory"
    })
  ).rejects.toThrow();
});

test("get-addons::invalid-query-invalid-searchterm", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonsHandler(ctx)({
      searchTerm: 42
    })
  ).rejects.toThrow();
});

test("get-addons::valid-query-case-insensitive", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsHandler(ctx)({
    searchTerm: dummyAddons[0].name.toLowerCase()
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[0]]);
  expect(response.addons[0].author).toStrictEqual(dummyAuthors[0]);
});

test("get-addons::valid-query-partial-match", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsHandler(ctx)({
    searchTerm: "addon"
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject([
    dummyAddons[0],
    dummyAddons[1],
    dummyAddons[2]
  ]);
  for (const addon of response.addons) {
    const authorId = addon.authorId;
    const author = dummyAuthors.find(
      author => author._id.toString() === authorId
    );
    expect(addon.author).toStrictEqual(author);
  }
});

type GetAddonByIdResult = { addon: WithId<Addon & { author: WithId<Author> }> };

test("get-addon-by-id::valid-id", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonByIdHandler(ctx)({
    id: dummyAddons[0]._id.toString()
  })) as GetAddonByIdResult;

  expect(response.addon).toMatchObject(dummyAddons[0]);
  expect(response.addon.author).toStrictEqual(dummyAuthors[0]);
});

test("get-addon-by-id::invalid-id", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonByIdHandler(ctx)({
      id: "invalidId"
    })
  ).rejects.toThrow();
});

test("get-addon-readme::valid-id", async () => {
  const [mockCtx, ctx] = createMockContext();

  mockCtx.minio.readFile.mockResolvedValue(Buffer.from("Hello"));

  const response = await getAddonReadMeByIdHandler(ctx)({
    id: dummyAddons[0]._id.toString()
  });

  expect(response).toEqual({ readme: "Hello" });
});

test("get-addon-readme::invalid-id", async () => {
  const [mockCtx, ctx] = createMockContext();

  mockCtx.minio.readFile.mockRejectedValue(null);

  await expect(
    getAddonReadMeByIdHandler(ctx)({
      id: "invalidId"
    })
  ).rejects.toThrow();
});

type GetAddonsByUserIdResult = {
  addons: WithId<Addon & { author: WithId<Author> }>[];
};

// Find the expectedAddons via dummyUsers and their installedAddons when given a userId
// Not sure if we can just hardcode the expectedAddons instead of functions like this
function findExpectedAddonsByUserId(userId: string) {
  const user = dummyUsers.find(user => user.userId === userId);
  if (!user) {
    throw new Error(`User with userId ${userId} not found`);
  }

  // Construct expected addons for the user
  const expectedAddons = user.installedAddons
    .map(addonId => dummyAddons.find(addon => addon._id.toString() === addonId))
    .filter((addon): addon is WithId<Addon> => !!addon) // Ensure addon is found
    .map(addon => {
      // Addon existence is guaranteed by the previous filter step
      const author = dummyAuthors.find(
        author => author._id.toString() === addon.authorId
      );
      if (!author) {
        throw new Error(`Author with id ${addon.authorId} not found`);
      }
      return {
        ...addon,
        author: { ...author } // Append the found author object to the addon
      };
    });

  return expectedAddons;
}

test("get-addons-by-userid::valid-query-required-params", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsByUserIdHandler(ctx)(
    {},
    mockSession("3")
  )) as GetAddonsByUserIdResult;

  const expectedAddons = findExpectedAddonsByUserId("3");

  expect(response.addons).toMatchObject(expectedAddons); // hardcoded option: [dummyAddons[0], dummyAddons[2]]
  for (const addon of response.addons) {
    expect(dummyAuthors).toContainEqual(addon.author);
  }
});

test("get-addons-by-userid::valid-query-all-params", async () => {
  const [, ctx] = createMockContext();

  const response = (await getAddonsByUserIdHandler(ctx)(
    {
      page: 0,
      category: AddonCategory.DATA_SOURCE
    },
    mockSession("3")
  )) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[2]]); //hardcoded for now
  for (const addon of response.addons) {
    expect(dummyAuthors).toContainEqual(addon.author);
  }
});

test("get-addons-by-userid::invalid-query-invalid-page", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonsByUserIdHandler(ctx)(
      {
        page: "invalidPage"
      },
      mockSession("3")
    )
  ).rejects.toThrow();
});

test("get-addons-by-userid::invalid-query-invalid-category", async () => {
  const [, ctx] = createMockContext();

  await expect(
    getAddonsByUserIdHandler(ctx)(
      {
        category: "invalidCategory"
      },
      mockSession("3")
    )
  ).rejects.toThrow();
});
