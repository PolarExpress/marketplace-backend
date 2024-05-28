/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { z } from "zod";
import { fromError } from "zod-validation-error";

import { EnvironmentValidationError } from "./errors";

/**
 * Environment variable schema containing all the environment variables in the
 * backend.
 */
const environmentSchema = z.object({
  MINIO_ACCESSKEY: z.string().min(1),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().regex(/^\d+$/).transform(Number),
  MINIO_SECRETKEY: z.string().min(1),

  MONGO_URI: z.string().url().min(1),

  MP_BACKEND_PORT: z.string().regex(/^\d+$/).transform(Number),
  MP_DATABASE_NAME: z.string().min(1),

  RABBIT_HOST: z.string().min(1),
  RABBIT_PASSWORD: z.string().min(1),
  RABBIT_PORT: z.string().regex(/^\d+$/).transform(Number),
  RABBIT_USER: z.string().min(1),

  REDIS_ADDRESS: z.string().min(1),
  REDIS_PASSWORD: z.string().min(1)
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const message = fromError(parsedEnvironment.error).message;
  throw new EnvironmentValidationError(message);
}

/**
 * Parsed environment object.
 */
const environment = parsedEnvironment.data;
export default environment;
