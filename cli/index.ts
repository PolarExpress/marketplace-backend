/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import "dotenv/config";
import yargs from "yargs";

import { local } from "./local";
import { publish } from "./publish";
import { reset } from "./reset";

(async () => {
  await yargs
    .scriptName("pnpm cli")
    .command(
      "publish <url>",
      "Publish an addon",
      { 
        isDefault: { boolean: true, default: false, required: false },       
        url: { required: true, string: true } 
      },
      publish
    )
    .command(
      "reset",
      "Resets the database and minio with default addons",
      {},
      reset
    )
    .command(
      "local <path>",
      "Publish a local addon",
      { 
        isDefault: { boolean: true, default: false, required: false },
        path: { required: true, string: true } 
      },
      local
    )
    .help()
    .parseAsync();
})();
