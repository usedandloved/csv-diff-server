import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

const getDb = async ({ target = 'data/default.db' } = {}) => {
  let db, tableNames;

  try {
    await fs.ensureDir(path.dirname(target));
    // db = new Database(path, { verbose: console.log });
    db = new Database(target);
  } catch (e) {
    console.error(e);
    throw e;
  }

  try {
    const stmt = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table';`
    );
    const tables = stmt.all();
    tableNames = tables.map((table) => table.name);
  } catch (e) {
    console.error(e);
  }

  if (!tableNames.includes('file')) {
    try {
      const stmt = db.prepare(`
    CREATE TABLE file (
      id             INTEGER   PRIMARY KEY AUTOINCREMENT,
      path           text      UNIQUE,
      dataset        text,
      source         text,
      revision       text,
      createdAt     integer(4) not null default (strftime('%s','now')),
      CONSTRAINT path_unique               UNIQUE (path)
      CONSTRAINT dataset_revision_unique   UNIQUE (dataset,revision)
    )`);
      stmt.run();
    } catch (e) {
      console.error(e);
    }
  }

  if (!tableNames.includes('diff')) {
    try {
      const stmt = db.prepare(` 
    CREATE TABLE diff (
      id            INTEGER    PRIMARY KEY AUTOINCREMENT,
      path          text       UNIQUE,
      baseFileId    INTEGER    NOT NULL,
      deltaFileId   INTEGER    NOT NULL,
      lineCount     INTEGER    NOT NULL,
      flagHash      text       NOT NULL,
      format        text       NOT NULL,
      time          REAL,
      additions     INTEGER,
      modifications INTEGER,
      deletions     INTEGER,
      createdAt     integer(4) not null default (strftime('%s','now')), 
      FOREIGN KEY (baseFileId) 
        REFERENCES file(id),
      FOREIGN KEY (deltaFileId) 
        REFERENCES file(id)
    )`);
      stmt.run();
    } catch (e) {
      console.error(e);
    }
  }

  if (!tableNames.includes('dist')) {
    try {
      const stmt = db.prepare(` 
    CREATE TABLE dist (
      id              INTEGER    PRIMARY KEY AUTOINCREMENT,
      path            text       UNIQUE,
      diffId          INTEGER    NOT NULL,
      postProcessHash text       NOT NULL,
      diffState       text       NOT NULL,
      createdAt       integer(4) not null default (strftime('%s','now')), 
      FOREIGN KEY (diffId) 
        REFERENCES diff(id)
    )`);
      stmt.run();
    } catch (e) {
      console.error(e);
    }
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
