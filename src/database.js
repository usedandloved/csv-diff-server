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
    throw e;
  }

  let shouldAddTableContent = true;
  try {
    const stmt = db.prepare(`


    CREATE TABLE file (
      id             INTEGER   PRIMARY KEY AUTOINCREMENT,
      path           text      UNIQUE,
      dataset        text,
      source         text,
      revision       text,
      created_at     integer(4) not null default (strftime('%s','now')),
      CONSTRAINT path_unique               UNIQUE (path)
      CONSTRAINT dataset_revision_unique   UNIQUE (dataset,revision)
    )`);
    stmt.run();
  } catch (e) {
    // Table already created
    // console.error(e);
    shouldAddTableContent = false;
  }
  try {
    const stmt = db.prepare(`
    CREATE TABLE diff (
      id             INTEGER    PRIMARY KEY AUTOINCREMENT,
      path           text       UNIQUE,
      base_file_id   INTEGER    NOT NULL,
      delta_file_id  INTEGER    NOT NULL,
      line_count     INTEGER    NOT NULL,
      flag_hash      text       NOT NULL,
      format         text       NOT NULL,
      created_at     integer(4) not null default (strftime('%s','now')),
      FOREIGN KEY (base_file_id) 
        REFERENCES file(id),
      FOREIGN KEY (delta_file_id) 
        REFERENCES file(id)
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
