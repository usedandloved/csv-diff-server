import { Validator } from "@cfworker/json-schema";
import fs from "fs-extra";

const snapshotSchema = {
  type: "object",
  required: ["source", "revision"],
  maxProperties: 3,
  properties: {
    dataset: { type: "string" },
    source: { type: "string" },
    revision: { type: "string" },
  },
};

const schema = {
  type: "object",
  required: ["base", "delta"],
  maxProperties: 3,
  properties: {
    base: snapshotSchema,
    delta: snapshotSchema,
  },
};
const validator = new Validator(schema);

const diff = async (params, File) => {
  const result = validator.validate(params);

  // console.log({ params });
  // console.log(result);

  if (!result?.valid) {
    console.error("invalid params");
    return;
  }

  const { base, delta } = params;

  // await processSnapshot(File, base);

  // return;

  await processSnapshot(File, delta);

  return;
};

const processSnapshot = async (File, { dataset, source, revision }) => {
  let file;
  if (!dataset) dataset = "default";

  // console.log(dataset, snapshot);
  file = await File.GetByDatasetRevision({
    dataset,
    revision,
  });

  if (!file && !source) {
    throw "snapshot does not exist, please define source";
  }

  // Does dbFile exist?
  if (!file) {
    file = { dataset, source, revision, path: null };
    try {
      await File.Create(file);
    } catch (e) {
      throw e;
    }
  }

  // Does dbFile.source match source?
  if (file.source && source && file.source !== source) {
    throw "a different source was previously used for for this dataset and revision";
  }

  // file.path is not set. Or file.path is not on the file system
  if (!file.path || !(await fs.pathExists(file.path))) {
    // Download the source to local
  }

  console.log({ file });

  // TODO: mode stuff here

  return;
};

export { diff };
