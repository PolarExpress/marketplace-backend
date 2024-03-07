/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import express from "express";
import { PrismaClient } from "@prisma/client";
import { ZenStackMiddleware } from "@zenstackhq/server/express";
import RestApiHandler from "@zenstackhq/server/api/rest";
// import { enhance } from "@zenstackhq/runtime";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// --- dummy authentication

// function getSessionUser(request: express.Request) {
//   // This is a placeholder for your auth solution
//   return {
//     id: "",
//   };
// }

// ---

const handler = RestApiHandler({ endpoint: "http://localhost:3000/api" });

app.use(
  "/api",
  ZenStackMiddleware({
    // switch for authentication
    /// getPrisma: (request: express.Request) => enhance(prisma, { user: getSessionUser(request) }),
    getPrisma: () => prisma,

    handler: handler
  })
);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
