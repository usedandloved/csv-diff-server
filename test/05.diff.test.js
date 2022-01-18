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
import { waitSeconds } from '../src/lib/utils.js';
import { logger } from '../src/lib/logger.js';

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

const sample5 = {
  dataset: 'mmp',
  revision: 'v3',
  source: `${paths.url}/test/base-mmp.csv`,
  path: null,
};

const sample6 = {
  dataset: 'mmp',
  revision: 'v4',
  source: `${paths.url}/test/delta-mmp.csv`,
  path: null,
};

const sample7 = {
  dataset: 'mmp',
  revision: 'empty1',
  source: `${paths.url}/test/empty-mmp.csv`,
  path: null,
};

const sample8 = {
  dataset: 'mmp',
  revision: 'book-ids',
  source: `${paths.url}/test/delta-mmp-book-ids.csv`,
  path: null,
};

describe.only('Server diff 2 ', () => {
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
        // transforms: `{
        //   "GlobalRank" : $number(GlobalRank) * 100,
        //   "DomainAndTLD" : $join([Domain, TLD], " ")
        // }`,
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
        'size',
        'lineCount',
      ])
      .to.deep.equal(postDiffSmallResponse({ body }));

    const dataResponse = await fetch(apiJson.diff.url);
    const data = await dataResponse.text();

    const expected = await fs.readFile(
      '/app/test/expected/diff-small.rowmark.csv'
    );
    expect(data.split('\n')).to.deep.equalInAnyOrder(`${expected}`.split('\n'));
    // return;

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

  it('post : diff mmp', async () => {
    const ualNetworkId = 'mmp';

    const body = {
      base: {
        dataset: 'mmp',
        source: sample5.source,
        revision: sample5.revision,
      },
      delta: {
        dataset: 'mmp',
        source: sample6.source,
        revision: sample6.revision,
      },
      flags: {
        format: 'rowmark',
      },
      postProcess: {
        batchSize: 1000,
        rowSchema: {
          type: 'object',
          properties: {
            condition: {
              type: 'string',
              // enum: ['USED'],
              // const: 'USED',
              pattern: '^(?!(NEW)$).*$',
            },
          },
        },
        transforms: `{
          "aw_deep_link" : aw_deep_link,
          "product_name" : product_name,
          "merchant_image_url" : merchant_image_url,
          "search_price_pennies" : $number(search_price) * 100,
          "ualId" : $join([
            '${ualNetworkId}-',
            $lowercase(merchant_product_id)
          ]) 
        }`,
      },
    };
    // One liner to make sure file is being served.
    expect((await fetch(body.base.source)).status).to.equal(200);
    expect((await fetch(body.delta.source)).status).to.equal(200);

    // return;

    const apiResponse = await fetch(`${paths.url}/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // console.log({ response });

    const apiJson = await apiResponse.json();

    // logger.debug(apiJson);
    // console.log(apiJson.diff.url);

    // return;

    const dataResponse = await fetch(apiJson.diff.url);
    const data = await dataResponse.text();

    // console.log(data);

    // return;

    const expected = await fs.readFile(
      '/app/test/expected/diff-mmp.rowmark.csv'
    );

    // Test the dist files
    for (const dist of apiJson.dists) {
      const distResponse = await fetch(dist.url);
      const distText = await distResponse.text();

      // console.log(distText);

      for (const line of distText.split('\n')) {
        expect(`${expected}`.split('\n')).contains(line);
      }
    }
  }).timeout(15000);

  it('post : diff undefined base', async () => {
    const body = {
      base: {
        dataset: 'mmp',
        source: sample6.source,
        revision: sample6.revision,
      },
      delta: undefined,
      flags: {
        format: 'rowmark',
      },
      postProcess: {
        batchSize: 1000,
        transforms: `{
          "aw_deep_link" : aw_deep_link,
          "product_name" : product_name,
          "merchant_image_url" : merchant_image_url,
          "search_price_pennies" : $number(search_price) * 100
        }`,
      },
    };

    // One liner to make sure file is being served.
    expect((await fetch(body.base.source)).status).to.equal(200);

    const apiResponse = await fetch(`${paths.url}/api/diff`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    // console.log({ response });

    let apiJson = await apiResponse.json();

    const dataResponse = await fetch(apiJson.diff.url);
    const data = await dataResponse.text();

    // console.log(data);

    const expected = await fs.readFile(apiJson.base.file.path);

    const expectedLineCount = `${expected}`.split('\n').length;

    let actualLineCount = 0;
    let i = 0;

    // Test the dist files
    for (const dist of apiJson.dists) {
      if (i) actualLineCount -= 1;

      const distResponse = await fetch(dist.url);
      const distText = await distResponse.text();

      actualLineCount += distText.split('\n').length;

      i++;
    }

    expect(actualLineCount).to.equal(expectedLineCount);
  }).timeout(60000);

  xit('post : diff undefined base, ids for reconciliation', async () => {
    const body = {
      base: {
        dataset: sample8.revision,
        source: sample8.source,
        revision: sample8.revision,
      },
      delta: undefined,
      flags: {
        format: 'rowmark',
      },
      postProcess: {
        batchSize: 10000000,
        transforms: `{
          "merchant_product_id" : merchant_product_id
        }`,
      },
    };

    // One liner to make sure file is being served.
    expect((await fetch(body.base.source)).status).to.equal(200);

    let apiResponse,
      apiJson,
      i = 0,
      intervalSeconds = 10;

    while (
      !i ||
      typeof apiJson !== 'object' ||
      (i < 100 && Object.values(apiJson).find((x) => x.progress))
    ) {
      console.log(`Loading seconds: ${i * intervalSeconds}`);
      if (i++) await waitSeconds(intervalSeconds);
      if (i % 20 === 0) {
        console.log(
          { apiJson },
          `Slow response from csv-diff-server api/diff, seconds: ${
            i * intervalSeconds
          }`
        );
      }
      try {
        apiResponse = apiResponse = await fetch(`${paths.url}/api/diff`, {
          method: 'post',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        });
        apiJson = await apiResponse.json();
      } catch (e) {
        console.error(
          { apiResponse },
          'Error fetching from csv-diff-server api/diff'
        );
        console.error(e);
      }
    }

    // return;
    expect(apiJson.dists.length).to.equal(1);

    const baseFile = await fs.readFile(apiJson.base.file.path);
    const baseFileLines = `${baseFile}`.split('\n');

    const expectedLineCount = baseFileLines.length;

    const dist = apiJson.dists[0];

    const distResponse = await fetch(dist.url);
    const distText = await distResponse.text();

    const distIds = distText.split('\n');
    expect(distIds.length).to.equal(expectedLineCount);

    let idsMatch = true;

    for (let i = 0; i < distIds.length; i++) {
      // Test that the id on this line of the dist is in the base.
      if (!baseFileLines[i].includes(distIds[i])) {
        idsMatch = false;
        break;
      }
    }
    expect(idsMatch).to.equal(true);

    return;
  }).timeout(600000); // 6 mins
});
