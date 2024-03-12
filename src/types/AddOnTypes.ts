//Deze AddOnTypes.ts is gekopieerd uit de frontend
import type { User } from "./UserTypes";

export enum AddonCategory {
  VISUALISATION = "VISUALISATION",
  MACHINE_LEARNING = "MACHINE_LEARNING",
  DATA_SOURCE = "DATA_SOURCE"
}

export interface Addon {
  id: number;
  name: string;
  summary: string;
  
  icon?: string;
  category?: AddonCategory;
  installedBy?: User[];
}