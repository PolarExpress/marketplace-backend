/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { local } from "./local";
import { pexec } from "./utils";

type PublishArguments = {
  isDefault: boolean;
  url: string;
};

export async function publish(argv: PublishArguments) {
  const addonName = argv.url.match(/\/([^/\\]*)\.git$/)![1];
  const cloneDestination = path.join(tmpdir(), addonName);
  try {
    await rm(cloneDestination, { recursive: true });
  } catch {
    /* empty */
  } finally {
    console.log(`Cloning ${argv.url} to ${cloneDestination}`);
    await pexec(`git clone ${argv.url} ${cloneDestination}`);
    await local({ isDefault: argv.isDefault, path: cloneDestination });
  }
}
