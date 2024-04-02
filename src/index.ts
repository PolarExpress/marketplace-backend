/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { createContext } from "./context";
import { buildApp } from "./app";

import "dotenv/config";

(async () => {
  // Create the app and start the server
  const app = await buildApp(createContext());
  const port = Number(process.env.MP_BACKEND_PORT ?? "3002");

  app.listen(port);
})();
