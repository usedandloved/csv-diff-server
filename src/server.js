import express from 'express';
import { getDb } from './database.js';
import { getFile } from './models/File.js';
import { getDiff } from './models/Diff.js';
import main from './main.js';
import { paths, withUrls } from './lib/fs.js';

let server;
const port = process.env.PORT || 3000;

/**
 * Close server on restart or shutdown
 * Reference: https://stackoverflow.com/a/14032965/6671505
 */
process.stdin.resume();
async function exitHandler(options, exitCode) {
  console.log('In exitHandler');
  await server.close();
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
// process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

const getServer = async ({ databaseOptions } = {}) => {
  let db;
  try {
    db = await getDb(databaseOptions);
  } catch (e) {
    console.error(e);
    throw e;
  }

  const File = await getFile(db);
  const Diff = await getDiff(db);

  const app = express();

  app.set('views', '/app/src/views');

  app.set('view engine', 'ejs');

  app.use(express.json());

  // app.close = async () => {
  //   console.log("Gracefully stopping server and database");

  // };

  // index page
  app.get('/', async (req, res) => {
    let files, diffs;
    try {
      files = (await File.GetAll()) || [];
    } catch (e) {
      console.error(e);
    }
    try {
      diffs = (await Diff.GetAll()) || [];
    } catch (e) {
      console.error(e);
    }
    res.render('pages/index.ejs', { files, diffs: withUrls(diffs) });
  });

  // Insert here other API endpoints

  app.get('/api/files', async (req, res, next) => {
    let result;
    try {
      result = (await File.GetAll()) || [];
    } catch (e) {
      console.error(e);
      return res.json({ error: true });
    }
    res.json(result);
  });

  app.get('/api/file/:path', (req, res, next) => {
    let result;
    try {
      result = File.GetOne({ path: req.params.path }) || {};
    } catch (e) {
      console.error(e);
      return res.json({ error: true });
    }
    res.json(result);
  });

  app.post('/api/file', (req, res, next) => {
    console.log(req.body);
    // try {
    //   result = File.GetOne({ path: req.params.path }) || {};
    // } catch (e) {
    //   console.error(e);
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
    //   console.error(e);
    //   return res.json({ error: true });
    // }
    // res.json(result);
  });

  app.post('/api/diff', async (req, res, next) => {
    let diff;
    try {
      diff = await main(req.body, File, Diff);
    } catch (e) {
      console.log(e);
    }
    res.send(diff);
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
        console.log(`Server running on port ${port}`);
      }
    });
  } catch (e) {
    console.error(e);
  }

  app.close = async () => {
    await Promise.all([server.close(), db.close()]);
  };

  return { app, db };
};

export { getServer, port };
