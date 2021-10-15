import chai from 'chai';
import chaiExclude from 'chai-exclude';
import fetch from 'node-fetch';

import { getServer } from '../src/server.js';

chai.use(chaiExclude);
const { expect } = chai;

describe('Server ', () => {
  let app, db, insert;

  before(async function () {
    ({ app, db } = await getServer({
      databaseOptions: { path: 'data/test.db' },
    }));

    insert = db.prepare('INSERT INTO file (name, path) VALUES (@name,@path)');
  });

  after(function () {
    app?.close?.();
  });

  it('api/files : empty', async () => {
    const response = await fetch('http://localhost:3000/api/files');
    const actual = await response.json();
    expect(actual).to.deep.equal([]);
  });

  it('api/files : with sample', async () => {
    const insertMany = db.transaction((files) => {
      for (const file of files) insert.run(file);
    });
    const sample = [
      { name: 'mmp-tech', path: '/tmp/mmp-tech' },
      { name: 'mmp-books', path: '/tmp/mmp-books' },
    ];
    insertMany(sample);

    const response = await fetch('http://localhost:3000/api/files');
    const actual = await response.json();
    expect(actual).excluding('id').to.deep.equal(sample);
  });

  it('api/file  : found', async () => {
    const sample = { name: 'mmp-tech-2', path: '/tmp/mmp-tech-2' };
    insert.run(sample);

    const response = await fetch(
      `http://localhost:3000/api/file/${encodeURIComponent(sample.path)}`
    );
    const actual = await response.json();
    expect(actual).excluding('id').to.deep.equal(sample);
  });

  it('api/file  : not found', async () => {
    const response = await fetch(`http://localhost:3000/api/file/not-found`);
    const actual = await response.json();
    expect(actual).to.deep.equal({});
  });
});
