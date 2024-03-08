import { Response, NextFunction } from "express";
import { Context, createContext } from "./context";
import { buildApp } from "./app";

declare module "express" {
  export interface Request {
    ctx?: Context;
  }
}

const app = buildApp(createContext);

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}
