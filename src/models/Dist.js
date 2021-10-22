const getDist = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    ` 
    INSERT INTO dist 
      ( diffId, path, diffState, postProcessHash
      ) 
    VALUES
      ( @diffId, @path, @diffState, @postProcessHash
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

  const getAll = db.prepare('SELECT * FROM dist');

  // const deleteOne = db.prepare('DELETE FROM file WHERE path = (@path)');

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
      return getByDiffIdPostProcessHash.get(params);
    },
    GetAll: () => {
      console.log('get all dists');
      return getAll.all();
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
