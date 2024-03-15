"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("./context");
const app_1 = require("./app");
// Create the app and start the server
const app = (0, app_1.buildApp)((0, context_1.createContext)());
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
