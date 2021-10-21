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

const postProcess = async (diff, options, target) => {
  // console.log({ diff, options, target });

  const { lineCount: lineCount } = diff;

  const transformPresets = {},
    validateFilters = {};

  let { writerHeaders } = options;
  const { batchSize = 500 } = options;
  console.log(batchSize);

  console.log('>>>>> Enter processCsvFile');
  // logger.info({ writerHeaders, validateFilters });

  let csvParseResult,
    validRows = { total: 0 },
    writers = {},
    writePromises = [],
    createWriteStreamPromises,
    result = {},
    onePercent = Math.round(lineCount / 100);

  // TODO: based on the options, make a unique hash

  //   return;

  const initWriters = async (writerHeaders) => {
    const addedTarget = `${target.dir}/ADDED-0-${target.extension}`;
    const modifiedTarget = `${target.dir}/MODIFIED-0-${target.extension}`;
    const deletedTarget = `${target.dir}/DELETED-0-${target.extension}`;

    await Promise.all([
      fs.ensureFile(addedTarget),
      fs.ensureFile(modifiedTarget),
      fs.ensureFile(deletedTarget),
    ]);
    writers = {
      ADDED: [
        csvWriter({
          headers: writerHeaders,
        }),
      ],
      MODIFIED: [
        csvWriter({
          headers: writerHeaders,
        }),
      ],
      DELETED: [
        csvWriter({
          headers: writerHeaders,
        }),
      ],
    };

    createWriteStreamPromises = Promise.all([
      writers.ADDED[0].pipe(await fs.createWriteStream(addedTarget)),
      writers.MODIFIED[0].pipe(await fs.createWriteStream(modifiedTarget)),
      writers.DELETED[0].pipe(await fs.createWriteStream(deletedTarget)),
    ]);

    return writers;
  };

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

                // console.log({ headers });

                initWriters(writerHeaders);

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

          console.log('start');

          if (!processedRow) return;

          const diffState = row?.CSVDIFF_STATE || 'ADDED';

          if ('ADDED' === diffState) {
            console.log(processedRow);
          }

          if (undefined === validRows[diffState]) validRows[diffState] = 0;

          const thisValidRows = validRows[diffState]++;
          validRows.total++;

          await createWriteStreamPromises;

          if (thisValidRows % batchSize === 0 && thisValidRows > 0) {
            console.log('in conditional');
            const thisTarget = `${target.dir}/${diffState}-${thisValidRows}-${target.extension}`;
            // Important to keep the incremental here
            // towards start of the function

            await fs.ensureFile(thisTarget);

            const newWriter = csvWriter({
              headers: writerHeaders,
            });

            await newWriter.pipe(await fs.createWriteStream(thisTarget));

            // setTimeout(
            //   (writer) => {
            //     console.log('doing end');
            //     writer.end();
            //   },
            //   3000,
            //   writers[diffState].slice(-1)[0]
            // );

            writers[diffState].push(newWriter);
          }

          if ('ADDED' === diffState) {
            console.log('writing');
          }

          const promise = await writers[diffState][
            writers[diffState].length - 1
          ].write(processedRow);

          console.log(promise);

          writePromises.push(
            writers[diffState][writers[diffState].length - 1].write(
              processedRow
            )
          );

          // if (validRows[diffState] % 1000 === 0) {
          //   console.log({ validRows[diffState] });
          // }
          // if (validRows.total % onePercent === 0) {
          //   // console.log({ validRows[diffState] });
          //   const percent = validRows[diffState] / onePercent;
          //   // console.log({ percent });
          //   updatePercentage(percent);
          // }
          return;

          if (!result[diffState]) result[diffState] = [];
        })
        .on('end', async () => {
          // Because end is called before writePromises.push is run.
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await Promise.all(writePromises);
          await Promise.all([
            writers.added?.[writers.added.length - 1]?.end(),
            writers.modified?.[writers.modified.length - 1]?.end(),
            writers.deleted?.[writers.deleted.length - 1]?.end(),
          ]);

          console.log('all promises are resolved');

          return resolve({
            processed: true,
          });
        });
    });
  } catch (error) {
    // Handle rejection here
    console.error(error);
    throw error;
  }

  console.log('<<<<<< Exit processCsvFile');
  return result;
};
export { postProcess };
