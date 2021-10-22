import { Validator } from '@cfworker/json-schema';
import fs from 'fs-extra';

import { processSnapshot } from './snapshot.js';
import { diffParamsSchema } from './schemas.js';

import { paths, withUrls, isDistPathsIsMissing } from './lib/fs.js';
import csvdiff, { processFlags } from './lib/csvdiff.js';
import { postProcess } from './lib/postProcess.js';
import { objectHash } from './lib/utils.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File, Diff, Dist) => {
  const validResult = validator.validate(params);

  if (!validResult.valid) {
    console.error('invalid params', validResult);
    return {};
  }
  let diff, flagString, flagHash, flagHashShort, format, extension, base, delta;

  try {
    ({ flagString, flagHash, flagHashShort, format, extension } =
      await processFlags(params.flags));
  } catch (e) {
    console.error(e);
  }

  // console.log(params);
  // console.log({ flagString, extension });

  try {
    base = await processSnapshot(File, params.base, params.preProcess);
  } catch (e) {
    console.error(e);
  }
  try {
    delta = await processSnapshot(File, params.delta, params.preProcess);
  } catch (e) {
    console.error(e);
  }

  // console.log({ base, delta });

  let diffPath = `${paths.data}/${base.file.dataset}`;
  if (base.file.dataset !== delta.file.dataset) {
    diffPath += `-${delta.file.dataset}`;
  }
  diffPath += `/${base.file.revision}-${delta.file.revision}`;
  if (flagHashShort) {
    diffPath += `-${flagHashShort}`;
  }
  const diffTarget = `${diffPath}/csvdiff.${extension}`;

  const diffUniqueProps = {
    baseFileId: base.file.id,
    deltaFileId: delta.file.id,
    flagHash,
    format,
  };

  diff = await Diff.GetByFileIdsHashFormat(diffUniqueProps);

  if (!diff || !(await fs.pathExists(diff.path))) {
    const diffResult = await csvdiff({
      base: base.file.path,
      delta: delta.file.path,
      flagString,
      target: diffTarget,
    });

    // console.log(diffResult);

    try {
      await Diff.Create({
        baseFileId: base.file.id,
        deltaFileId: delta.file.id,
        ...diffResult,
        flagHash,
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

  // let target = `${paths.data}/${base.file.dataset}`;
  // if (base.file.dataset !== delta.file.dataset) {
  //   target += `-${delta.file.dataset}`;
  // }
  // target += `/${base.file.revision}-${delta.file.revision}`;
  // if (flagHashShort) {
  //   target += `-${flagHashShort}`;
  // }
  // target += `/diff.${extension}`;

  let dists;

  if (params.postProcess) {
    // console.log(diff);

    const postProcessHash = `${objectHash(params.postProcess)}`;

    dists = Dist.GetByDiffIdPostProcessHash({
      diffId: diff.id,
      postProcessHash,
    });

    if (dists && (await isDistPathsIsMissing(dists))) {
      console.error('a dist path is missing. Will re-do');
      Dist.DeleteMany(dists);
      dists = undefined;
    }

    if (!dists) {
      console.log('will make dists');
      let target = {
        dir: `${diffPath}/dist`,
        extension,
      };

      if (Object.keys(params.postProcess).length) {
        target.dir += `-${postProcessHash.substring(0, 6)}`;
      }
      try {
        dists = await postProcess(diff, params.postProcess, target);
      } catch (e) {
        console.error(e);
      }

      dists = dists.map((obj) => ({
        ...obj,
        diffId: diff.id,
        postProcessHash,
      }));

      Dist.CreateMany(dists);
    }
  }

  // console.log(withUrls(dists));

  // console.log(dists);

  return {
    base,
    delta,
    diff: withUrls(diff),
    dists: withUrls(dists),
  };
};
