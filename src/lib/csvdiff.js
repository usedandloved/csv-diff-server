import { exec } from 'child_process';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';

import { objectHash } from './utils.js';

export default async ({ base, delta, flagString, target }) => {
  let diffResult;
  try {
    // Check the 2 files exist
    const filesExist = await Promise.all([
      fs.pathExists(base),
      fs.pathExists(delta),
    ]);
    if (filesExist.includes(false)) throw 'base or delta files not found';

    diffResult = await new Promise(function (resolve, reject) {
      let stderr = '',
        lineCount = 0,
        csvdiffConsole = {};

      /**
       * csvdiff output is piped to a file in /tmp...
       * because a docker shared volume (on) macOS is too slow
       * and it exits with signal: SIGPIPE
       */

      // Copy the first line
      // Then run csvdiff and pipe output to target file.
      // echo "$(head -n1 ${original}),CSVDIFF_STATE" > ${target}

      // console.log(`${base} ${delta} ${flagString}`);

      const script = exec(
        ` 
        echo "$(head -n1 ${base}),CSVDIFF_STATE" > ${target}
        mkdir -p ${path.dirname(target)}
        csvdiff ${base} ${delta} ${flagString} >> ${target} 
        wc -l < ${target}`
      );

      script.stdout.on('data', (data) => {
        lineCount = parseInt(data);
      });

      script.stderr.on('data', (data) => {
        stderr += `stderr: ${data}\n`;

        const timeMatch = data.match(/^csvdiff took (\d+.\d+)ms/);
        if (timeMatch?.[1]) {
          return (csvdiffConsole.time = parseFloat(timeMatch[1]));
        }

        const countMatch = [
          ...data.matchAll(/^(Additions|Modifications|Deletions) (\d+)/gm),
        ];
        if (countMatch.length) {
          for (const [_, label, count] of countMatch) {
            csvdiffConsole[label.toLowerCase()] = parseInt(count);
          }
          return;
        }
      });

      script.on('close', (c, s) => {
        if (0 === c)
          return resolve({ lineCount, path: target, ...csvdiffConsole });
        console.error(`child process exited w/ code ${c} & signal ${s}`);
        return reject(new Error(stderr));
      });
    });
  } catch (e) {
    return console.error(e);
  }
  return diffResult;
};

const processFlags = async (flags) => {
  if (!flags) flags = {};

  const ordered = Object.keys(flags)
    .sort()
    .reduce((obj, key) => {
      obj[key] = flags[key];
      return obj;
    }, {});

  let stringArray = [],
    extensionArray = [];
  for (const [key, value] of Object.entries(ordered)) {
    // console.log(`${key}: ${value}`);
    if (['lazyquotes', 'time'].includes(key) && value) {
      stringArray.push(`--${key}`);
    } else {
      stringArray.push(`--${key} ${value}`);
    }
  }

  let { format = 'diff', ...flagsWithoutFormat } = ordered;

  const json = JSON.stringify(flagsWithoutFormat);
  // console.log(json);
  const hash = Object.keys(flagsWithoutFormat).length
    ? objectHash(flagsWithoutFormat)
    : '';

  const extensions = {
    diff: 'diff.txt',
    'word-diff': 'word-diff.txt',
    'color-words': 'color-words.txt',
    json: 'json',
    'legacy-json': 'legacy.json',
    rowmark: 'rowmark.csv',
  };

  // The extension is unique based on the format

  // And a unique hash is generated based on the other flags

  return {
    flagString: stringArray.join(' '),
    flagHash: hash,
    flagHashShort: hash.substring(0, 6),
    extension: extensions[format],
    format: format,
  };
};

export { processFlags };
