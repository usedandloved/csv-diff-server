import { paths } from '../../src/lib/fs.js';

const postDiffTestResponse = ({ body }) => ({
  base: {
    file: {
      ...body.base,
      path: `${paths.data}/sample/snapshots/v1.csv`,
    },
    done: ['created', 'downloaded'],
  },
  delta: {
    file: {
      ...body.delta,
      path: `${paths.data}/sample/snapshots/v2.csv`,
    },
    done: ['created', 'downloaded'],
  },
  diff: {
    flagHash: 'yHAQmzFdibgN1iTJYM6Sek2sgz7mYLvxIK5FQGzZ6MM',
    format: 'rowmark',
    lineCount: 2,
    path: `${paths.data}/sample/v1-v2-yHAQmz/csvdiff.rowmark.csv`,
    url: `${paths.url}/data/sample/v1-v2-yHAQmz/csvdiff.rowmark.csv`,
    additions: 0,
    modifications: 1,
    deletions: 0,
  },
  dists: [
    {
      path: '/tmp/data/sample/v1-v2-yHAQmz/dist-COrKao/modified-0-rowmark.csv',
      diffState: 'modified',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
      url: 'http://localhost:3001/data/sample/v1-v2-yHAQmz/dist-COrKao/modified-0-rowmark.csv',
    },
  ],
});
const postDiffSmallResponse = ({ body }) => ({
  base: {
    file: {
      ...body.base,
      path: `${paths.data}/small/snapshots/v1.csv`,
    },
    done: ['created', 'downloaded'],
  },
  delta: {
    file: {
      ...body.delta,
      path: `${paths.data}/small/snapshots/v2.csv`,
    },
    done: ['created', 'downloaded'],
  },
  diff: {
    path: '/tmp/data/small/v1-v2-yHAQmz/csvdiff.rowmark.csv',
    lineCount: 6,
    flagHash: 'yHAQmzFdibgN1iTJYM6Sek2sgz7mYLvxIK5FQGzZ6MM',
    format: 'rowmark',
    additions: 1,
    modifications: 1,
    deletions: 3,
    url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/csvdiff.rowmark.csv',
  },
  dists: [
    {
      path: '/tmp/data/small/v1-v2-yHAQmz/dist-COrKao/added-0-rowmark.csv',
      diffState: 'added',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/added-0-rowmark.csv',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
    },
    {
      path: '/tmp/data/small/v1-v2-yHAQmz/dist-COrKao/modified-0-rowmark.csv',
      diffState: 'modified',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/modified-0-rowmark.csv',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
    },
    {
      path: '/tmp/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-0-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-0-rowmark.csv',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
    },
    {
      path: '/tmp/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-1-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-1-rowmark.csv',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
    },
    {
      path: '/tmp/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-2-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/deleted-2-rowmark.csv',
      postProcessHash: 'COrKaogL2uaaPL3sNW5hJIvubwAevfThs5vUJ31tI60',
    },
  ],
});

export { postDiffTestResponse, postDiffSmallResponse };
