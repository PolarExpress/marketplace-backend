/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

export const pexec = promisify(exec);