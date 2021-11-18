import { Validator } from '@cfworker/json-schema';
import csv from '@fast-csv/parse';
import { format } from '@fast-csv/format';
import fs from 'fs-extra';
import jsonata from 'jsonata';

const validateRow = async (data, rowValidator) => {
  if (!rowValidator) return true;
  // console.log(data);
  try {
    // console.log(rowValidator?.validate(data)?.valid);
    return rowValidator?.validate(data)?.valid || false;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const processRow = async (row, transforms) => {
  // console.log({ transforms });
  // console.log(JSON.stringify(row));
  try {
    var expression = jsonata(transforms);
    var result = expression.evaluate(row); // returns 24

    // console.log(result);
    return result;
  } catch (e) {
    console.error(e);
  }
  return row;
};

const postProcess = async (diff, options, target, updatePercentage) => {
  // console.log({ diff, options, target });

  const { lineCount: lineCount } = diff,
    { batchSize = 50000, transforms } = options,
    csvStreams = {},
    possibleDiffStates = ['added', 'modified', 'deleted'],
    timers = {},
    writeStreams = {},
    dataPromises = [],
    rowValidator = options?.rowSchema && new Validator(options.rowSchema);

  let csvParseResult,
    { writerHeaders } = options,
    rowCount = { total: 0 },
    writePromises = [],
    onePercent = Math.round((lineCount - 1) / 100);

  const makeCsvStream = async (diffState, i) => {
    // Set the start time
    timers[diffState][i] = { startedAt: new Date() };

    const thisTarget = `${target.dir}/${diffState}-${i}-${target.extension}`;

    await fs.ensureFile(thisTarget);

    // Use a tempCsvStream so that we don't add it to the array
    // until it has had the writeStream piped onto it
    // Because, later we expect the last in the array to be ready
    // for writing.
    const tempCsvStream = format({ headers: true });

    writeStreams[diffState][i] = fs.createWriteStream(thisTarget);

    tempCsvStream.pipe(writeStreams[diffState][i]);

    csvStreams[diffState][i] = tempCsvStream;

    csvStreams[diffState][i].on('end', () => {
      writeStreams[diffState][i].end();
    });

    return;
  };

  const makeCsvStreamPromises = [];
  for (const diffState of possibleDiffStates) {
    // Init empty arrays and counters for possibleDiffStates
    csvStreams[diffState] = [];
    timers[diffState] = [];
    writeStreams[diffState] = [];
    rowCount[diffState] = 0;
    try {
      // Make csvStreams for possibleDiffStates
      makeCsvStreamPromises.push(makeCsvStream(diffState, 0));
    } catch (e) {
      console.log(e);
    }
  }
  await Promise.all(makeCsvStreamPromises);

  try {
    csvParseResult = await new Promise((resolve, reject) => {
      fs.createReadStream(diff.path)
        .on('error', (error) => {
          console.log(error);
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
                cb(null, await validateRow(data, rowValidator))
              );
            })
        )
        .on('error', (error) => {
          reject(error);
        })
        .on('data', async (row) => {
          // res();

          let processedRowPromise = transforms
            ? processRow(row, transforms)
            : row;

          // processedRow = await filters(
          //   { processedRow, row },
          //   'processedRow',
          //   options
          // );

          // console.log({ row });

          rowCount.total++;

          if (rowCount.total % onePercent === 0) {
            const percent = Math.round(rowCount.total / onePercent);
            updatePercentage(percent);
          }

          const processedRow = await processedRowPromise;

          // console.log(processedRow);

          if (!processedRow) return;

          const diffState = row?.CSVDIFF_STATE?.toLowerCase() || 'added';

          const thisValidRows = rowCount[diffState]++;

          const index = Math.floor(thisValidRows / batchSize);

          // console.log(index);

          if (thisValidRows % batchSize === 0 && thisValidRows > 0) {
            // Set the end time of the previous batch
            timers[diffState][index - 1].endedAt = new Date();

            const oldCsvStream = csvStreams[diffState].slice(-1)[0];

            writePromises.push(makeCsvStream(diffState, index));

            await Promise.all(writePromises);

            writePromises.push(oldCsvStream.end());
          }

          writePromises.push(
            csvStreams[diffState].slice(-1)[0].write(processedRow)
          );
        })
        .on('end', async () => {
          // console.log(dataPromises);
          // await Promise.all(dataPromises);
          await Promise.all(writePromises);

          const result = [];

          const calcDuration = (o) => {
            if (!o.startedAt) return null;
            return Math.abs((o.endedAt ? o.endedAt : new Date()) - o.startedAt);
          };

          for (const diffState of possibleDiffStates) {
            // End the last stream
            csvStreams[diffState].slice(-1)[0].end();
            // If no valid rows for this diff state then...
            if (!rowCount[diffState]) {
              // Delete the empty file
              fs.remove(writeStreams[diffState][0].path);
              // And continue the loop.
              continue;
            }
            // Push the write streams to the result
            result.push(
              ...writeStreams[diffState].map((s, i) => ({
                path: s.path,
                diffState,
                time: calcDuration(timers[diffState][i]),
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

  updatePercentage(100);

  // console.log(csvParseResult);

  return csvParseResult;
};
export { postProcess };
