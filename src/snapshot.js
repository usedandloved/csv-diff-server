import fs from 'fs-extra';

import { downloadFile, paths } from './lib/fs.js';
import { logger } from './lib/logger.js';

const processSnapshot = async (
  File,
  { dataset, source, revision },
  { headers } = {}
) => {
  let file;
  const done = [];

  // logger.debug({ headers });

  if (!dataset) dataset = 'default';

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
      // Get the file (with id).
      file = await File.GetByDatasetRevision({
        dataset,
        revision,
      });
    } catch (e) {
      logger.error(e);

      throw e;
    }
    done.push('created');
  }

  // Does dbFile.source match source?
  if (file.source && source && file.source !== source) {
    logger.warn(
      'a different source was previously used for for this dataset and revision'
    );
  }

  // file.path is not set. Or file.path is not on the file system
  if (!file.path || !(await fs.pathExists(file.path))) {
    // Download the source to local

    const target = `${paths.data}/${dataset}/snapshots/${revision}.csv`;

    try {
      file.path = await downloadFile(source, target, { fileHeaders: headers });
    } catch (e) {
      logger.error(e);
      throw e;
    }

    try {
      await File.UpdateByDatasetRevision(file);
    } catch (e) {
      logger.error(e);
      throw e;
    }
    done.push('downloaded');
  }

  // TODO: mode stuff here

  return { file, done };
};

export { processSnapshot };
