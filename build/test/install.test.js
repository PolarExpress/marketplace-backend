"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const app_1 = require("../src/app");
const mock_context_1 = require("./mock-context");
const supertest_1 = __importDefault(require("supertest"));
const dummyUser = id => ({
  id,
  name: "",
  email: ""
});
const dummyAddon = id => ({
  id,
  name: "Addon Name",
  summary: "Addon Description",
  icon: "icon.png",
  category: client_1.AddonCategory.DATA_SOURCE,
  authorId: ""
});
test("install::correct-response-code-and-body", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: []
    });
    const addon = dummyAddon("addon-id");
    const newUser = Object.assign(Object.assign({}, user), {
      installedAddons: [addon]
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    mockCtx.prisma.user.update.mockResolvedValue(newUser);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ userId: user.id, addonId: addon.id });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(newUser);
  }));
test("install::400-on-unknown-user-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const addon = dummyAddon("addon-id");
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(null);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ userId: "wrongId", addonId: addon.id });
    expect(response.status).toBe(400);
  }));
test("install::400-on-unknown-addon-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: []
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(null);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ userId: user.id, addonId: "wrongId" });
    expect(response.status).toBe(400);
  }));
test("install::400-on-already-installed-addon", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const addon = dummyAddon("addon-id");
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: [addon]
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ userId: user.id, addonId: "addon-id" });
    expect(response.status).toBe(400);
  }));
test("install::400-on-missing-user-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [, ctx] = (0, mock_context_1.createMockContext)();
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ addonId: "addon-id" });
    expect(response.status).toBe(400);
  }));
test("install::400-on-missing-addon-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [, ctx] = (0, mock_context_1.createMockContext)();
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/install")
      .send({ userId: "user-id" });
    expect(response.status).toBe(400);
  }));
// -----------------------------------------------------------------------------
test("uninstall::correct-response-code-and-body", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const addon = dummyAddon("addon-id");
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: [addon]
    });
    const newUser = Object.assign(Object.assign({}, user), {
      installedAddons: []
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    mockCtx.prisma.user.update.mockResolvedValue(newUser);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ userId: user.id, addonId: addon.id });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(newUser);
  }));
test("uninstall::400-on-unknown-user-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const addon = dummyAddon("addon-id");
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(null);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ userId: "wrongId", addonId: addon.id });
    expect(response.status).toBe(400);
  }));
test("uninstall::400-on-unknown-addon-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: []
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(null);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ userId: user.id, addonId: "wrongId" });
    expect(response.status).toBe(400);
  }));
test("uninstall::400-on-not-installed-addon", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const addon = dummyAddon("addon-id");
    const user = Object.assign(Object.assign({}, dummyUser("user-id")), {
      installedAddons: []
    });
    const [mockCtx, ctx] = (0, mock_context_1.createMockContext)();
    mockCtx.prisma.user.findUnique.mockResolvedValue(user);
    mockCtx.prisma.addon.findUnique.mockResolvedValue(addon);
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ userId: user.id, addonId: addon.id });
    expect(response.status).toBe(400);
  }));
test("uninstall::400-on-missing-user-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [, ctx] = (0, mock_context_1.createMockContext)();
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ addonId: "addon-id" });
    expect(response.status).toBe(400);
  }));
test("uninstall::400-on-missing-addon-id", () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [, ctx] = (0, mock_context_1.createMockContext)();
    const app = (0, app_1.buildApp)(ctx);
    const response = yield (0, supertest_1.default)(app)
      .post("/uninstall")
      .send({ userId: "user-id" });
    expect(response.status).toBe(400);
  }));
