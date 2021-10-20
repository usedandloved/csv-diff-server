import { Validator } from '@cfworker/json-schema';

import { processSnapshot } from './snapshot.js';
import { diffParamsSchema } from './schemas.js';

import { paths } from './lib/fs.js';
import csvdiff, { processFlags } from './lib/csvdiff.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File, Diff) => {
  const validResult = validator.validate(params);

  if (!validResult.valid) {
    console.error('invalid params', validResult);
    return {};
  }
  let diff, flags;

  // diff = await Diff.GetByFiles({
  //   dataset,
  //   revision,
  // });

  // const flags

  const { flagString, extension } = await processFlags(params.flags);
  // console.log({ flagString, extension });

  const base = await processSnapshot(File, params.base);
  const delta = await processSnapshot(File, params.delta);

  let target = `${paths.data}/diffs/${base.file.dataset}`;
  if (base.file.dataset !== delta.file.dataset) {
    target += `-${delta.file.dataset}`;
  }
  target += `/${base.file.revision}-${delta.file.revision}.${extension}`;

  const diffResult = await csvdiff({
    base: base.file.path,
    delta: delta.file.path,
    flagString,
    target,
  });

  // console.log(diffResult);

  try {
    await Diff.Create({
      base_file_id: base.file.id,
      delta_file_id: delta.file.id,
      ...diffResult,
    });
  } catch (e) {
    console.error(e);
  }

  return {
    base,
    delta,
    diff: {
      lineCount: diffResult.lineCount,
      path: diffResult.path,
      url: diffResult.path.replace(paths.data, `${paths.url}/data`),
    },
  };
};
