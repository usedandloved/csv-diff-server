import chai from 'chai';
import chaiExclude from 'chai-exclude';
import fetch from 'node-fetch';

import { getServer } from '../src/server.js';

chai.use(chaiExclude);
const { expect } = chai;

const sample1 = {
  dataset: 'sample',
  revision: 'v1',
  source: `http://localhost:3000/test/base-test.csv`,
  path: null,
};

const sample2 = {
  dataset: 'sample',
  revision: 'v2',
  source: `http://localhost:3000/test/delta-test.csv`,
  path: null,
};

xdescribe('Server ', () => {
  let app, db, insert, deleteAll;

  before(async function () {
    ({ app, db } = await getServer({
      databaseOptions: { path: 'data/test.db' },
    }));

    insert = db.prepare(
      'INSERT INTO file ( path, dataset, revision, source) VALUES (@path,@dataset,@revision,@source)'
    );
    deleteAll = db.prepare('DELETE FROM file');
    await deleteAll.run();
  });

  after(async function () {
    await app?.close?.();
  });

  it('api/files : empty', async () => {
    let response;
    try {
      response = await fetch('http://localhost:3000/api/files');
    } catch (e) {
      console.error(e);
    }
    const actual = await response.json();
    expect(actual).to.deep.equal([]);
  });

  it('api/files : with sample', async () => {
    const insertMany = await db.transaction((files) => {
      for (const file of files) insert.run(file);
    });

    await insertMany([sample1, sample2]);

    const response = await fetch('http://localhost:3000/api/files');
    const actual = await response.json();
    expect(actual).excluding('id').to.deep.equal([sample1, sample2]);
  });

  it('api/file  : found', async () => {
    await insert.run(sample1);

    const response = await fetch(
      `http://localhost:3000/api/file/${encodeURIComponent(sample1.path)}`
    );
    const actual = await response.json();
    expect(actual).excluding('id').to.deep.equal(sample1);
  });

  it('api/file  : not found', async () => {
    const response = await fetch(`http://localhost:3000/api/file/not-found`);
    const actual = await response.json();
    expect(actual).to.deep.equal({});
  });

  it('get : test/test.csv', async () => {
    const csvUrl = `http://localhost:3000/test/base-test.csv`;
    const response = await fetch(csvUrl);
    const actual = await response.text();
    expect(actual).to.equal(`t1,t2\nv1,v2`);
  });

  xit('post : api/file', async () => {
    const csvUrl = `http://localhost:3000/test/test.csv`;
    // One liner to make sure file is being served.
    // It is equivalent to the 'get : test/test.csv' test.
    expect(await (await fetch(csvUrl)).text()).to.equal(`t1,t2\nv1,v2`);

    const body = { remote: csvUrl };
    const response = await fetch(`http://localhost:3000/api/file`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    // console.log(response);
    const actual = await response.json();
    console.log(actual);
    // expect(actual).to.deep.equal({});
  });
});
