/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Addon, AddonCategory, User } from "@prisma/client";
import { createMockContext } from "../mock-context";
import { installHandler, uninstallHandler } from "../../src/routes/install";

const dummyUser = (id: string): User => ({
  id,
  name: "",
  email: ""
});

const dummyAddon = (id: string): Addon => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category: AddonCategory.DATA_SOURCE,
  authorId: ""
});

const mockSession = () => { 
  return {
    username: "username",
    userID: "userID",
    impersonateID: "impersonateID",
    sessionID: "sessionID",
    saveStateID: "saveStateID",
    roomID: "roomID",
    jwt: "jwt",
  }
};

test("install::valid-query_correct-return", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();  
  const addon = dummyAddon("addon-id");
  const user = {
    ...dummyUser(session.userID),
    installedAddons: []
  };

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
  mockCtx.prisma.user.update.mockResolvedValue(user);

  const response = await installHandler(ctx)(
    { addonID: addon.id },
    session
  );

  expect(response).toEqual(user);
});

test("install::missing-args_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession();  

  await expect(installHandler(ctx)(
    {}, 
    session
  )).rejects.toThrow();
});

test("install::invalid-addon-id_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();  
  const user = {
    ...dummyUser(session.userID),
    installedAddons: []
  };

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);

  await expect(installHandler(ctx)(
    { addonID: "invalid-addon-id" }, 
    session
  )).rejects.toThrow();
});

// TODO: this test will be redundant after migration to mongodb
test("install::invalid-user-id_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();  

  mockCtx.prisma.user.findUnique.mockResolvedValue(null);

  await expect(installHandler(ctx)(
    { addonID: "addon-id" }, 
    session
  )).rejects.toThrow();
});

test("install::already-installed-addon_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();  
  const addon = dummyAddon("addon-id");
  
  const user = {
    ...dummyUser("user-id"),
    installedAddons: [addon]
  };  

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);

  await expect(installHandler(ctx)(
    { addonID: addon.id }, 
    session
  )).rejects.toThrow();

});

test("uninstall::valid-query_correct-return", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();
  const addon = dummyAddon("addon-id");
  const user = {
    ...dummyUser(session.userID),
    installedAddons: [addon]
  };
  
  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
  mockCtx.prisma.user.update.mockResolvedValue(user);
  const response = await uninstallHandler(ctx)(
    { addonID: addon.id },
    session
  );
  expect(response).toEqual(user);
});

test("uninstall::missing-args_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession();

  await expect(uninstallHandler(ctx)(
    {},
    session
  )).rejects.toThrow();
});

test("uninstall::invalid-addon-id_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();
  const user = {
    ...dummyUser(session.userID),
    installedAddons: []
  };

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(null);
  
  await expect(uninstallHandler(ctx)(
    { addonID: "invalid-addon-id" },
    session
  )).rejects.toThrow();
});

test("uninstall::invalid-user-id_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();

  mockCtx.prisma.user.findUnique.mockResolvedValue(null);
  await expect(uninstallHandler(ctx)(
    { addonID: "addon-id" },
    session
  )).rejects.toThrow();
});

test("uninstall::addon-not-installed_should-throw", async () => {
  const [mockCtx, ctx] = createMockContext();
  const session = mockSession();
  const addon = dummyAddon("addon-id");

  const user = {
    ...dummyUser("user-id"),
    installedAddons: [] // Empty array to indicate no installed addons
  };

  mockCtx.prisma.user.findUnique.mockResolvedValue(user);
  mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
  await expect(uninstallHandler(ctx)(
    { addonID: addon.id },
    session
  )).rejects.toThrow();
});