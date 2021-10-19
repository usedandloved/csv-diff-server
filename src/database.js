import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

const getDb = async ({ target = 'data/default.db' } = {}) => {
  let db;

  try {
    await fs.ensureDir(path.dirname(target));
    // db = new Database(path, { verbose: console.log });
    db = new Database(target);
  } catch (e) {
    console.error(e);
    throw err;
  }

  let shouldAddTableContent = true;
  try {
    const stmt = db.prepare(`
    CREATE TABLE file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path text UNIQUE,
      dataset text,
      source text,
      revision text,
      CONSTRAINT path_unique UNIQUE (path)
      CONSTRAINT dataset_revision_unique UNIQUE (dataset,revision)
    )`);
    stmt.run();
  } catch (e) {
    // Table already created
    // console.error(e);
    shouldAddTableContent = false;
  }

  // if (shouldAddTableContent) {
  //   try {
  //     const insert = db.prepare(
  //       'INSERT INTO file (name, path) VALUES (@name,@path)'
  //     );

  //     const insertMany = db.transaction((files) => {
  //       for (const file of files) insert.run(file);
  //     });

  //     insertMany([
  //       { name: 'mmp-tech', path: '/tmp/mmp-tech' },
  //       { name: 'mmp-books', path: '/tmp/mmp-books' },
  //     ]);
  //   } catch (e) {
  //     console.error(e);
  //   }
  // }
  return db;
};

export { getDb };
