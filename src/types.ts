/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

export interface SessionData {
  username: string;
  userID: string;
  impersonateID: string;
  sessionID: string;
  saveStateID: string;
  roomID: string;
  jwt: string;
}

export interface AmqpRequest {
  sessionData: SessionData;
  fromFrontend: {
    callID: string;
    body: string;
  };
}

export interface AmqpResponse {
  value: unknown;
  type: string;
  callID: string;
  status: string;
}

export enum AddonCategory {
  VISUALISATION = "VISUALISATION",
  MACHINE_LEARNING = "MACHINE_LEARNING",
  DATA_SOURCE = "DATA_SOURCE"
}

export interface Author {
  userId: string;
}

export interface User {
  userId: string;
  installedAddons: string[];
}

export interface Addon {
  name: string;
  summary: string;
  icon: string;
  category: AddonCategory;
  authorId: string;
}

export type Handler = (req: object) => Promise<unknown>;
export type AuthHandler = (req: object, session: SessionData) => Promise<unknown>;
