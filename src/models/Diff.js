const getDiff = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    ` 
    INSERT INTO diff 
      ( baseFileId, deltaFileId, path,
        flagHash, format, lineCount, time,
        additions, modifications, deletions
      ) 
    VALUES
      ( @baseFileId, @deltaFileId, @path,
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
      // console.log('creating diff', params);
      if (!params.time) params.time = null;
      return insert.run(params);
    },
    GetByFileIdsHashFormat: (params) => {
      // console.log(params);
      return getByFileIdsHashFormat.get(params);
    },
    GetAll: () => {
      console.log('get all diffs');
      return getAll.all();
    },
    DeleteByFileIdsHashFormat: (params) => {
      // console.log(params);
      return deleteByFileIdsHashFormat.run(params);
    },
    // Delete: (params) => {
    //   // console.log('deleting csv', params);
    //   return deleteOne.run(params);
    // },
    // DeleteAll: () => {
    //   // console.log('deleting all csvs');
    //   return deleteAll.run();
    // },
  };
};

export { getDiff };
