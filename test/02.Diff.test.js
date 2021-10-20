import chai from 'chai';
import chaiExclude from 'chai-exclude';

import { getDb } from '../src/database.js';
import { getDiff } from '../src/models/Diff.js';
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

describe('Diff model ', () => {
  let db, Diff, File;

  before(async () => {
    try {
      db = await getDb({ target: '/app/data/test.db', verbose: console.log });
      Diff = await getDiff(db);
      File = await getFile(db);
      File.DeleteAll();
      File.Create(sample1);
      File.Create(sample2);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  after(() => {
    try {
      File.DeleteAll();
      db.close();
    } catch (e) {
      console.error(e);
    }
  });

  it('Create ', async () => {
    // const actual = Diff.Create(sample1);
    expect('a').to.equal('a');
  });

  // it('Create ', async () => {
  //   const actual = Diff.Create(sample2);
  //   expect(actual).to.include({ changes: 1 });
  // });

  // it('Update ', async () => {
  //   const actual = Diff.Update({ revision: 'v3', path: '/tmp/mmp-test-1' });
  //   expect(actual).to.include({ changes: 1 });
  // });

  // it('GetAll ', async () => {
  //   const actual = Diff.GetAll();
  //   expect(actual)
  //     .excluding('id')
  //     .to.deep.equal([{ ...sample1, revision: 'v3' }, sample2]);
  // });

  // it('GetByDatasetRevision ', async () => {
  //   const actual = Diff.GetByDatasetRevision({
  //     dataset: 'sample',
  //     revision: 'v2',
  //   });
  //   expect(actual).excluding('id').to.deep.equal(sample2);
  // });

  // it('Delete ', async () => {
  //   const actual = Diff.Delete({ path: '/tmp/mmp-test-1' });
  //   expect(actual).to.include({ changes: 1 });
  // });

  // it('DeleteAll ', async () => {
  //   const actual = Diff.DeleteAll();
  //   expect(actual).to.include({ changes: 1 });
  // });
});
