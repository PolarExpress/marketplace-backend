/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Context } from "./context";

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
  value: object;
  type: string;
  callID: string;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler = (req: any) => Promise<any>; 

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthHandler = (req: any, session: SessionData) => Promise<any>; 
