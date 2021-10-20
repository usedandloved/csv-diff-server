import { Validator } from '@cfworker/json-schema';

import { processSnapshot } from './snapshot.js';
import { diffParamsSchema } from './schemas.js';

import { paths } from './lib/fs.js';
import csvdiff from './lib/csvdiff.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File, Diff) => {
  if (!validator.validate(params)?.valid) {
    console.error('invalid params');
    return;
  }
  let diff;

  // diff = await Diff.GetByFiles({
  //   dataset,
  //   revision,
  // });

  const base = await processSnapshot(File, params.base);
  const delta = await processSnapshot(File, params.delta);

  let target = `${paths.data}/diffs/${base.file.dataset}`;
  if (base.file.dataset !== delta.file.dataset) {
    target += `-${delta.file.dataset}`;
  }
  target += `/${base.file.revision}-${delta.file.revision}.csv`;

  const diffResult = await csvdiff({
    base: base.file.path,
    delta: delta.file.path,
    target,
  });

  return {
    base,
    delta,
    diff: {
      lineCount: diffResult.lineCount,
      path: diffResult.target,
      url: diffResult.target.replace(paths.data, `${paths.url}/data`),
    },
  };
};
