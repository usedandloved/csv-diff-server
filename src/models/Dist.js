import { logger } from '../lib/logger.js';

const getDist = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    ` 
    INSERT INTO dist 
      ( diffId, fileId, path, size, diffState, postProcessHash, time, lineCount
      ) 
    VALUES
      ( @diffId, @fileId, @path, @size, @diffState, @postProcessHash, @time, @lineCount
      )`
  );

  const insertMany = db.transaction((dists) => {
    for (const dist of dists) insert.run(dist);
  });

  // const get = db.prepare('SELECT * FROM dist WHERE id = (@id)');

  const getByDiffIdPostProcessHash = db.prepare(
    `
    SELECT * FROM dist 
    WHERE diffId = (@diffId) 
    AND postProcessHash = (@postProcessHash)
    `
  );

  const getByFileIdPostProcessHash = db.prepare(
    `
    SELECT * FROM dist 
    WHERE fileId = (@fileId) 
    AND postProcessHash = (@postProcessHash)
    `
  );

  const getAll = db.prepare('SELECT * FROM dist');

  const getTotals = db.prepare('SELECT SUM(size) as size FROM dist');

  const deleteMany = db.transaction((dists) => {
    for (const dist of dists) deleteOne.run({ id: dist.id });
  });

  const deleteOne = db.prepare('DELETE FROM dist WHERE id = (@id)');

  const deleteByDiffId = db.prepare(
    'DELETE FROM dist WHERE diffId = (@diffId)'
  );

  // const deleteAll = db.prepare('DELETE FROM file');

  return {
    Create: (params) => {
      // logger.debug('creating dist', params);
      return insert.run(params);
    },
    CreateMany: (dists) => {
      // logger.debug('creating dist', params);
      return insertMany(dists);
    },
    GetByDiffIdPostProcessHash: (params) => {
      // logger.debug(params);
      return getByDiffIdPostProcessHash.all(params);
    },
    GetByFileIdPostProcessHash: (params) => {
      // logger.debug(params);
      return getByFileIdPostProcessHash.all(params);
    },
    GetAll: () => {
      logger.debug('get all dists');
      return getAll.all();
    },
    GetTotals: () => {
      return getTotals.all();
    },
    DeleteMany: (dists) => {
      // logger.debug('creating dist', params);
      return deleteMany(dists);
    },
    DeleteByDiffId: (params) => {
      // logger.debug('deleting csv', params);
      return deleteByDiffId.run(params);
    },
    // Delete: (params) => {
    //   // logger.debug('deleting csv', params);
    //   return deleteOne.run(params);
    // },
    // DeleteAll: () => {
    //   // logger.debug('deleting all csvs');
    //   return deleteAll.run();
    // },
  };
};

export { getDist };
