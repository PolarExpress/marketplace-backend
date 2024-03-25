/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { createContext } from "./context";
import { buildApp } from "./app";

// Create the app and start the server
const app = buildApp(createContext());

app.listen(3000, () => {
  console.log("Server running on http://localhost:3002");
});
