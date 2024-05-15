/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { z } from "zod";

// The environment variable schema that zod checks for, containing all the environment variables in the backend.
const environmentSchema = z.object({
  MINIO_ACCESSKEY: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number(),

  MINIO_SECRETKEY: z.string(),
  MONGO_URI: z.string().url(),
  MP_BACKEND_PORT: z.coerce.number(),
  MP_DATABASE_NAME: z.string().min(1),

  RABBIT_HOST: z.string(),
  RABBIT_PASSWORD: z.string(),

  RABBIT_PORT: z.coerce.number().min(1),
  RABBIT_USER: z.string(),
  REDIS_ADDRESS: z.string(),
  REDIS_PASSWORD: z.string()
});

/**
 * Environment variable object that has been checked.
 */
const environment = environmentSchema.parse(process.env);
export default environment;
