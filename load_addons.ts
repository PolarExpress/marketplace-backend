/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */

require("dotenv/config");
import environment from "./src/environment";

const { promisify } = require("node:util");
const { resolve } = require("node:path");
const { exec } = require("node:child_process");
const { mkdir, readFile, readdir, rm } = require("node:fs/promises");

const { MongoClient, ObjectId } = require("mongodb");
const Minio = require("minio");

(async () => {
  const visAddons = ["rawjsonvis"];
  const mlAddons = [
    {
      id: "ffff00000000000000000000",
      name: "Centrality"
    },
    {
      id: "ffff00000000000000000001",
      name: "Community Detection"
    },
    {
      id: "ffff00000000000000000002",
      name: "Link Prediction"
    },
    {
      id: "ffff00000000000000000003",
      name: "Shortest Path"
    }
  ];

  const pexec = promisify(exec);

  const mongo = await MongoClient.connect(environment.MONGO_URI);
  const database = mongo.db(environment.MP_DATABASE_NAME);
  const collection = database.collection("addons");

  const author = await database.collection("authors").insertOne({
    userId: ""
  });

  const minio = new Minio.Client({
    accessKey: environment.MINIO_ACCESSKEY,
    endPoint: environment.MINIO_ENDPOINT,
    port: environment.MINIO_PORT,
    secretKey: environment.MINIO_SECRETKEY,
    useSSL: false
  });

  const addons_dir = resolve(__dirname, "addons");
  try {
    await rm(addons_dir, { recursive: true });
  } catch {
  } finally {
    await mkdir(addons_dir);
  }

  await collection.deleteMany();

  if (!(await promisify(minio.bucketExists.bind(minio))("addons")))
    await promisify(minio.makeBucket.bind(minio))("addons");

  for (const addon of visAddons) {
    const document = await collection.insertOne({
      authorId: author.insertedId,
      category: "VISUALISATION",
      default: true,
      icon: "icon.png",
      name: addon,
      summary: ""
    });

    const id = document.insertedId.toString();

    const destination = resolve(__dirname, "addons", id);
    console.log(`Cloning and building ${addon}`);
    const url = `git@github.com:PolarExpress/${addon}.git`;
    await pexec(`git clone ${url} ${destination}`);

    const iconPath = resolve(__dirname, "icon.png");
    await pexec(`cd ${destination} && pnpm i && pnpm build`);

    minio.putObject(
      "addons",
      `${id}/README.md`,
      await readFile(resolve(destination, "README.md"))
    );

    const dist_path = resolve(dest, "dist");
    for (const file_path of await readdir(dist_path, { recursive: true })) {
      const normalised_file_path = file_path.replace("\\", "/");
      if (normalised_file_path.match(/\.\w+$/)) {
        console.log(`Uploading ${id}/${normalised_file_path}`);
        const buffer = await readFile(resolve(dist_path, file_path));
        minio.putObject("addons", `${id}/${normalised_file_path}`, buffer);
      }
    }
  }

  for (const addon of mlAddons) {
    const document = await collection.insertOne({
      _id: new ObjectId(addon.id),
      authorId: author.insertedId,
      category: "MACHINE_LEARNING",
      icon: "icon.png",
      name: addon.name,
      summary: ""
    });

    console.log("Inserted document:", document.insertedId);

    if (addon.name === "Link Prediction") {
      const id = addon.id;
      const dest = resolve(__dirname, "addons", id);
      console.log(`Cloning and building ${addon.name}`);
      const url = `git@github.com:PolarExpress/graphpolaris-ml-settings-api.git`;
      await pexec(`git clone ${url} ${dest}`);
      await pexec(`cd ${dest} && pnpm i && pnpm build`);

      minio.putObject(
        "addons",
        `${id}/README.md`,
        await readFile(resolve(dest, "README.md"))
      );

      const dist_path = resolve(dest, "dist");
      for (const file_path of await readdir(dist_path, { recursive: true })) {
        const normalised_file_path = file_path.replace("\\", "/");
        if (normalised_file_path.match(/\.\w+$/)) {
          console.log(`Uploading ${id}/${normalised_file_path}`);
          const buffer = await readFile(resolve(dist_path, file_path));
          minio.putObject("addons", `${id}/${normalised_file_path}`, buffer);
        }
      }
    } else {
      minio.putObject(
        "addons",
        `${addon.id}/README.md`,
        "This is a placeholder README.md file."
      );
    }
  }

  await mongo.close();
})();
