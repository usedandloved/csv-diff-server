import express from 'express';
import { getDb } from './database.js';
import { getFile } from '../src/File.js';

const getServer = async ({ databaseOptions } = {}) => {
  let db;
  try {
    db = await getDb(databaseOptions);
  } catch (e) {
    console.error(e);
  }

  const File = await getFile(db);

  const app = express();

  // Server port
  const PORT = 3000;

  // Start server
  app.server = app.listen(PORT, () => {
    // console.log('Server running on port %PORT%'.replace('%PORT%', PORT));
  });

  app.close = () => {
    // console.log('Gracefully stopping server and database');
    app.server?.close();
    db?.close();
  };

  // Root endpoint
  app.get('/', (req, res, next) => {
    res.json({ message: 'Ok' });
  });

  // Insert here other API endpoints

  app.get('/api/files', (req, res, next) => {
    let result;
    try {
      result = File.GetAll();
    } catch (e) {
      console.error(e);
      res.json({ error: true });
      return;
    }
    res.json(result);
  });

  app.get('/api/file/:path', (req, res, next) => {
    let result;
    try {
      result = File.GetOne({ path: req.params.path }) || {};
    } catch (e) {
      console.error(e);
      res.json({ error: true });
      return;
    }
    res.json(result);
  });

  // Default response for any other request
  app.use(function (req, res) {
    res.status(404);
  });

  return { app, db };
};

export { getServer };
