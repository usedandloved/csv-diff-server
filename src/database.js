import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

import { logger } from './lib/logger.js';

const getDb = async ({ target = 'data/default.db' } = {}) => {
  let db, tableNames;

  await fs.ensureDir(path.dirname(target));

  // logger.debug({ target });

  try {
    // db = new Database(path, { verbose: logger.debug });
    db = new Database(target);
  } catch (e) {
    logger.error(e);
    throw e;
  }

  // return;

  try {
    const stmt = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table';`
    );
    const tables = stmt.all();
    tableNames = tables.map((table) => table.name);
  } catch (e) {
    logger.error(e);
  }

  // try {
  //   let stmt = '';
  //   stmt = db.prepare(`PRAGMA foreign_keys = 0`);
  //   stmt.run();
  //   // stmt = db.prepare(`DELETE FROM diff`);
  //   // stmt.run();
  //   // stmt = db.prepare(`DROP TABLE diff `);
  //   // stmt.run();
  //   stmt = db.prepare(`DELETE FROM dist`);
  //   stmt.run();
  //   stmt = db.prepare(`DROP TABLE dist`);
  //   stmt.run();
  //   // stmt = db.prepare(`DELETE FROM file`);
  //   // stmt.run();
  //   // stmt = db.prepare(`DROP TABLE file `);
  //   // stmt.run();
  //   stmt = db.prepare(`PRAGMA foreign_keys = 1`);
  //   stmt.run();

  //   // tableNames.splice(tableNames.indexOf('diff'), 1);
  //   // tableNames.splice(tableNames.indexOf('dist'), 1);
  //   // tableNames.splice(tableNames.indexOf('file'), 1);
  // } catch (e) {
  //   logger.error(e);
  // }

  // logger.debug({ tableNames });

  if (!tableNames.includes('file')) {
    try {
      const stmt = db.prepare(`
    CREATE TABLE file (
      id             INTEGER   PRIMARY KEY AUTOINCREMENT,
      path           text      UNIQUE,
      dataset        text,
      source         text,
      revision       text,
      size           INTEGER,
      createdAt      integer(4) not null default (strftime('%s','now')),
      CONSTRAINT path_unique               UNIQUE (path)
      CONSTRAINT dataset_revision_unique   UNIQUE (dataset,revision)
    )`);
      stmt.run();
    } catch (e) {
      logger.error(e);
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
      time          INTEGER,
      additions     INTEGER,
      modifications INTEGER,
      deletions     INTEGER,
      size          INTEGER,
      createdAt     integer(4) not null default (strftime('%s','now')), 
      FOREIGN KEY (baseFileId) 
        REFERENCES file(id) ON DELETE CASCADE,
      FOREIGN KEY (deltaFileId) 
        REFERENCES file(id) ON DELETE CASCADE
    )`);
      stmt.run();
    } catch (e) {
      logger.error(e);
    }
  }

  if (!tableNames.includes('dist')) {
    try {
      const stmt = db.prepare(` 
    CREATE TABLE dist (
      id              INTEGER    PRIMARY KEY AUTOINCREMENT,
      path            text       UNIQUE,
      diffId          INTEGER,
      fileId          INTEGER,
      postProcessHash text       NOT NULL,
      diffState       text       NOT NULL,
      time            INTEGER,
      size            INTEGER,
      createdAt       integer(4) not null default (strftime('%s','now')), 
      FOREIGN KEY (diffId) 
        REFERENCES diff(id) ON DELETE CASCADE
    )`);
      stmt.run();
    } catch (e) {
      logger.error(e);
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
  //     logger.error(e);
  //   }
  // }

  // let deleteAllDist, deleteAllDiff, deleteAllFile;
  // deleteAllDist = db.prepare('DELETE FROM dist');
  // deleteAllDiff = db.prepare('DELETE FROM diff');
  // deleteAllFile = db.prepare('DELETE FROM file');
  // // await new Promise((resolve) => setTimeout(resolve, 500));
  // await deleteAllDist.run();
  // await deleteAllDiff.run();
  // await deleteAllFile.run();

  return db;
};

export { getDb };
