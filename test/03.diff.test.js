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
      ({ app, db } = await getServer({
        databaseOptions: { path: 'data/test.db' },
      }));
      deleteAll = db.prepare('DELETE FROM file');
      // await new Promise((resolve) => setTimeout(resolve, 500));
      deleteAll.run();
    } catch (e) {
      console.error(e);
      return reject();
    }
  });

  after(async () => {
    try {
      await app.close();
    } catch (e) {
      console.error(e);
    }
  });

  it('post : diff', async () => {
    expect(200).to.equal(200);
    // await deleteAll.run();
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
});
