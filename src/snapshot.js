import fs from 'fs-extra';

import { downloadFile } from './lib/fs.js';

const processSnapshot = async (File, { dataset, source, revision }) => {
  let file;
  const done = [];

  if (!dataset) dataset = 'default';

  // console.log(dataset, snapshot);
  file = await File.GetByDatasetRevision({
    dataset,
    revision,
  });

  if (!file && !source) {
    throw 'snapshot does not exist, please define source';
  }

  // Does dbFile exist?
  if (!file) {
    file = { dataset, source, revision, path: null };
    try {
      await File.Create(file);
    } catch (e) {
      throw e;
    }
    done.push('created');
  }

  // Does dbFile.source match source?
  if (file.source && source && file.source !== source) {
    throw 'a different source was previously used for for this dataset and revision';
  }

  // file.path is not set. Or file.path is not on the file system
  if (!file.path || !(await fs.pathExists(file.path))) {
    // Download the source to local
    try {
      file.path = await downloadFile(
        source,
        `/app/data/snapshots/${dataset}/${revision}.csv`
      );
    } catch (e) {
      throw e;
    }

    try {
      await File.UpdateByDatasetRevision(file);
    } catch (e) {
      throw e;
    }
    done.push('downloaded');
  }

  // console.log({ file });

  // TODO: mode stuff here

  return { file, done };
};

export { processSnapshot };
