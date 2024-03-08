import { buildApp } from "../src/app";
import { createMockContext } from "../src/context";
import request from "supertest";

test("install-test", async () => {
  const [ctx, createContext] = createMockContext();
  const app = buildApp(createContext);
});
