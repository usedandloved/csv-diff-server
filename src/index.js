import { getServer } from './server.js';

import { paths } from './lib/fs.js';

(async () => {
  let app, db;
  try {
    ({ app, db } = await getServer({
      databaseOptions: { target: paths.database },
    }));
  } catch (e) {
    console.error(e);
    return;
  }
})();
