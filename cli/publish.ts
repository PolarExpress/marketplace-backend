/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { exec } from "node:child_process";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { local } from "./local";

type PublishArguments = {
  url: string;
};

const pexec = promisify(exec);

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
    await local({ path: cloneDestination });
  }
}