/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

/**
 * Extends the native Error class. It is intended to be the base class for all
 * custom error types in the application.
 */
export abstract class CustomError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class EnvironmentValidationError extends CustomError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class MinioError extends CustomError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class AddonNotFoundError extends CustomError {
  constructor(addonId: string) {
    super(`Could not find an addon with ID: ${addonId}`, 404);
  }
}

export class AuthorNotFoundError extends CustomError {
  constructor(authorId: string) {
    super(`Could not find the addon's author with ID: ${authorId}`, 404);
  }
}

export class UserNotFoundError extends CustomError {
  constructor(userId: string) {
    super(`Could not find the user with ID: ${userId}`, 404);
  }
}

export class AddonAlreadyInstalledError extends CustomError {
  constructor(username: string, addonName: string) {
    super(`User "${username}" already has addon "${addonName}" installed`, 409);
  }
}

export class AddonNotInstalledError extends CustomError {
  constructor(username: string, addonName: string) {
    super(
      `User "${username}" does not have addon "${addonName}" installed`,
      400
    );
  }
}

export class InvalidFilePathError extends CustomError {
  constructor(filePath: string) {
    super(`Invalid file path: ${filePath}`, 400);
  }
}

export class FileNotFoundError extends CustomError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, 404);
  }
}

export class InternalServerError extends CustomError {
  constructor() {
    super("Internal server error", 500);
  }
}
