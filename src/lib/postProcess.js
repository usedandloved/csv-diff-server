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
    csvStreams = {},
    possibleDiffStates = ['added', 'modified', 'deleted'],
    writeStreams = {},
    transformPresets = {},
    validateFilters = {};

  let csvParseResult,
    { writerHeaders } = options,
    validRows = { total: 0 },
    writePromises = [],
    onePercent = Math.round(lineCount / 100);

  const makeCsvStream = async (diffState, i) => {
    const thisTarget = `${target.dir}/${diffState}-${i}-${target.extension}`;

    await fs.ensureFile(thisTarget);

    // Use a tempCsvStream so that we don't add it to the array
    // until it has had the writeStream piped onto it
    // Because, later we expect the last in the array to be ready
    // for writing.
    const tempCsvStream = format({ headers: true });

    writeStreams[diffState][i] = fs.createWriteStream(thisTarget);

    tempCsvStream
      .pipe(writeStreams[diffState][i])
      .on('end', () => writeStreams[diffState][i].end());

    csvStreams[diffState][i] = tempCsvStream;

    return;
  };

  const makeCsvStreamPromises = [];
  for (const diffState of possibleDiffStates) {
    // Init empty arrays and counters for possibleDiffStates
    csvStreams[diffState] = [];
    writeStreams[diffState] = [];
    validRows[diffState] = 0;
    try {
      // Make csvStreams for possibleDiffStates
      makeCsvStreamPromises.push(makeCsvStream(diffState, 0));
    } catch (e) {
      console.log(e);
    }
  }
  await Promise.all(makeCsvStreamPromises);

  // try {
  //   await Promise.all([
  //     makeCsvStream('added'', 0),
  //     makeCsvStream('modified', 0),
  //     makeCsvStream('deleted', 0),
  //   ]);
  // } catch (e) {
  //   console.log(e);
  // }

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

          // console.log({ processedRow });

          const diffState = row?.CSVDIFF_STATE.toLowerCase() || 'added';

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

          // console.log('writing');
          // console.log({ diffState, index, processedRow });

          writePromises.push(csvStreams[diffState][index].write(processedRow));

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

          const result = [];

          for (const diffState of possibleDiffStates) {
            // End the last stream
            csvStreams[diffState].slice(-1)[0].end();
            // If no valid rows for this diff state then return.
            if (!validRows[diffState]) continue;
            // Push the write streams to the result
            result.push(
              ...writeStreams[diffState].map((s) => ({
                path: s.path,
                diffState,
              }))
            );
          }

          return resolve(result);
        });
    });
  } catch (error) {
    // Handle rejection here
    console.error(error);
    throw error;
  }

  return csvParseResult;
};
export { postProcess };
