/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { BucketItem, Client } from "minio";

/**
 * Provides methods for interacting with MinIO
 */
export class MinioService {
  /** The MinIO client used to interact with the MinIO server */
  public client: Client;

  /** Name of the bucket for storing addons */
  public readonly addonBucket: string = "addons";

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: Number(process.env.MINIO_PORT!),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESSKEY!,
      secretKey: process.env.MINIO_SECRETKEY!
    });
  }

  /**
   * Empties the specified bucket by recursively removing all objects
   * @param bucketName Name of the bucket to empty
   * @returns A promise that resolves when the bucket is emptied
   */
  public async emptyBucket(bucketName: string): Promise<void> {
    const objects = await this.listObjects(bucketName);

    return new Promise((resolve, reject) => {
      this.client.removeObjects(
        bucketName,
        objects.map(obj => obj.name!),
        err => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Recursively lists all objects in the specified bucket
   * @param bucketName Name of the bucket to list objects from
   * @returns A promise that resolves with an array of bucket items
   */
  private async listObjects(bucketName: string): Promise<BucketItem[]> {
    const data: BucketItem[] = [];
    const stream = this.client.listObjectsV2(bucketName, undefined, true);

    return new Promise((resolve, reject) => {
      stream.on("data", obj => data.push(obj));
      stream.on("error", err => reject(err));
      stream.on("end", () => resolve(data));
    });
  }

  /**
   * Retrieves the content of the README.md file associated with the specified addon
   * @param addonId The unique identifier of the addon
   * @returns A promise that resolves with the content of the README.md file as a string
   */
  public async getReadme(addonId: string): Promise<string> {
    const objectName = `${addonId}/README.md`;

    return new Promise((resolve, reject) => {
      this.client.getObject(this.addonBucket, objectName, (err, dataStream) => {
        if (err) reject(err);

        const chunks: Buffer[] = [];

        dataStream.on("data", chunk => chunks.push(chunk));

        dataStream.on("error", err => reject(err));

        dataStream.on("end", () => {
          const data = Buffer.concat(chunks);
          resolve(data.toString());
        });
      });
    });
  }
}
