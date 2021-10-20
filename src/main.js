import { Validator } from '@cfworker/json-schema';

import { processSnapshot } from './snapshot.js';
import { diffParamsSchema } from './schemas.js';

import { paths } from './lib/fs.js';
import csvdiff, { processFlags } from './lib/csvdiff.js';
import { postProcess } from './lib/postProcess.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File, Diff) => {
  const validResult = validator.validate(params);

  if (!validResult.valid) {
    console.error('invalid params', validResult);
    return {};
  }
  let diff, flagString, flagHash, format, extension, base, delta;

  try {
    ({ flagString, flagHash, format, extension } = await processFlags(
      params.flags
    ));
  } catch (e) {
    console.error(e);
  }

  // console.log(params);
  // console.log({ flagString, extension });

  try {
    base = await processSnapshot(File, params.base);
  } catch (e) {
    console.error(e);
  }
  try {
    delta = await processSnapshot(File, params.delta);
  } catch (e) {
    console.error(e);
  }

  // console.log({ base, delta });

  let target = `${paths.data}/diffs/${base.file.dataset}`;
  if (base.file.dataset !== delta.file.dataset) {
    target += `-${delta.file.dataset}`;
  }
  target += `/${base.file.revision}-${delta.file.revision}.${extension}`;

  const diffUniqueProps = {
    base_file_id: base.file.id,
    delta_file_id: delta.file.id,
    flag_hash: flagHash,
    format,
  };

  diff = await Diff.GetByFileIdsHashFormat(diffUniqueProps);

  if (!diff) {
    const diffResult = await csvdiff({
      base: base.file.path,
      delta: delta.file.path,
      flagString,
      target,
    });

    console.log(diffResult);

    try {
      await Diff.Create({
        base_file_id: base.file.id,
        delta_file_id: delta.file.id,
        ...diffResult,
        flag_hash: flagHash,
        line_count: diffResult.lineCount,
        format,
      });
    } catch (e) {
      console.error(e);
    }

    try {
      diff = await Diff.GetByFileIdsHashFormat(diffUniqueProps);
    } catch (e) {
      console.error(e);
    }
  }

  if ('rowmark' === format && params.postProcess) {
    postProcess(diff, params.postProcess);
  }

  return {
    base,
    delta,
    diff,
  };
};
