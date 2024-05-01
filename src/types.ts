/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

export enum AddonCategory {
  DATA_SOURCE = "DATA_SOURCE",
  MACHINE_LEARNING = "MACHINE_LEARNING",
  VISUALISATION = "VISUALISATION"
}

export interface Author {
  userId: string;
}

export interface User {
  installedAddons: string[];
  userId: string;
}

export interface Addon {
  authorId: string;
  category: AddonCategory;
  icon: string;
  name: string;
  summary: string;
}
