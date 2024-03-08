/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory, User } from "@prisma/client";
import { buildApp } from "../../src/app";
import { createMockContext } from "../mock-context";
import request from "supertest";

const dummyUser = (id: string): User => ({
  id,
  email: ""
});

const dummyAddon = (id: string): Addon => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category: AddonCategory.DATA_SOURCE
});

test("install::correct-response-code-and-body", async () => {
  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: []
  };

  const addon: Addon = dummyAddon("addon-id");

  const newUser: User & { installedAddons: Addon[] } = {
    ...user,
    installedAddons: [addon]
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
  mockCtx.prisma.user.update.mockResolvedValue(newUser);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ userId: user.id, addonId: addon.id });

  expect(response.status).toBe(200);
  expect(response.body).toEqual(newUser);
});

test("install::500-on-unknown-user-id", async () => {
  const addon: Addon = dummyAddon("addon-id");

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(null);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ userId: "wrongId", addonId: addon.id });

  expect(response.status).toBe(500);
});

test("install::500-on-unknown-addon-id", async () => {
  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: []
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ userId: user.id, addonId: "wrongId" });

  expect(response.status).toBe(500);
});

test("install::500-on-already-installed-addon", async () => {
  const addon: Addon = dummyAddon("addon-id");

  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: [addon]
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ userId: user.id, addonId: "addon-id" });

  expect(response.status).toBe(500);
});

test("install::400-on-missing-user-id", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ addonId: "addon-id" });

  expect(response.status).toBe(400);
});

test("install::400-on-missing-addon-id", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/install")
    .send({ userId: "user-id" });

  expect(response.status).toBe(400);
});

// -----------------------------------------------------------------------------

test("uninstall::correct-response-code-and-body", async () => {
  const addon: Addon = dummyAddon("addon-id");

  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: [addon]
  };

  const newUser: User & { installedAddons: Addon[] } = {
    ...user,
    installedAddons: []
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
  mockCtx.prisma.user.update.mockResolvedValue(newUser);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ userId: user.id, addonId: addon.id });

  expect(response.status).toBe(200);
  expect(response.body).toEqual(newUser);
});

test("uninstall::500-on-unknown-user-id", async () => {
  const addon: Addon = dummyAddon("addon-id");

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(null);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ userId: "wrongId", addonId: addon.id });

  expect(response.status).toBe(500);
});

test("uninstall::500-on-unknown-addon-id", async () => {
  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: []
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ userId: user.id, addonId: "wrongId" });

  expect(response.status).toBe(500);
});

test("uninstall::500-on-not-installed-addon", async () => {
  const addon: Addon = dummyAddon("addon-id");

  const user: User & { installedAddons: Addon[] } = {
    ...dummyUser("user-id"),
    installedAddons: []
  };

  const [mockCtx, ctx] = createMockContext();

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ userId: user.id, addonId: addon.id });

  expect(response.status).toBe(500);
});

test("uninstall::400-on-missing-user-id", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ addonId: "addon-id" });

  expect(response.status).toBe(400);
});

test("uninstall::400-on-missing-addon-id", async () => {
  const [, ctx] = createMockContext();

  const app = buildApp(ctx);
  const response = await request(app)
    .post("/uninstall")
    .send({ userId: "user-id" });

  expect(response.status).toBe(400);
});
