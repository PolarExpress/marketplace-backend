/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { Request, Response } from "express";
import mime from "mime-types";
import { BucketItem, Client } from "minio";

import environment from "./environment";
import {
  CustomError,
  FileNotFoundError,
  InternalServerError,
  InvalidFilePathError,
  MinioError
} from "./errors";

/**
 * Provides methods for interacting with MinIO.
 */
export class MinioService {
  /**
   * Name of the bucket for storing addons.
   */
  public readonly addonBucket: string = "addons";

  /**
   * The MinIO client used to interact with the MinIO server.
   */
  public client: Client;

  constructor() {
    try {
      this.client = new Client({
        accessKey: environment.MINIO_ACCESSKEY,
        endPoint: environment.MINIO_ENDPOINT,
        port: environment.MINIO_PORT,
        secretKey: environment.MINIO_SECRETKEY,
        useSSL: false
      });
    } catch (error) {
      throw new MinioError(`Failed to initialize MinIO client: ${error}`);
    }
  }

  /**
   * Recursively lists all objects in the specified bucket.
   *
   * @param   bucketName Name of the bucket to list objects from.
   *
   * @returns            A promise that resolves with an array of bucket items.
   */
  private async listObjects(bucketName: string): Promise<BucketItem[]> {
    const data: BucketItem[] = [];
    const stream = this.client.listObjectsV2(bucketName, undefined, true);

    return new Promise((resolve, reject) => {
      stream.on("data", object => data.push(object));
      stream.on("error", error => reject(new MinioError(error.message)));
      stream.on("end", () => resolve(data));
    });
  }

  /**
   * Empties the specified bucket by recursively removing all objects.
   *
   * @param   bucketName Name of the bucket to empty.
   *
   * @returns            A promise that resolves when the bucket is emptied.
   */
  public async emptyBucket(bucketName: string): Promise<void> {
    try {
      const objects = await this.listObjects(bucketName);

      return new Promise((resolve, reject) => {
        this.client.removeObjects(
          bucketName,
          objects.map(object => object.name!),
          error =>
            error
              ? reject(new MinioError("Failed to remove objects"))
              : resolve()
        );
      });
    } catch (error) {
      throw error instanceof CustomError ? error : new InternalServerError();
    }
  }

  /**
   * Retrieves the content of a file from MinIO.
   *
   * @param   bucketName Name of the bucket the file is in.
   * @param   objectPath Path of the object within the bucket.
   *
   * @returns            A promise that resolves with a Buffer containing the
   *   file content.
   */
  public async readFile(
    bucketName: string,
    objectPath: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // @ts-expect-error exported minio types are wrong
      this.client.getObject(bucketName, objectPath, (error, dataStream) => {
        if (error) {
          return error.message.includes("does not exist")
            ? reject(new FileNotFoundError(objectPath))
            : reject(new MinioError(`Failed to read file: ${objectPath}`));
        }

        const chunks: Buffer[] = [];

        dataStream.on("data", (chunk: Buffer) => chunks.push(chunk));

        dataStream.on("error", (error: Error) =>
          reject(new MinioError(error.message))
        );

        dataStream.on("end", () => {
          const data = Buffer.concat(chunks);
          resolve(data);
        });
      });
    });
  }

  /**
   * Serves a file from MinIO. Streams the file directly to the provided
   * response object.
   */
  public serveFile(request: Request, response: Response) {
    const filepath = request.params.filepath;
    const [bucket, ...objectPath] = filepath.split("/");

    if (!bucket || objectPath.length === 0) {
      throw new InvalidFilePathError(filepath);
    }

    // @ts-expect-error exported minio types are wrong
    this.client.getObject(bucket, objectPath.join("/"), (error, stream) => {
      if (error) {
        throw error.message.includes("does not exist")
          ? new FileNotFoundError(filepath)
          : new MinioError(`Failed to serve file: ${filepath}`);
      }
      stream.pipe(response);
    });

    const type = mime.lookup(filepath) || "text/plain";
    response.header("Content-Type", type);
  }
}
