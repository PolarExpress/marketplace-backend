import express from "express";
import { Request } from "express";
import { Context } from "./context";
import { installRoute } from "./install";

// import { enhance } from "@zenstackhq/runtime";
export function buildApp(makeCtx: (req: Request) => Context) {
  const app = express();
  app.use((req: Request, _res, next) => {
    req.ctx = makeCtx(req);
    next();
  });

  app.use(express.json());

  app.post("/api/install", installRoute);

  return app;
}
