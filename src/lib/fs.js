import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import zlib from 'zlib';

import { logger } from './logger.js';

const paths = {
  url: process.env.PATHS_URL?.replace(/\/$/, '') || '',
  data: process.env.PATHS_DIFF || `/tmp/data`,
  database: process.env.PATHS_DATABASE || `/app/data/default.db`,
};

const withUrls = (data) => {
  const populate = (object) => {
    if (object.path && !object.url) {
      object.url = object.path.replace(paths.data, `${paths.url}/data`);
    }
  };

  // logger.debug(data);

  if (Array.isArray(data)) {
    data.forEach((object) => {
      populate(object);
    });
  } else if (typeof data === 'object') {
    // Object.keys(data).forEach((x) => {
    //   populate(data[x]);
    // });
    populate(data);
  }

  return data;
};

const downloadFile = async (source, target, options = {}) => {
  await fs.ensureDir(path.dirname(target));

  return await fetch(source).then(
    (res) =>
      new Promise(async (resolve, reject) => {
        const dest = fs.createWriteStream(target);

        if (options.fileHeaders)
          dest.write(options.fileHeaders.join(',') + '\n');
        // logger.debug(res.headers.raw());

        if ('application/gzip' === res.headers.get('content-type')) {
          res.body.pipe(zlib.createGunzip()).pipe(dest);
        } else {
          res.body.pipe(dest);
        }
        res.body.on('end', () => resolve(target));
        dest.on('error', (e) => reject(e));
      })
  );
};

const isDistPathsIsMissing = async (dists) => {
  logger.debug('in isDistPathsIsMissing');
  // logger.debug(dists);
  const promises = [];
  for (const dist of dists) {
    promises.push(fs.pathExists(dist.path));
  }
  return (await Promise.all(promises)).includes(false);
};

export { paths, withUrls, downloadFile, isDistPathsIsMissing };
