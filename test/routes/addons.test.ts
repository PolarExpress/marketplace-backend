/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { ObjectId, WithId } from "mongodb";
import { ZodError } from "zod";

import {
  AddonNotFoundError,
  AuthorNotFoundError,
  UserNotFoundError
} from "../../src/errors";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsByUserIdHandler,
  getAddonsHandler
} from "../../src/routes/addons";
import { Addon, AddonCategory, Author, SortOptions } from "../../src/types";
import {
  createMockContext,
  dummyAddons,
  dummyAuthors,
  dummyUsers,
  mockSession
} from "../mockContext";

type GetAddonsResult = { addons: WithId<{ author: WithId<Author> } & Addon>[] };

test("get-addons::valid-query-required-params", async () => {
  const [, context] = createMockContext();

  const response = (await getAddonsHandler(context)({})) as GetAddonsResult;

  expect(response.addons).toMatchObject(dummyAddons);

  for (const addon of response.addons) {
    expect(dummyAuthors).toContainEqual(addon.author);
  }
});

test("get-addons::valid-query-all-params", async () => {
  const [, context] = createMockContext();

  const response = (await getAddonsHandler(context)({
    category: AddonCategory.VISUALISATION,
    page: 0,
    searchTerm: dummyAddons[0].name,
    sort: SortOptions.NONE
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[0]]);
  expect(response.addons[0].author).toStrictEqual(dummyAuthors[0]);
});

test("get-addons::invalid-query-invalid-page", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsHandler(context)({
      page: "invalidPage"
    })
  ).rejects.toThrow(ZodError);
});

test("get-addons::invalid-query-invalid-category", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsHandler(context)({
      category: "invalidCategory"
    })
  ).rejects.toThrow(ZodError);
});

test("get-addons::invalid-query-invalid-searchterm", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsHandler(context)({
      searchTerm: 42
    })
  ).rejects.toThrow(ZodError);
});

test("get-addons::invalid-query-invalid-sortoption", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsHandler(context)({
      sort: "invalidSort"
    })
  ).rejects.toThrow(ZodError);
});

test("get-addons::valid-query-case-insensitive", async () => {
  const [, context] = createMockContext();

  const response = (await getAddonsHandler(context)({
    searchTerm: dummyAddons[0].name.toLowerCase()
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[0]]);
  expect(response.addons[0].author).toStrictEqual(dummyAuthors[0]);
});

test("get-addons::sort-by-install-count", async () => {
  const [, context] = createMockContext();

  const sortedAddonsByInstallCount = [...dummyAddons].sort(
    (a, b) => b.installCount - a.installCount
  );

  const response = (await getAddonsHandler(context)({
    sort: SortOptions.INSTALL_COUNT
  })) as GetAddonsResult;

  expect(response.addons.map(addon => addon._id)).toStrictEqual(
    sortedAddonsByInstallCount.map(addon => addon._id)
  );
});

test("get-addons::sort-alphabetically", async () => {
  const [, context] = createMockContext();

  const sortedAddonsAlphabetically = [...dummyAddons].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const response = (await getAddonsHandler(context)({
    sort: SortOptions.ALPHABETICAL
  })) as GetAddonsResult;

  expect(response.addons.map(addon => addon._id)).toStrictEqual(
    sortedAddonsAlphabetically.map(addon => addon._id)
  );
});

test("get-addons::sort-by-relevance", async () => {
  const [mockContext, context] = createMockContext();

  const searchTerm = dummyAddons[0].name.toLowerCase();

  const response = (await getAddonsHandler(context)({
    searchTerm,
    sort: SortOptions.RELEVANCE
  })) as GetAddonsResult;

  const expectedSortedAddons = await mockContext.addons
    .find({
      $text: { $search: searchTerm }
    })
    .sort({ name: 1, score: { $meta: "textScore" } })
    .toArray();

  expect(response.addons.map(addon => addon._id)).toStrictEqual(
    expectedSortedAddons.map(addon => addon._id)
  );
});

test("get-addons::author-not-found", async () => {
  const [mockContext, context] = createMockContext();

  // eslint-disable-next-line unicorn/no-useless-undefined -- mockRejectedValue needs a value
  mockContext.authors.findOne = jest.fn().mockResolvedValueOnce(undefined);

  await expect(getAddonsHandler(context)({})).rejects.toThrow(
    AuthorNotFoundError
  );
});

type GetAddonByIdResult = { addon: WithId<{ author: WithId<Author> } & Addon> };

test("get-addon-by-id::valid-id", async () => {
  const [, context] = createMockContext();

  const response = (await getAddonByIdHandler(context)({
    id: dummyAddons[0]._id.toString()
  })) as GetAddonByIdResult;

  expect(response.addon).toMatchObject(dummyAddons[0]);
  expect(response.addon.author).toStrictEqual(dummyAuthors[0]);
});

test("get-addon-by-id::invalid-id", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonByIdHandler(context)({
      id: 42
    })
  ).rejects.toThrow(ZodError);
});

test("get-addon-by-id::addon-not-found", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonByIdHandler(context)({
      id: new ObjectId().toString()
    })
  ).rejects.toThrow(AddonNotFoundError);
});

test("get-addon-by-id::author-not-found", async () => {
  const [mockContext, context] = createMockContext();

  // eslint-disable-next-line unicorn/no-useless-undefined -- mockRejectedValue needs a value
  mockContext.authors.findOne = jest.fn().mockResolvedValueOnce(undefined);

  await expect(
    getAddonByIdHandler(context)({ id: dummyAddons[0]._id.toString() })
  ).rejects.toThrow(AuthorNotFoundError);
});

test("get-addon-readme::valid-id", async () => {
  const [mockContext, context] = createMockContext();

  mockContext.minio.readFile.mockResolvedValue(Buffer.from("Hello"));

  const response = await getAddonReadMeByIdHandler(context)({
    id: dummyAddons[0]._id.toString()
  });

  expect(response).toEqual({ readme: "Hello" });
});

test("get-addon-readme::invalid-id", async () => {
  const [mockContext, context] = createMockContext();

  // eslint-disable-next-line unicorn/no-useless-undefined -- mockRejectedValue needs a value
  mockContext.minio.readFile.mockRejectedValue(undefined);

  await expect(
    getAddonReadMeByIdHandler(context)({
      id: 42
    })
  ).rejects.toThrow(ZodError);
});

type GetAddonsByUserIdResult = {
  addons: WithId<{ author: WithId<Author> } & Addon>[];
};

/**
 * Finds the expected addons for a given user by their userId.
 *
 * @param   userId The ID of the user to find the expected addons for.
 *
 * @returns        An array of addons with their respective authors.
 */
const findExpectedAddonsByUserId = (userId: string) => {
  const user = dummyUsers.find(user => user.userId === userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return user.installedAddons
    .map(addonId => {
      const addon = dummyAddons.find(addon => addon._id.toString() === addonId);
      if (!addon) {
        throw new AddonNotFoundError(addonId);
      }
      return addon;
    })
    .map(addon => {
      const author = dummyAuthors.find(
        author => author._id.toString() === addon.authorId
      );
      if (!author) {
        throw new AuthorNotFoundError(addon.authorId);
      }
      return {
        ...addon,
        author: { ...author }
      };
    });
};

test("get-addons-by-userid::missing-user-in-database", async () => {
  const [, context] = createMockContext();

  await getAddonsByUserIdHandler(context)({}, mockSession("4"));

  expect(await context.users.findOne({ userId: "4" })).toMatchObject({
    installedAddons: [dummyAddons[2]._id.toString()],
    userId: "4"
  });
});

test("get-addons-by-userid::valid-query-required-params", async () => {
  const [, context] = createMockContext();

  const response = (await getAddonsByUserIdHandler(context)(
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
  const [, context] = createMockContext();

  const response = (await getAddonsByUserIdHandler(context)(
    {
      category: AddonCategory.DATA_SOURCE,
      page: 0
    },
    mockSession("3")
  )) as GetAddonsResult;

  expect(response.addons).toMatchObject([dummyAddons[2]]); //hardcoded for now

  for (const addon of response.addons) {
    expect(dummyAuthors).toContainEqual(addon.author);
  }
});

test("get-addons-by-userid::invalid-query-invalid-page", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsByUserIdHandler(context)(
      {
        page: "invalidPage"
      },
      mockSession("3")
    )
  ).rejects.toThrow(ZodError);
});

test("get-addons-by-userid::invalid-query-invalid-category", async () => {
  const [, context] = createMockContext();

  await expect(
    getAddonsByUserIdHandler(context)(
      {
        category: "invalidCategory"
      },
      mockSession("3")
    )
  ).rejects.toThrow(ZodError);
});

test("get-addons-by-userid::author-not-found", async () => {
  const [mockContext, context] = createMockContext();

  // eslint-disable-next-line unicorn/no-useless-undefined -- mockRejectedValue needs a value
  mockContext.authors.findOne = jest.fn().mockResolvedValueOnce(undefined);

  await expect(
    getAddonsByUserIdHandler(context)({}, mockSession("3"))
  ).rejects.toThrow(AuthorNotFoundError);
});
