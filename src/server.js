import express from 'express';
import { getDb } from './database.js';
import { getFile } from '../src/File.js';
import { diff } from '../src/diff.js';

const getServer = async ({ databaseOptions } = {}) => {
  let db;
  try {
    db = await getDb(databaseOptions);
  } catch (e) {
    console.error(e);
    throw e;
  }

  const File = await getFile(db);

  const app = express();

  app.use(express.json());

  // Server port
  const PORT = 3000;

  // app.close = async () => {
  //   console.log("Gracefully stopping server and database");

  // };

  // Root endpoint
  app.get('/', (req, res, next) => {
    res.json({ message: 'Ok' });
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
    try {
      await diff(req.body, File);
    } catch (e) {
      console.log(e);
    }

    res.send(req.body);
  });

  if ('test' === process.env.APP_ENV) {
    app.use('/test', express.static('/app/test/public'));
  }

  // Default response for any other request
  app.use(function (req, res) {
    res.status(404);
  });

  // Start server
  try {
    app.server = await app.listen(PORT, () => {
      // console.log('Server running on port %PORT%'.replace('%PORT%', PORT));
    });
  } catch (e) {
    console.error(e);
  }

  return { app, db };
};

export { getServer };
