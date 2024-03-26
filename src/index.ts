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

const port = parseInt(process.env.MP_BACKEND_PORT ?? "3002", 10);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
