const getDiff = async (db) => {
  // return { Create: '' };

  // const insert = db.prepare(
  //   'INSERT INTO diff ( base_file_id, delta_file_id) VALUES (@base_file_id,@delta_file_id)'
  // );

  // const get = db.prepare('SELECT * FROM diff WHERE id = (@id)');

  // const getByDatasetRevision = db.prepare(
  //   'SELECT * FROM file WHERE dataset = (@dataset) AND revision = (@revision)'
  // );

  // const getAll = db.prepare('SELECT * FROM file');

  // const update = db.prepare(
  //   'UPDATE file SET revision = (@revision) WHERE path = (@path)'
  // );

  // const updateByDatasetRevision = db.prepare(
  //   `UPDATE file SET path = (@path)
  //    WHERE dataset = (@dataset) AND revision = (@revision)`
  // );

  // const deleteOne = db.prepare('DELETE FROM file WHERE path = (@path)');

  // const deleteAll = db.prepare('DELETE FROM file');

  return {
    // Create: (params) => {
    //   // console.log('creating csv', params);
    //   return insert.run(params);
    // },
    // GetOne: (params) => {
    //   // console.log('get all csv');
    //   return get.get(params);
    // },
    // GetByDatasetRevision: (params) => {
    //   // console.log(params);
    //   return getByDatasetRevision.get(params);
    // },
    // GetAll: () => {
    //   // console.log('get all csv');
    //   return getAll.all();
    // },
    // Update: (params) => {
    //   // console.log('creating csv', params);
    //   return update.run(params);
    // },
    // UpdateByDatasetRevision: (params) => {
    //   // console.log('creating csv', params);
    //   return updateByDatasetRevision.run(params);
    // },
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
