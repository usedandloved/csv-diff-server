import chai from 'chai';
import chaiExclude from 'chai-exclude';

import { getDb } from '../src/database.js';
import { getFile } from '../src/File.js';

chai.use(chaiExclude);
const { expect } = chai;

describe('File model ', () => {
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
    const actual = File.Create({ name: 'mmp-test-1', path: '/tmp/mmp-test-1' });
    expect(actual).to.include({ changes: 1 });
  });

  it('Create ', async () => {
    const actual = File.Create({ name: 'mmp-test-2', path: '/tmp/mmp-test-2' });
    expect(actual).to.include({ changes: 1 });
  });

  it('Update ', async () => {
    const actual = File.Update({ name: 'mmp-test-3', path: '/tmp/mmp-test-1' });
    expect(actual).to.include({ changes: 1 });
  });

  it('GetAll ', async () => {
    const actual = File.GetAll();
    expect(actual)
      .excluding('id')
      .to.deep.equal([
        { name: 'mmp-test-3', path: '/tmp/mmp-test-1' },
        { name: 'mmp-test-2', path: '/tmp/mmp-test-2' },
      ]);
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
