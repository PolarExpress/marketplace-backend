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
  // Create the app and start the server
  const app = await buildApp(await createContext());
  const port = Number(environment.MP_BACKEND_PORT ?? "3002");

  app.listen(port);
})();
