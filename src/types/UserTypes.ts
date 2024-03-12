//Deze UserTypes.ts is gekopieerd uit de frontend
import type { Addon } from "./AddOnTypes";

export interface User {
  id: string;
  email: string;

  installs?: Addon[];
}
