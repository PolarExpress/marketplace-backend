/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

/**
 * Enumeration of the existing add-on categories.
 */
export enum AddonCategory {
  DATA_SOURCE = "DATA_SOURCE",
  MACHINE_LEARNING = "MACHINE_LEARNING",
  VISUALISATION = "VISUALISATION"
}

/**
 * Author with a user id to match to a user.
 */
export interface Author {
  userId: string;
}

/**
 * User with a list of installed add-ons and a unique user id.
 */
export interface User {
  installedAddons: string[];
  userId: string;
}

/**
 * Add-on containing a author id which specifies the author. A category, icon,
 * name and summary.
 */
export interface Addon {
  authorId: string;
  category: AddonCategory;
  icon: string;
  installCount: number;
  isDefault: boolean;
  name: string;
  summary: string;
}

/**
 * Defines the sorting options that can be used to retrieve addons.
 */
export enum SortOptions {
  ALPHABETICAL = "Alphabetical",
  INSTALL_COUNT = "Install Count",
  NONE = "None",
  RELEVANCE = "Relevance"
}
