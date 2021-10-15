import express from 'express';
import { getDb } from './database.js';

const getServer = async () => {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error(e);
  }

  const app = express();

  // Server port
  const PORT = 3000;

  // Start server
  app.server = app.listen(PORT, () => {
    console.log('Server running on port %PORT%'.replace('%PORT%', PORT));
  });

  // Root endpoint
  app.get('/', (req, res, next) => {
    res.json({ message: 'Ok' });
  });

  // Insert here other API endpoints

  app.get('/api/files', (req, res, next) => {
    // var sql = 'select * from user';
    const stmt = db.prepare('SELECT * FROM file');
    const info = stmt.all();
    console.log(info);
    res.json(info);
  });

  // Default response for any other request
  app.use(function (req, res) {
    res.status(404);
  });

  return { app };
};

export { getServer };
