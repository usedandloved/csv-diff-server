const getDist = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    ` 
    INSERT INTO dist 
      ( diffId, fileId, path, diffState, postProcessHash, time
      ) 
    VALUES
      ( @diffId, @fileId, @path, @diffState, @postProcessHash, @time
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
      // console.log('creating dist', params);
      return insert.run(params);
    },
    CreateMany: (dists) => {
      // console.log('creating dist', params);
      return insertMany(dists);
    },
    GetByDiffIdPostProcessHash: (params) => {
      // console.log(params);
      return getByDiffIdPostProcessHash.all(params);
    },
    GetByFileIdPostProcessHash: (params) => {
      // console.log(params);
      return getByFileIdPostProcessHash.all(params);
    },
    GetAll: () => {
      console.log('get all dists');
      return getAll.all();
    },
    DeleteMany: (dists) => {
      // console.log('creating dist', params);
      return deleteMany(dists);
    },
    DeleteByDiffId: (params) => {
      // console.log('deleting csv', params);
      return deleteByDiffId.run(params);
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

export { getDist };
