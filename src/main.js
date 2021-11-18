import { Validator } from '@cfworker/json-schema';
import fs from 'fs-extra';

import { processSnapshot } from './snapshot.js';
import { diffParamsSchema } from './schemas.js';

import { paths, withUrls, isDistPathsIsMissing } from './lib/fs.js';
import csvdiff, { processFlags } from './lib/csvdiff.js';
import { postProcess } from './lib/postProcess.js';
import { objectHash, waitSeconds } from './lib/utils.js';

const validator = new Validator(diffParamsSchema);

export default async (params, File, Diff, Dist, updateResponse) => {
  let validResult;

  try {
    validResult = validator.validate(params);
  } catch (e) {
    console.error(e);
  }

  if (!validResult.valid) {
    console.error('invalid params', validResult);
    return {};
  }

  let diff, flagString, flagHash, flagHashShort, format, extension, base, delta;

  updateResponse({
    base: { progress: 'pending' },
    delta: params.delta ? { progress: 'pending' } : undefined,
    diff: params.delta ? { progress: 'pending' } : undefined,
    dists: params.postProcess ? { progress: 'pending' } : undefined,
  });

  try {
    ({ flagString, flagHash, flagHashShort, format, extension } =
      await processFlags(params.flags));
  } catch (e) {
    console.error(e);
  }

  // if (isTimedOut) return result;

  // console.log(params);
  // console.log({ flagString, extension });

  try {
    base = await processSnapshot(File, params.base, params.preProcess);
  } catch (e) {
    console.error(e);
  }

  updateResponse({ base });

  let diffPath = '';

  if (params.delta) {
    try {
      delta = await processSnapshot(File, params.delta, params.preProcess);
    } catch (e) {
      console.error(e);
      params.delta = undefined;
      updateResponse({
        delta: 'aborted - could not find file and had no source',
      });
    }
  }

  if (params.delta) {
    updateResponse({ delta });

    // console.log({ base, delta });

    diffPath = `${paths.data}/${base.file.dataset}`;
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

    if (diff && !(await fs.pathExists(diff.path))) {
      await Dist.DeleteByDiffId({ diffId: diff.id });
      await Diff.DeleteByFileIdsHashFormat(diffUniqueProps);
      diff = undefined;
    }

    if (!diff) {
      const diffResult = await csvdiff({
        base: base.file.path,
        delta: delta.file.path,
        flagString,
        target: diffTarget,
      });

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

    updateResponse({ diff: withUrls(diff) });
  } else {
    diff = { id: null, path: base.file.path };
    diffPath = `${paths.data}/${base.file.dataset}`;
    diffPath += `/${base.file.revision}`;
    if (flagHashShort) {
      diffPath += `-${flagHashShort}`;
    }
  }

  let dists;

  if (params.postProcess) {
    const postProcessHash = `${objectHash(params.postProcess)}`;

    if (diff.id) {
      dists = Dist.GetByDiffIdPostProcessHash({
        diffId: diff.id,
        postProcessHash,
      });
    } else {
      // console.log('hi');
      // console.log(base.file.id);
      // console.log(postProcessHash);
      try {
        dists = Dist.GetByFileIdPostProcessHash({
          fileId: base.file.id,
          postProcessHash,
        });
      } catch (e) {
        console.error(e);
      }
    }

    // console.log({ dists });
    // return;

    if (dists.length && (await isDistPathsIsMissing(dists))) {
      console.error('a dist path is missing. Will re-do');
      Dist.DeleteMany(dists);
      dists = [];
    }

    if (!dists.length) {
      // console.log('will make dists');
      let target = {
        dir: `${diffPath}/dist`,
        extension,
      };

      if (Object.keys(params.postProcess).length) {
        target.dir += `-${postProcessHash.substring(0, 6)}`;
      }
      try {
        dists = await postProcess(
          diff,
          params.postProcess,
          target,
          (percentage) => {
            updateResponse({ dists: { progress: percentage } });
          }
        );
      } catch (e) {
        console.error(e);
      }

      // console.log(dists);

      dists = dists.map((obj) => ({
        ...obj,
        diffId: diff.id,
        fileId: diff.id ? null : base.file.id,
        postProcessHash,
      }));

      try {
        Dist.CreateMany(dists);
      } catch (e) {
        console.error(e);
      }
    }
  }

  updateResponse(null, true);

  return {
    base,
    delta,
    diff: withUrls(diff),
    dists: withUrls(dists),
  };
};
