/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import "dotenv/config";
import yargs from "yargs";

import { publish } from "./publish";

(async () => {
  await yargs
    .scriptName("pnpm cli")
    .command(
      "publish <url>",
      "Publish an addon",
      { url: { required: true, string: true } },
      publish
    )
    .help()
    .parseAsync();
})();
