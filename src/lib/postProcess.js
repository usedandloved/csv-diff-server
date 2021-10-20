import csv from '@fast-csv/parse';
import csvWriter from 'csv-write-stream';
import fs from 'fs-extra';
import jsonata from 'jsonata';

const validateRow = async (data, validateFilters) => {
  return true;
};

const processRow = async (row, transformPresets) => {
  return row;
};

const postProcess = async (diff, options) => {
  console.log({ diff, options });

  const { line_count: lineCount } = diff;

  let { writerHeaders } = options;
  const { batchSize = 500 } = options;
  console.log(batchSize);

  console.log('>>>>> Enter processCsvFile');
  // logger.info({ writerHeaders, validateFilters });

  let csvParseResult,
    validRows = {},
    writers = {},
    writePromises = [],
    result = {},
    onePercent = Math.round(lineCount / 100);

  //   return;

  try {
    csvParseResult = await new Promise((resolve, reject) => {
      fs.createReadStream(diff.path)
        .on('error', (error) => {
          // In-case file doesn't exist
          reject(error);
        })
        .pipe(
          csv
            .parse({
              // Reference: https://c2fo.github.io/fast-csv/docs/parsing/options#headers
              headers: (headers) => {
                // TODO: add a filter for writerHeaders
                // Otherwise, dist csv could have many un-used headers.
                if (!writerHeaders) writerHeaders = Object.values(headers);

                return headers;
              },
            })
            .validate((data, cb) => {
              setImmediate(async () =>
                cb(null, await validateRow(data, validateFilters))
              );
            })
        )
        .on('error', (error) => {
          // console.error(error);
          reject(error);
        })
        .on('data', async (row) => {
          let processedRow = await processRow(row, transformPresets);

          // processedRow = await filters(
          //   { processedRow, row },
          //   'processedRow',
          //   options
          // );

          if (!processedRow) return;

          const diffState = row?.UAL_DIFF_STATE || 'ADDED';

          // console.log(diffState);

          if (undefined === validRows[diffState]) validRows[diffState] = 0;
          if (!writers[diffState]) writers[diffState] = [];
          if (!result[diffState]) result[diffState] = [];

          const thisValidRows = validRows[diffState]++;

          // if (thisValidRows % 1000 === 0) {
          //   console.log({ thisValidRows });
          // }
          if (thisValidRows % onePercent === 0) {
            // console.log({ thisValidRows });
            const percent = thisValidRows / onePercent;
            // console.log({ percent });
            updatePercentage(percent);
          }

          if (thisValidRows % batchSize === 0) {
            const relativePath = `/${csvId}/${version}/${diffState}/dist-${thisValidRows}.csv`;
            const absolutePath = `${distPath}${relativePath}`;

            result[diffState].push(relativePath);

            if (writers[diffState].length) {
              setTimeout(
                function (writer) {
                  console.log('doing end');
                  writer.end();
                },
                3000,
                writers[diffState][writers[diffState].length - 1]
              );
            }

            writers[diffState].push(
              csvWriter({
                headers: writerHeaders,
              })
            );

            await fs.ensureFile(absolutePath);

            await writers[diffState][writers[diffState].length - 1].pipe(
              fs.createWriteStream(absolutePath)
            );
          }
          // console.log({ processedRow });

          writePromises.push(
            await writers[diffState][writers[diffState].length - 1].write(
              processedRow
            )
          );
        })
        .on('end', async () => {
          await Promise.all([
            ...writePromises,
            writers.added?.[writers.added.length - 1]?.end(),
            writers.modified?.[writers.modified.length - 1]?.end(),
            writers.deleted?.[writers.deleted.length - 1]?.end(),
          ]);

          return resolve({
            processed: true,
          });
        });
    });
  } catch (error) {
    // Handle rejection here
    // console.log(error);
    throw error;
  }

  console.log('<<<<<< Exit processCsvFile');
  return result;
};
export { postProcess };
