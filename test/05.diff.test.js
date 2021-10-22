import chai from 'chai';
import chaiExclude from 'chai-exclude';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import fetch from 'node-fetch';
import fs from 'fs-extra';

import { getServer } from '../src/server.js';
import { paths } from '../src/lib/fs.js';

import {
  postDiffTestResponse,
  postDiffSmallResponse,
} from './expected/index.js';

chai.use(chaiExclude);
chai.use(deepEqualInAnyOrder);
const { expect } = chai;

const sample1 = {
  dataset: 'sample',
  revision: 'v1',
  source: `${paths.url}/test/base-test.csv`,
  path: null,
};

const sample2 = {
  dataset: 'sample',
  revision: 'v2',
  source: `${paths.url}/test/delta-test.csv`,
  path: null,
};
const sample3 = {
  dataset: 'small',
  revision: 'v1',
  source: `${paths.url}/test/base-small.csv`,
  path: null,
};

const sample4 = {
  dataset: 'small',
  revision: 'v2',
  source: `${paths.url}/test/delta-small.csv`,
  path: null,
};

describe('Server diff 2 ', () => {
  let app, db, deleteAllDist, deleteAllDiff, deleteAllFile;

  before(async () => {
    try {
      ({ app, db } = await getServer({
        databaseOptions: { target: paths.database },
      }));
      deleteAllDist = db.prepare('DELETE FROM dist');
      deleteAllDiff = db.prepare('DELETE FROM diff');
      deleteAllFile = db.prepare('DELETE FROM file');
      // await new Promise((resolve) => setTimeout(resolve, 500));
      await deleteAllDist.run();
      await deleteAllDiff.run();
      await deleteAllFile.run();
    } catch (e) {
      console.error(e);
      throw e;
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
    // await deleteAll.run();
    const body = {
      base: {
        dataset: sample1.dataset,
        source: sample1.source,
        revision: sample1.revision,
      },
      delta: {
        dataset: sample2.dataset,
        source: sample2.source,
        revision: sample2.revision,
      },
      flags: {
        format: 'rowmark',
        // columns: '1,2',
        // 'ignore-columns': '1',
        // include: '1',
        // 'primary-key': '1',
        // separator: ',',
        time: true,
      },
      postProcess: {
        batchSize: 1,
      },
    };
    // One liner to make sure file is being served.

    expect((await fetch(body.base.source)).status).to.equal(200);
    expect((await fetch(body.delta.source)).status).to.equal(200);

    // console.log(JSON.stringify(body));

    const apiResponse = await fetch(`${paths.url}/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // console.log({ response });

    const apiJson = await apiResponse.json();

    // console.log(apiJson);

    expect(apiJson)
      .excludingEvery([
        'id',
        'baseFileId',
        'deltaFileId',
        'createdAt',
        'time',
        'diffId',
      ])
      .to.deep.equal(postDiffTestResponse({ body }));

    const dataResponse = await fetch(apiJson.diff.url);
    const data = await dataResponse.text();
    expect(data).to.equal('t1,t2,CSVDIFF_STATE\nv1,v2e,MODIFIED\n');

    // Test the dist files
    for (const dist of apiJson.dists) {
      const distResponse = await fetch(dist.url);
      const distText = await distResponse.text();
      if ('modified' === dist.diffState) {
        // console.log(dist);
        // console.log('dist matches');
        expect(distText).to.equal('t1,t2,CSVDIFF_STATE\nv1,v2e,MODIFIED');
      }
    }
  }).timeout(15000);

  it('post : diff small', async () => {
    // await deleteAll.run();
    const body = {
      base: {
        dataset: sample3.dataset,
        source: sample3.source,
        revision: sample3.revision,
      },
      delta: {
        dataset: sample4.dataset,
        source: sample4.source,
        revision: sample4.revision,
      },
      preProcess: {
        headers: [
          'GlobalRank',
          'TldRank',
          'Domain',
          'TLD',
          'RefSubNets',
          'RefIPs',
          'IDN_Domain',
          'IDN_TLD',
          'PrevGlobalRank',
          'PrevTldRank',
          'PrevRefSubNets',
          'PrevRefIPs',
        ],
      },
      flags: {
        format: 'rowmark',
        // columns: '1,2',
        // 'ignore-columns': '1',
        // include: '1',
        // 'primary-key': '1',
        // separator: ',',
        time: true,
      },
      postProcess: {
        batchSize: 1,
      },
    };
    // One liner to make sure file is being served.

    expect((await fetch(body.base.source)).status).to.equal(200);
    expect((await fetch(body.delta.source)).status).to.equal(200);

    // console.log(JSON.stringify(body));

    const apiResponse = await fetch(`${paths.url}/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // console.log({ response });

    const apiJson = await apiResponse.json();

    // console.log(apiJson.diff);
    // console.log(apiJson.dist);

    expect(apiJson)
      .excludingEvery([
        'id',
        'baseFileId',
        'deltaFileId',
        'createdAt',
        'time',
        'diffId',
      ])
      .to.deep.equal(postDiffSmallResponse({ body }));

    const dataResponse = await fetch(apiJson.diff.url);
    const data = await dataResponse.text();

    const expected = await fs.readFile(
      '/app/test/expected/diff-small.rowmark.csv'
    );
    expect(data.split('\n')).to.deep.equalInAnyOrder(`${expected}`.split('\n'));

    // Test the dist files
    for (const dist of apiJson.dists) {
      const distResponse = await fetch(dist.url);
      const distText = await distResponse.text();
      for (const line of distText.split('\n')) {
        expect(`${expected}`.split('\n')).contains(line);
      }
    }

    // TODO:
    // Add some real world data
    // Test and implement jsonata
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

    const response = await fetch(`${paths.url}/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // const actual = await response.text();
  }).timeout(15000);
});
