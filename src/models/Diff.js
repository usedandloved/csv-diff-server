import { logger } from '../lib/logger.js';

const getDiff = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    ` 
    INSERT INTO diff 
      ( baseFileId, deltaFileId, path, size,
        flagHash, format, lineCount, time,
        additions, modifications, deletions
      ) 
    VALUES
      ( @baseFileId, @deltaFileId, @path, @size,
        @flagHash, @format, @lineCount, @time, 
        @additions, @modifications, @deletions
      )`
  );

  // const get = db.prepare('SELECT * FROM diff WHERE id = (@id)');

  const getByFileIdsHashFormat = db.prepare(
    `
    SELECT * FROM diff 
    WHERE baseFileId = (@baseFileId) 
    AND deltaFileId = (@deltaFileId)
    AND flagHash = (@flagHash)
    AND format = (@format)
    `
  );

  const getAll = db.prepare('SELECT * FROM diff');

  const deleteByFileIdsHashFormat = db.prepare(
    `
    DELETE FROM diff 
    WHERE baseFileId = (@baseFileId) 
    AND deltaFileId = (@deltaFileId)
    AND flagHash = (@flagHash)
    AND format = (@format)
    `
  );

  // const deleteOne = db.prepare('DELETE FROM file WHERE path = (@path)');

  // const deleteAll = db.prepare('DELETE FROM file');

  return {
    Create: (params) => {
      // logger.debug('creating diff', params);
      if (!params.time) params.time = null;
      if (!Number.isInteger(params.additions)) params.additions = null;
      if (!Number.isInteger(params.modifications)) params.modifications = null;
      if (!Number.isInteger(params.deletions)) params.deletions = null;
      return insert.run(params);
    },
    GetByFileIdsHashFormat: (params) => {
      // logger.debug(params);
      return getByFileIdsHashFormat.get(params);
    },
    GetAll: () => {
      logger.debug('get all diffs');
      return getAll.all();
    },
    DeleteByFileIdsHashFormat: (params) => {
      // logger.debug(params);
      return deleteByFileIdsHashFormat.run(params);
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

export { getDiff };
