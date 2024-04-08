/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import fs from "fs/promises";

export interface AddonStorage {
  getReadme(addonId: string): Promise<string>;
  getSource(addonId: string): Promise<string>;
}

export class LocalAddonStorage implements AddonStorage {
  async getReadme(addonId: string): Promise<string> {
    return await fs.readFile(`../data/${addonId}/README.md`, "utf-8");
  }
  async getSource(addonId: string): Promise<string> {
    return await fs.readFile(`../data/${addonId}/index.html`, "utf-8");
  }
  async storeAddon(
    addonId: string,
    readme: string,
    source: string
  ): Promise<void> {
    await fs.mkdir(`../data/${addonId}`);

    await fs.writeFile(`../data/${addonId}/README.md`, readme);
    await fs.writeFile(`../data/${addonId}/index.html`, source);
  }
}
