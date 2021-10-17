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

xdescribe('File model ', () => {
  let db, File;

  before(async () => {
    db = await getDb({ path: 'data/test.db' });
    File = await getFile(db);
    File.DeleteAll();
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
      .excluding('id')
      .to.deep.equal([{ ...sample1, revision: 'v3' }, sample2]);
  });

  it('GetByDatasetRevision ', async () => {
    const actual = File.GetByDatasetRevision({
      dataset: 'sample',
      revision: 'v2',
    });
    expect(actual).excluding('id').to.deep.equal(sample2);
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
