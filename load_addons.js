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
      repo: "https://github.com/PolarExpress/centrality"
    },
    {
      name: "Community Detection",
      repo: "https://github.com/PolarExpress/community-detection"
    },
    {
      name: "Link Prediction",
      repo: "https://github.com/PolarExpress/link-prediction"
    },
    {
      name: "Shortest Path",
      repo: "https://github.com/PolarExpress/shortest-path"
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
        console.log(`Uploading ${id}/${file}`);
        const buffer = await readFile(resolve(dist_path, file));
        minio.putObject("addons", `${id}/${file}`, buffer);
      }
    }
  }

  for (const addon of mlAddons) {
    const document = await collection.insertOne({
      name: addon.name,
      summary: "",
      icon: "icon.png",
      category: "MACHINE_LEARNING",
      authorId: author.insertedId
    });
    console.log("Inserted document:", document.insertedId);

    const id = document.insertedId.toString();
    const adapterDest = "../ml-addon-adapter";
    const envFilePath = "../../deployment/dockercompose/.env";

    const serviceDest = resolve(__dirname, "addons", `${id}-service`);
    console.log(`Cloning and building ${addon.name}`);
    await pexec(`git clone ${addon.repo} ${serviceDest}`);
    await pexec(`cd ${serviceDest} && docker build -t ${id}-service .`);
    await pexec(`docker run -d --name ${id}-service --network=graphpolaris_network ${id}-service --prod true`);

    await pexec(`cd ${adapterDest} && docker build -t ${id}-adapter .`);
    await pexec(`docker run -d --name ${id}-adapter --env-file ${envFilePath} --network=graphpolaris_network -e ADDON_ID=${id} ${id}-adapter`);

    minio.putObject(
      "addons",
      `${addon.id}/README.md`,
      "This is a placeholder README.md file."
    );
  }

  await mongo.close();
})();
