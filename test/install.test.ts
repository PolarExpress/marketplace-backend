/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory, User } from "@prisma/client";
import { buildApp } from "../src/app";
import { createMockContext } from "./mock-context";
import request from "supertest";

test("install-test-correct", async () => {
  const user: User & { installedAddons: Addon[] } = {
    id: "user-id",
    email: "",
    installedAddons: []
  };

  const addon: Addon = {
    id: "addon-id",
    name: "Addon Name",
    summary: "Addon Description",
    icon: "icon.png",
    category: AddonCategory.DATA_SOURCE
  };

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
