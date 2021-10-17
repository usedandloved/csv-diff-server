import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';

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

export { downloadFile };
