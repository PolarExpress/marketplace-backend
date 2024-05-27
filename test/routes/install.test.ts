/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { ObjectId } from "mongodb";
import { ZodError } from "zod";

import {
  AddonAlreadyInstalledError,
  AddonNotFoundError
} from "../../src/errors";
import { installHandler, uninstallHandler } from "../../src/routes/install";
import { createMockContext, dummyAddons, mockSession } from "../mockContext";

test("install::valid-query_correct-return", async () => {
  const [, context] = createMockContext();
  const session = mockSession("1");

  const addonID = dummyAddons[0]._id.toString();
  const response = installHandler(context)({ addonID }, session);

  await expect(response).resolves.not.toBeDefined();

  const user = await context.users.findOne({ userId: "1" });

  expect(user?.installedAddons).toContain(addonID);
});

test("install::missing-args_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("1");

  await expect(installHandler(context)({}, session)).rejects.toThrow(ZodError);
});

test("install::invalid-addon-id_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("1");

  const response = installHandler(context)(
    { addonID: new ObjectId().toString() },
    session
  );

  await expect(response).rejects.toThrow(AddonNotFoundError);
});

test("install::invalid-user-id_should-create-new-user", async () => {
  const [, context] = createMockContext();
  const session = mockSession("4");

  const response = installHandler(context)(
    { addonID: dummyAddons[0]._id.toString() },
    session
  );

  await expect(response).resolves.not.toBeDefined();

  const newUser = await context.users.findOne({ userId: "4" });

  expect(newUser).not.toBeNull();
});

test("install::already-installed-addon_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("3");

  await expect(
    installHandler(context)({ addonID: dummyAddons[0]._id.toString() }, session)
  ).rejects.toThrow(AddonAlreadyInstalledError);
});

test("uninstall::valid-query_correct-return", async () => {
  const [, context] = createMockContext();
  const session = mockSession("3");

  const addonID = dummyAddons[2]._id.toString();
  const response = uninstallHandler(context)({ addonID }, session);

  await expect(response).resolves.not.toBeDefined();

  const user = await context.users.findOne({ userId: "3" });

  expect(user?.installedAddons).not.toContain(addonID);
});

test("uninstall::missing-args_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("3");

  await expect(uninstallHandler(context)({}, session)).rejects.toThrow(
    ZodError
  );
});

test("uninstall::invalid-addon-id_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("3");

  await expect(
    uninstallHandler(context)({ addonID: new ObjectId().toString() }, session)
  ).rejects.toThrow(AddonNotFoundError);
});

test("uninstall::invalid-user-id_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("5");

  await expect(
    uninstallHandler(context)(
      { addonID: dummyAddons[0]._id.toString() },
      session
    )
  ).rejects.toBeDefined();
});

test("uninstall::addon-not-installed_should-throw", async () => {
  const [, context] = createMockContext();
  const session = mockSession("3");

  await expect(
    uninstallHandler(context)(
      { addonID: dummyAddons[1]._id.toString() },
      session
    )
  ).rejects.toBeDefined();
});
