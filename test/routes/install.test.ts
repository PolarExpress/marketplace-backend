/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { dummyAddons, createMockContext, mockSession } from "../mock-context";
import { installHandler, uninstallHandler } from "../../src/routes/install";

test("install::valid-query_correct-return", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("1");

  const addonID = dummyAddons[0]._id.toString();
  const response = installHandler(ctx)({ addonID }, session);

  await expect(response).resolves.not.toBeDefined();

  const user = await ctx.users.findOne({ userId: "1" });
  expect(user?.installedAddons).toContain(addonID);
});

test("install::missing-args_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("1");

  await expect(installHandler(ctx)({}, session)).rejects.toBeDefined();
});

test("install::invalid-addon-id_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("1");

  const response = installHandler(ctx)(
    { addonID: "invalid-addon-id" },
    session
  );
  await expect(response).rejects.toBeDefined();
});

test("install::invalid-user-id_should-create-new-user", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("4");

  const response = installHandler(ctx)(
    { addonID: dummyAddons[0]._id.toString() },
    session
  );
  await expect(response).resolves.not.toBeDefined();

  const new_user = await ctx.users.findOne({ userId: "4" });
  expect(new_user).not.toBeNull();
});

test("install::already-installed-addon_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("3");

  await expect(
    installHandler(ctx)({ addonID: dummyAddons[0]._id.toString() }, session)
  ).rejects.toBeDefined();
});

test("uninstall::valid-query_correct-return", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("3");

  const addonID = dummyAddons[2]._id.toString();
  const response = uninstallHandler(ctx)({ addonID }, session);

  await expect(response).resolves.not.toBeDefined();

  const user = await ctx.users.findOne({ userId: "3" });
  expect(user?.installedAddons).not.toContain(addonID);
});

test("uninstall::missing-args_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("3");

  await expect(uninstallHandler(ctx)({}, session)).rejects.toBeDefined();
});

test("uninstall::invalid-addon-id_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("3");

  await expect(
    uninstallHandler(ctx)({ addonID: "invalid-addon-id" }, session)
  ).rejects.toBeDefined();
});

test("uninstall::invalid-user-id_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("5");

  await expect(
    uninstallHandler(ctx)({ addonID: dummyAddons[0]._id.toString() }, session)
  ).rejects.toBeDefined();
});

test("uninstall::addon-not-installed_should-throw", async () => {
  const [, ctx] = createMockContext();
  const session = mockSession("3");

  await expect(
    uninstallHandler(ctx)({ addonID: dummyAddons[1]._id.toString() }, session)
  ).rejects.toBeDefined();
});
