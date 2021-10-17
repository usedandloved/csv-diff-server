const getFile = async (db) => {
  // return { Create: '' };

  const insert = db.prepare(
    'INSERT INTO file ( path, dataset, revision, source) VALUES (@path,@dataset,@revision,@source)'
  );

  const update = db.prepare(
    'UPDATE file SET revision = (@revision) WHERE path = (@path)'
  );

  const get = db.prepare('SELECT * FROM file WHERE path = (@path)');

  const getByDatasetRevision = db.prepare(
    'SELECT * FROM file WHERE dataset = (@dataset) AND revision = (@revision)'
  );

  const getAll = db.prepare('SELECT * FROM file');

  const deleteOne = db.prepare('DELETE FROM file WHERE path = (@path)');

  const deleteAll = db.prepare('DELETE FROM file');

  return {
    Create: (params) => {
      // console.log('creating csv', params);
      return insert.run(params);
    },
    Update: (params) => {
      // console.log('creating csv', params);
      return update.run(params);
    },
    GetOne: (params) => {
      // console.log('get all csv');
      return get.get(params);
    },
    GetByDatasetRevision: (params) => {
      // console.log(params);
      return getByDatasetRevision.get(params);
    },
    GetAll: () => {
      // console.log('get all csv');
      return getAll.all();
    },
    Delete: (params) => {
      // console.log('deleting csv', params);
      return deleteOne.run(params);
    },
    DeleteAll: () => {
      // console.log('deleting all csvs');
      return deleteAll.run();
    },
  };
};

export { getFile };
