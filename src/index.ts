/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import "dotenv/config";

import { buildApp } from "./app";
import { createContext } from "./context";
import environment from "./environment";

(async () => {
  const app = await buildApp(await createContext());
  const port = environment.MP_BACKEND_PORT;

  app.listen(port);
})().catch(error => {
  console.error("Error starting the server:", error);
});
