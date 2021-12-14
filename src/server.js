import express from 'express';
import promClient from 'prom-client';
import promBundle from 'express-prom-bundle';

import { getDb } from './database.js';
import { getFile } from './models/File.js';
import { getDiff } from './models/Diff.js';
import { getDist } from './models/Dist.js';
import main from './main.js';
import { paths, withUrls } from './lib/fs.js';
import { logger } from './lib/logger.js';
import { msToTime, waitSeconds, objectHash } from './lib/utils.js';
import { withMemStore } from './lib/withMemStore.js';

let server, db;
const port = process.env.PORT || 3000,
  requestTimeOutMs = 2000;

/**
 * Close server on restart or shutdown
 * Reference: https://stackoverflow.com/a/14032965/6671505
 */
process.stdin.resume();
async function exitHandler(options, exitCode) {
  logger.debug('In exitHandler');
  await server?.close();
  await db?.close();
  if (exitCode || exitCode === 0) logger.debug(exitCode);
  if (options.exit) process.exit();
}
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
// process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

/*
 * Prometheus
 */

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    project_name: 'csv-diff-server',
  },
  promClient: {
    collectDefaultMetrics: {},
  },
});

const getServer = async ({ databaseOptions } = {}) => {
  let db;
  try {
    db = await getDb(databaseOptions);
  } catch (e) {
    logger.error(e);
    throw e;
  }

  const File = await getFile(db);
  const Diff = await getDiff(db);
  const Dist = await getDist(db);

  const app = express();

  app.use(metricsMiddleware);

  app.set('views', '/app/src/views');

  app.set('view engine', 'ejs');

  app.locals.msToTime = msToTime;

  app.use(express.json());

  // app.close = async () => {
  //   logger.debug("Gracefully stopping server and database");

  // };

  // index page
  app.get('/', async (req, res) => {
    let files, diffs, dists;
    try {
      files = (await File.GetAll()) || [];
    } catch (e) {
      logger.error(e);
    }
    try {
      diffs = withUrls(await Diff.GetAll()) || [];
    } catch (e) {
      logger.error(e);
    }
    try {
      dists = withUrls(await Dist.GetAll()) || [];
    } catch (e) {
      logger.error(e);
    }
    res.render('pages/index.ejs', { files, diffs, dists });
  });

  app.get('/liveness', (req, res) => {
    res.json({ status: 'UP' });
  });
  app.get('/readiness', (req, res) => {
    res.json({ status: 'UP' });
  });

  // Insert here other API endpoints

  app.get('/api/files', async (req, res, next) => {
    let result;
    try {
      result = (await File.GetAll()) || [];
    } catch (e) {
      logger.error(e);
      return res.json({ error: true });
    }
    res.json(result);
  });

  app.get('/api/file/:path', (req, res, next) => {
    let result;
    try {
      result = File.GetOne({ path: req.params.path }) || {};
    } catch (e) {
      logger.error(e);
      return res.json({ error: true });
    }
    res.json(result);
  });

  app.post('/api/file', (req, res, next) => {
    logger.debug(req.body);
    // try {
    //   result = File.GetOne({ path: req.params.path }) || {};
    // } catch (e) {
    //   logger.error(e);
    //   return res.json({ error: true });
    // }
    // 0. Is file already cached? Get from database.
    // 1. Download the file
    // 2. Create row in db
    // 3. Return row
    res.send(req.body);
    // let result;
    // try {
    //   result = File.GetOne({ path: req.params.path }) || {};
    // } catch (e) {
    //   logger.error(e);
    //   return res.json({ error: true });
    // }
    // res.json(result);
  });

  app.post('/api/diff', async (req, res, next) => {
    let promises;
    const { value, getValue, updateValue } = withMemStore(
      objectHash(`/api/diff/${req.body}`)
    );

    if (value && Object.values(value).find((x) => x?.progress)) {
      // logger.debug('response from memStore');
      return res.send(value);
    }

    logger.debug('will run main - response not from memStore');

    try {
      promises = [
        main(req.body, File, Diff, Dist, updateValue),
        new Promise((resolve) =>
          setTimeout(() => resolve(getValue()), requestTimeOutMs)
        ),
      ];
    } catch (e) {
      logger.debug(e);
    }

    res.send(await Promise.any(promises));
  });

  app.use('/data', express.static(paths.data));

  if (['development', 'test'].includes(process.env.APP_ENV)) {
    app.use('/test', express.static('/app/test/public'));
  }

  // Default response for any other request
  app.use(function (req, res) {
    res.status(404);
  });

  // Start server
  try {
    server = app.listen(port, () => {
      if ('test' !== process.env.APP_ENV) {
        logger.debug(`Server running on port ${port}`);
      }
    });
  } catch (e) {
    logger.error(e);
  }

  app.close = async () => {
    await Promise.all([server.close(), db.close()]);
  };

  return { app, db };
};

export { getServer, port };
