import { getServer } from './server.js';

import { paths } from './lib/fs.js';
import { logger } from './lib/logger.js';

(async () => {
  let app, db;
  try {
    ({ app, db } = await getServer({
      databaseOptions: { target: paths.database },
    }));
  } catch (e) {
    logger.error(e);
    return;
  }
})();
