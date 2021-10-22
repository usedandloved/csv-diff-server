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

  const { lineCount: lineCount } = diff,
    { batchSize = 500 } = options,
    csvStreams = {
      ADDED: [],
      MODIFIED: [],
      DELETED: [],
    },
    writeStreams = {
      ADDED: [],
      MODIFIED: [],
      DELETED: [],
    },
    transformPresets = {},
    validateFilters = {};

  let csvParseResult,
    { writerHeaders } = options,
    validRows = { ADDED: 0, MODIFIED: 0, DELETED: 0, total: 0 },
    writePromises = [],
    result = {},
    onePercent = Math.round(lineCount / 100);

  const makeCsvStream = async (diffState, i) => {
    const thisTarget = `${target.dir}/${diffState}-${i}-${target.extension}`;

    await fs.ensureFile(thisTarget);

    const tempCsvStream = format({ headers: true });

    writeStreams[diffState][i] = fs.createWriteStream(thisTarget);

    tempCsvStream
      .pipe(writeStreams[diffState][i])
      .on('end', () => writeStreams[diffState][i].end());

    return (csvStreams[diffState][i] = tempCsvStream);
  };

  try {
    await Promise.all([
      makeCsvStream('ADDED', 0),
      makeCsvStream('MODIFIED', 0),
      makeCsvStream('DELETED', 0),
    ]);
  } catch (e) {
    console.log(e);
  }

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

          const thisValidRows = validRows[diffState]++;
          validRows.total++;

          const index = Math.floor(thisValidRows / batchSize);

          // console.log(index);

          if (thisValidRows % batchSize === 0 && thisValidRows > 0) {
            const oldCsvStream = csvStreams[diffState].slice(-1)[0];

            writePromises.push(makeCsvStream(diffState, index));

            await Promise.all(writePromises);

            oldCsvStream.end();
          }

          writePromises.push(
            new Promise(async (res, rej) => {
              try {
                await csvStreams[diffState][index].write(processedRow);
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
          await Promise.all(writePromises);

          // console.log('all promises are resolved');

          csvStreams.ADDED.slice(-1)[0].end();
          csvStreams.MODIFIED.slice(-1)[0].end();
          csvStreams.DELETED.slice(-1)[0].end();

          return resolve([
            ...writeStreams.ADDED.map((s) => ({
              path: s.path,
              diffState: 'added',
            })),
            ...writeStreams.MODIFIED.map((s) => ({
              path: s.path,
              diffState: 'modified',
            })),
            ...writeStreams.DELETED.map((s) => ({
              path: s.path,
              diffState: 'deleted',
            })),
          ]);
        });
    });
  } catch (error) {
    // Handle rejection here
    console.error(error);
    throw error;
  }

  // console.log(writeStreams);
  // console.log(csvParseResult);

  return csvParseResult;
};
export { postProcess };
