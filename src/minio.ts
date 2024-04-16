/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

import { BucketItem, Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT!),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESSKEY!,
  secretKey: process.env.MINIO_SECRETKEY!
});

export const addonBucket = "addons";

// UTILS

export const emptyBucket = async (bucketName: string): Promise<void> => {
  const objects = await listObjects(bucketName);

  return new Promise((resolve, reject) => {
    minioClient.removeObjects(
      bucketName,
      objects.map(obj => obj.name!),
      err => (err ? reject(err) : resolve())
    );
  });
};

const listObjects = async (bucketName: string): Promise<BucketItem[]> => {
  const data: BucketItem[] = [];
  const stream = minioClient.listObjectsV2(bucketName, undefined, true);

  return new Promise((resolve, reject) => {
    stream.on("data", obj => data.push(obj));
    stream.on("error", err => reject(err));
    stream.on("end", () => resolve(data));
  });
};
