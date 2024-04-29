/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

export interface SessionData {
  impersonateID: string;
  jwt: string;
  roomID: string;
  saveStateID: string;
  sessionID: string;
  userID: string;
  username: string;
}

export interface AmqpRequest {
  fromFrontend: {
    body: string;
    callID: string;
  };
  sessionData: SessionData;
}

export interface AmqpResponse {
  callID: string;
  status: string;
  type: string;
  value: unknown;
}

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

export type Handler = (req: object) => Promise<unknown>;
export type AuthHandler = (
  req: object,
  session: SessionData
) => Promise<unknown>;
