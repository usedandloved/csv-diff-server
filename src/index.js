import { Validator } from '@cfworker/json-schema';

import { processSnapshot } from './snapshot.js';
import csvdiff from './lib/csvdiff.js';
import { diffParamsSchema } from './schemas.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File) => {
  if (!validator.validate(params)?.valid) {
    console.error('invalid params');
    return;
  }

  const base = await processSnapshot(File, params.base);
  const delta = await processSnapshot(File, params.delta);

  let target = `/app/data/diffs/${base.file.dataset}`;
  if (base.file.dataset !== delta.file.dataset) {
    target += `-${delta.file.dataset}`;
  }
  target += `/${base.file.revision}-${delta.file.revision}.csv`;

  const diffResult = await csvdiff({
    base: base.file.path,
    delta: delta.file.path,
    target,
  });

  console.log(diffResult);

  return;
};
