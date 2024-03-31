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
  value: ResponseData;
  type: string;
  callID: string;
  status: string;
}

export interface RequestData {
  action: string | undefined;
}
export interface ResponseData {
  
}

export type Handler<T extends RequestData, U extends ResponseData> = (
  session: SessionData,
  message: T
) => Promise<U>;
