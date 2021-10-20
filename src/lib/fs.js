import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';

const paths = {
  url: process.env.PATHS_URL?.replace(/\/$/, '') || '',
  data: process.env.PATHS_DIFF || `/app/data`,
  database: process.env.PATHS_DATABASE || `/app/data/default.db`,
};

const downloadFile = async (source, target, options = {}) => {
  await fs.ensureDir(path.dirname(target));

  return await fetch(source).then(
    (res) =>
      new Promise(async (resolve, reject) => {
        const dest = fs.createWriteStream(target);

        // if (options.fileHeaders) dest.write(options.fileHeaders.join(',') + '\n');
        // console.log(res.headers.raw());

        if ('application/gzip' === res.headers.get('content-type')) {
          res.body.pipe(zlib.createGunzip()).pipe(dest);
        } else {
          res.body.pipe(dest);
        }
        res.body.on('end', resolve(target));
        dest.on('error', (e) => reject(e));
      })
  );
};

export { paths, downloadFile };
