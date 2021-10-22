import chai from 'chai';
import chaiExclude from 'chai-exclude';

import { getDb } from '../src/database.js';
import { getFile } from '../src/models/File.js';

chai.use(chaiExclude);
const { expect } = chai;

const sample1 = {
  dataset: 'sample',
  revision: 'v1',
  source: `http://localhost:3000/test/base-test.csv`,
  path: '/tmp/mmp-test-1',
};

const sample2 = {
  dataset: 'sample',
  revision: 'v2',
  source: `http://localhost:3000/test/delta-test.csv`,
  path: '/tmp/mmp-test-2',
};

describe('File model ', () => {
  let db, File, deleteAllDist, deleteAllDiff, deleteAllFile;

  before(async () => {
    db = await getDb({ target: './data/test.db' });

    File = await getFile(db);

    deleteAllDist = db.prepare('DELETE FROM dist');
    deleteAllDiff = db.prepare('DELETE FROM diff');
    deleteAllFile = db.prepare('DELETE FROM file');
    // await new Promise((resolve) => setTimeout(resolve, 500));
    await deleteAllDist.run();
    await deleteAllDiff.run();
    await deleteAllFile.run();
  });

  after(() => {
    db.close();
  });

  it('Create ', async () => {
    const actual = File.Create(sample1);
    expect(actual).to.include({ changes: 1 });
  });

  it('Create ', async () => {
    const actual = File.Create(sample2);
    expect(actual).to.include({ changes: 1 });
  });

  it('Update ', async () => {
    const actual = File.Update({ revision: 'v3', path: '/tmp/mmp-test-1' });
    expect(actual).to.include({ changes: 1 });
  });

  it('GetAll ', async () => {
    const actual = File.GetAll();
    expect(actual)
      .excluding(['id', 'createdAt'])
      .to.deep.equal([{ ...sample1, revision: 'v3' }, sample2]);
  });

  it('GetByDatasetRevision ', async () => {
    const actual = File.GetByDatasetRevision({
      dataset: 'sample',
      revision: 'v2',
    });
    expect(actual).excluding(['id', 'createdAt']).to.deep.equal(sample2);
  });

  it('Delete ', async () => {
    const actual = File.Delete({ path: '/tmp/mmp-test-1' });
    expect(actual).to.include({ changes: 1 });
  });

  it('DeleteAll ', async () => {
    const actual = File.DeleteAll();
    expect(actual).to.include({ changes: 1 });
  });
});
