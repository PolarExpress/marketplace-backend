/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory } from "@prisma/client";
import { buildApp } from "../../src/app";
import { createMockContext } from "../mock-context";
import request from "supertest";

const dummyAddon = (id: string, category: AddonCategory): Addon => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category
});

test("/addons::200-on-valid-query-all-fields", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addons = [
    dummyAddon("1", AddonCategory.DATA_SOURCE),
    dummyAddon("2", AddonCategory.VISUALISATION)
  ];
  mockCtx.prisma.addon.findMany.mockResolvedValue(addons);

  const app = buildApp(ctx);
  const response = await request(app).get(
    "/addons?page=0&category=DATA_SOURCE"
  );

  expect(response.status).toBe(200);
  expect(response.body).toEqual(addons);
});

test("/addons::200-on-valid-query-only-required-fields", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addons = [
    dummyAddon("1", AddonCategory.DATA_SOURCE),
    dummyAddon("2", AddonCategory.VISUALISATION)
  ];
  mockCtx.prisma.addon.findMany.mockResolvedValue(addons);

  const app = buildApp(ctx);
  const response = await request(app).get("/addons");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(addons);
});

test("/addons::400-on-invalid-page-query", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app).get("/addons?page=invalidPage");

  expect(response.status).toBe(400);
});

test("/addons::400-on-invalid-category-query", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app).get("/addons?category=invalidCategory");

  expect(response.status).toBe(400);
});

test("/addons/:id::200-on-valid-id", async () => {
  const [mockCtx, ctx] = createMockContext();
  const addon = dummyAddon("1", AddonCategory.DATA_SOURCE);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const app = buildApp(ctx);
  const response = await request(app).get("/addons/1");

  expect(response.status).toBe(200);
  expect(response.body).toEqual(addon);
});

test("/addons/:id::404-on-invalid-id", async () => {
  const [mockCtx, ctx] = createMockContext();
  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);

  const app = buildApp(ctx);
  const response = await request(app).get("/addons/1");

  expect(response.status).toBe(404);
});

test("/addons/:id/readme::200-on-valid-id", async () => {
  const [mockCtx, ctx] = createMockContext();
  mockCtx.fs.readFile.mockResolvedValue(Buffer.from("Hello"));

  const app = buildApp(ctx);
  const response = await request(app).get("/addons/1/readme");

  expect(response.status).toBe(200);
  expect(response.body.toString()).toEqual("Hello");
});

test("/addons/:id/readme::404-on-invalid-id", async () => {
  const [mockCtx, ctx] = createMockContext();
  mockCtx.fs.readFile.mockRejectedValue(null);

  const app = buildApp(ctx);
  const response = await request(app).get("/addons/1/readme");

  expect(response.status).toBe(400);
});
