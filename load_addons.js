require("dotenv/config");

const { promisify } = require("node:util");
const { resolve } = require("node:path");
const { exec } = require("node:child_process");
const { readFile, mkdir, readdir, rm } = require("node:fs/promises");

const { MongoClient, ObjectId } = require("mongodb");
const Minio = require("minio");

(async () => {
  const visAddons = ["rawjsonvis"];
  const mlAddons = [
    {
      name: "Centrality",
      id: "ffff00000000000000000000"
    },
    {
      name: "Community Detection",
      id: "ffff00000000000000000001"
    },
    {
      name: "Link Prediction",
      id: "ffff00000000000000000002"
    },
    {
      name: "Centrality",
      id: "ffff00000000000000000003"
    }
  ];

  const pexec = promisify(exec);

  const mongo = await MongoClient.connect(process.env.MONGO_URI);
  const db = mongo.db(process.env.MP_DATABASE_NAME);
  const collection = db.collection("addons");

  const author = await db.collection("authors").insertOne({
    userId: ""
  });

  const minio = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESSKEY,
    secretKey: process.env.MINIO_SECRETKEY
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
      name: addon,
      summary: "",
      icon: "icon.png",
      category: "VISUALISATION",
      authorId: author.insertedId
    });

    const id = document.insertedId.toString();

    const dest = resolve(__dirname, "addons", id);
    console.log(`Cloning and building ${addon}`);
    const url = `git@github.com:PolarExpress/${addon}.git`;
    await pexec(`git clone ${url} ${dest}`);

    const icon_path = resolve(__dirname, "icon.png");
    await pexec(`cd ${dest} && pnpm i && pnpm build`);

    minio.putObject(
      "addons",
      `${id}/README.md`,
      await readFile(resolve(dest, "README.md"))
    );

    const dist_path = resolve(dest, "dist");
    for (const file of await readdir(dist_path, { recursive: true })) {
      if (file.match(/\.\w+$/)) {
        console.log(`Uploading ${id}/dist/${file}`);
        const buffer = await readFile(resolve(dist_path, file));
        minio.putObject("addons", `${id}/dist/${file}`, buffer);
      }
    }
  }

  for (const addon of mlAddons) {
    const document = await collection.insertOne({
      _id: new ObjectId(addon.id),
      name: addon.name,
      summary: "",
      icon: "icon.png",
      category: "MACHINE_LEARNING",
      authorId: author.insertedId
    });
    console.log("Inserted document:", document.insertedId);
    minio.putObject(
      "addons",
      `${addon.id}/README.md`,
      "This is a placeholder README.md file."
    );
  }

  await mongo.close();
})();
