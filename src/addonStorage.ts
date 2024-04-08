/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import fs from "fs/promises";
import path from "path";

/**
 * AddonStorage is an interface for storing and retrieving addons.
 *
 * This is used to store the readme and source of an addon. These are either
 * stored locally or on a remote data store.
 *
 * This interface is mocked during unit tests.
 */
export interface AddonStorage {
  /**
   * Get the readme of an addon.
   */
  getReadme(addonId: string): Promise<string>;
  /**
   * Get the source (index.html) of an addon.
   */
  getSource(addonId: string): Promise<string>;
  /**
   * Store the readme and source of an addon.
   */
  storeAddon(addonId: string, readme: string, source: string): Promise<void>;
}

export class LocalAddonStorage implements AddonStorage {
  private getAddonPath(addonId: string): string {
    return path.join(__dirname, "../", "data", addonId);
  }

  async getReadme(addonId: string): Promise<string> {
    return await fs.readFile(
      path.join(this.getAddonPath(addonId), "README.md"),
      "utf-8"
    );
  }
  async getSource(addonId: string): Promise<string> {
    return await fs.readFile(
      path.join(this.getAddonPath(addonId), "index.html"),
      "utf-8"
    );
  }
  async storeAddon(
    addonId: string,
    readme: string,
    source: string
  ): Promise<void> {
    const addonPath = this.getAddonPath(addonId);
    await fs.mkdir(addonPath, { recursive: true });
    await fs.writeFile(path.join(addonPath, "README.md"), readme);
    await fs.writeFile(path.join(addonPath, "index.html"), source);
  }
}
