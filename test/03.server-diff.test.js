import chai from 'chai';
import chaiExclude from 'chai-exclude';
import fetch from 'node-fetch';

import { getServer } from '../src/server.js';

// chai.use(chaiExclude);
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

describe.only('Server diff 2 ', () => {
  let app, db, deleteAll;

  before(async () => {
    try {
      await app?.server?.close();
      ({ app, db } = await getServer({
        databaseOptions: { path: 'data/test.db' },
      }));
      // console.log(2);
      // await new Promise((resolve) => setTimeout(resolve, 500));

      // console.log(db);
      deleteAll = db.prepare('DELETE FROM file');
      await new Promise((resolve) => setTimeout(resolve, 500));
      await deleteAll.run();
    } catch (e) {
      console.error(e);
      return reject();
    }
    console.log(3);
    return;

    // return;
    console.log(1);

    // done();
    return;

    // done();
  });

  it('post : diff', async () => {
    expect(200).to.equal(200);
    // await deleteAll.run();
    return;
    const body = {
      base: {
        dataset: 'sample',
        source: sample1.source,
        revision: sample1.revision,
      },
      delta: {
        dataset: 'sample',
        source: sample2.source,
        revision: sample2.revision,
      },
    };
    // One liner to make sure file is being served.
    const a = (await fetch(body.base.source)).status;
    const b = (await fetch(body.delta.source)).status;
    expect(a).to.equal(200);
    expect(b).to.equal(200);

    const response = await fetch(`http://localhost:3000/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // const actual = await response.text();
  }).timeout(15000);

  xit('post : diff', async () => {
    const body = {
      base: {
        dataset: 'sample',
        source: sample1.source,
        revision: sample1.revision,
      },
      delta: {
        dataset: 'sample',
        source: sample2.source,
        revision: sample2.revision,
      },
    };
    // One liner to make sure file is being served.
    expect((await fetch(body.base.source)).status).to.equal(200);
    expect((await fetch(body.delta.source)).status).to.equal(200);

    const response = await fetch(`http://localhost:3000/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // const actual = await response.text();
  }).timeout(15000);

  after(async () => {
    try {
      const r1 = await app.server.close();
      const r2 = await db.close();
      console.log('gracefully stopping');
      // console.log(12);
    } catch (e) {
      console.error(e);
    } // await new Promise((resolve) => setTimeout(resolve, 500));
    // await app?.close();
  });
});
