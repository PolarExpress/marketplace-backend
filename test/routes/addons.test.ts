/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { WithId } from "mongodb";

import { dummyAddons, dummyAuthors, createMockContext } from "../mock-context";

import { Addon, AddonCategory, Author } from "../../src/types";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsHandler
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
    category: AddonCategory.DATA_SOURCE
  })) as GetAddonsResult;

  expect(response.addons).toMatchObject(
    dummyAddons.filter(addon => addon.category === AddonCategory.DATA_SOURCE)
  );
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

  mockCtx.fs.readFile.mockResolvedValue(Buffer.from("Hello"));

  const response = await getAddonReadMeByIdHandler(ctx)({
    id: dummyAddons[0]._id.toString()
  });

  expect(response).toEqual({ readme: "Hello" });
});

test("get-addon-readme::invalid-id", async () => {
  const [mockCtx, ctx] = createMockContext();

  mockCtx.fs.readFile.mockRejectedValue(null);

  await expect(
    getAddonReadMeByIdHandler(ctx)({
      id: "invalidId"
    })
  ).rejects.toThrow();
});
