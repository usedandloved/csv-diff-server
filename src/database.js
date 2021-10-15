import Database from 'better-sqlite3';

const getDb = async ({ path = 'data/default.db' }) => {
  let db;

  try {
    // db = new Database(path, { verbose: console.log });
    db = new Database(path);
  } catch (e) {
    console.error(e);
    throw err;
  }

  let shouldAddTableContent = true;
  try {
    const stmt = db.prepare(`
    CREATE TABLE file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name text,
      path text UNIQUE,
      CONSTRAINT path_unique UNIQUE (path)
    )`);
    stmt.run();
  } catch (e) {
    // Table already created
    // console.error(e);
    shouldAddTableContent = false;
  }

  if (shouldAddTableContent) {
    try {
      const insert = db.prepare(
        'INSERT INTO file (name, path) VALUES (@name,@path)'
      );

      const insertMany = db.transaction((files) => {
        for (const file of files) insert.run(file);
      });

      insertMany([
        { name: 'mmp-tech', path: '/tmp/mmp-tech' },
        { name: 'mmp-books', path: '/tmp/mmp-books' },
      ]);
    } catch (e) {
      console.error(e);
    }
  }
  return db;
};

export { getDb };
