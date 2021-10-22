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
    path: '/app/data/small/v1-v2-yHAQmz/csvdiff.rowmark.csv',
    lineCount: 6,
    flagHash: 'yHAQmzFdibgN1iTJYM6Sek2sgz7mYLvxIK5FQGzZ6MM',
    format: 'rowmark',
    additions: 1,
    modifications: 1,
    deletions: 3,
    url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/csvdiff.rowmark.csv',
  },
  dist: [
    {
      path: '/app/data/small/v1-v2-yHAQmz/dist-COrKao/ADDED-0-rowmark.csv',
      diffState: 'added',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/ADDED-0-rowmark.csv',
    },
    {
      path: '/app/data/small/v1-v2-yHAQmz/dist-COrKao/MODIFIED-0-rowmark.csv',
      diffState: 'modified',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/MODIFIED-0-rowmark.csv',
    },
    {
      path: '/app/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-0-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-0-rowmark.csv',
    },
    {
      path: '/app/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-1-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-1-rowmark.csv',
    },
    {
      path: '/app/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-2-rowmark.csv',
      diffState: 'deleted',
      url: 'http://localhost:3001/data/small/v1-v2-yHAQmz/dist-COrKao/DELETED-2-rowmark.csv',
    },
  ],
});

export { postDiffTestResponse, postDiffSmallResponse };
