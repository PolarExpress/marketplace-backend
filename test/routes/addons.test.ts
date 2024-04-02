/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory } from "@prisma/client";
import { createMockContext } from "../mock-context";
import {
  getAddonByIdHandler,
  getAddonReadMeByIdHandler,
  getAddonsHandler
} from "../../src/routes/addons";

const dummyAddon = (
  id: string,
  category: AddonCategory,
  authorId: string
): Addon => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category,
  authorId
});

test("get-addons::valid-query-required-params", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addons = [
    dummyAddon("1", AddonCategory.DATA_SOURCE, "123"),
    dummyAddon("2", AddonCategory.VISUALISATION, "987")
  ];

  mockCtx.prisma.addon.findMany.mockResolvedValue(addons);

  const response = await getAddonsHandler(ctx)({});

  expect(response).toEqual({ addons });
});

test("get-addons::valid-query-all-params", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addons = [
    dummyAddon("1", AddonCategory.DATA_SOURCE, "123"),
    dummyAddon("2", AddonCategory.VISUALISATION, "987")
  ];

  mockCtx.prisma.addon.findMany.mockResolvedValue(addons);

  const response = await getAddonsHandler(ctx)({
    page: 0,
    category: AddonCategory.DATA_SOURCE
  });

  expect(response).toEqual({ addons });
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

test("get-addon-by-id::valid-id", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addon = dummyAddon("1", AddonCategory.DATA_SOURCE, "123");

  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const response = await getAddonByIdHandler(ctx)({
    id: "1"
  });

  expect(response).toEqual({ addon });
});

test("get-addon-by-id::invalid-id", async () => {
  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);

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
    id: "1"
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
