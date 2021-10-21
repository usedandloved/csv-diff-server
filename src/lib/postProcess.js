import csv from '@fast-csv/parse';
import { format } from '@fast-csv/format';
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
    writePromises = [],
    result = {},
    onePercent = Math.round(lineCount / 100);

  // TODO: based on the options, make a unique hash

  //   return;

  const addedTarget = `${target.dir}/ADDED-0-${target.extension}`;
  const modifiedTarget = `${target.dir}/MODIFIED-0-${target.extension}`;
  const deletedTarget = `${target.dir}/DELETED-0-${target.extension}`;

  const csvStreams = {
    ADDED: [format({ headers: true })],
    MODIFIED: [format({ headers: true })],
    DELETED: [format({ headers: true })],
  };

  await Promise.all([
    await fs.ensureFile(addedTarget),
    await fs.ensureFile(modifiedTarget),
    await fs.ensureFile(deletedTarget),
  ]);

  const writeStreams = {
    ADDED: [fs.createWriteStream(addedTarget)],
    MODIFIED: [fs.createWriteStream(modifiedTarget)],
    DELETED: [fs.createWriteStream(deletedTarget)],
  };

  csvStreams.ADDED[0]
    .pipe(writeStreams.ADDED[0])
    .on('end', () => writeStreams.ADDED[0].end());

  csvStreams.MODIFIED[0]
    .pipe(writeStreams.MODIFIED[0])
    .on('end', () => writeStreams.MODIFIED[0].end());

  csvStreams.DELETED[0]
    .pipe(writeStreams.DELETED[0])
    .on('end', () => writeStreams.DELETED[0].end());

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

          // console.log('start');

          if (!processedRow) return;

          const diffState = row?.CSVDIFF_STATE || 'ADDED';

          // if ('ADDED' === diffState) {
          //   console.log(processedRow);
          // }

          if (undefined === validRows[diffState]) validRows[diffState] = 0;

          const thisValidRows = validRows[diffState]++;
          validRows.total++;

          // await createWriteStreamPromises;

          if (thisValidRows % batchSize === 0 && thisValidRows > 0) {
            // console.log('in conditional');
            const thisTarget = `${target.dir}/${diffState}-${thisValidRows}-${target.extension}`;

            await fs.ensureFile(thisTarget);

            const newCsvStream = format({ headers: true });

            const newWriteStream = fs.createWriteStream(
              thisTarget
              // { flags: 'a' }
            );

            newCsvStream
              .pipe(newWriteStream)
              .on('end', () => newWriteStream.end());

            const writePromisesTemp = [...writePromises];
            const oldCsvStream = csvStreams[diffState].slice(-1)[0];

            await Promise.all([writePromisesTemp]);

            csvStreams[diffState].push(newCsvStream);
            oldCsvStream.end();
          }

          writePromises.push(
            new Promise(async (res, rej) => {
              try {
                await csvStreams[diffState].slice(-1)[0].write(processedRow);
              } catch (e) {
                console.error(e);
                rej(e);
              }
              res();
            })
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
        })
        .on('end', async () => {
          // Because end is called before writePromises.push is run.
          await new Promise((resolve) => setTimeout(resolve, 500));

          await Promise.all(writePromises);

          console.log('all promises are resolved');

          csvStreams.ADDED.slice(-1)[0].end();
          csvStreams.MODIFIED.slice(-1)[0].end();
          csvStreams.DELETED.slice(-1)[0].end();

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
