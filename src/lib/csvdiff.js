import { exec } from 'child_process';
import path from 'path';

export default async ({ base, delta, target }) => {
  let diffResult;
  try {
    diffResult = await new Promise(function (resolve, reject) {
      let stderr = '',
        lineCount = 0;

      /**
       * csvdiff output is piped to a file in /tmp...
       * because a docker shared volume (on) macOS is too slow
       * and it exits with signal: SIGPIPE
       */

      // Copy the first line
      // Then run csvdiff and pipe output to target file.
      // echo "$(head -n1 ${original}),UAL_DIFF_STATE" > ${target}

      const script = exec(
        `
        mkdir -p ${path.dirname(target)}
        csvdiff ${base} ${delta} -o rowmark --time >> ${target} 
        wc -l < ${target}
        `
      );

      script.stdout.on('data', (data) => {
        lineCount = parseInt(data);
      });

      script.stderr.on('data', (data) => {
        stderr += `stderr: ${data}\n`;
      });

      script.on('close', (c, s) => {
        if (0 === c) return resolve({ lineCount, target });
        console.error(`child process exited w/ code ${c} & signal ${s}`);
        return reject(new Error(stderr));
      });
    });
  } catch (e) {
    return console.error(e);
  }
  return diffResult;
};
