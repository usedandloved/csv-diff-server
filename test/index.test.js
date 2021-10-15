import Database from 'better-sqlite3';
import { expect } from 'chai';
import fs from 'fs';

import { getServer } from '../src/server.js';

describe('test functions ', () => {
  let app;

  before(async function () {
    app = getServer();
  });

  after(function () {
    app?.server?.close();
  });

  // const db = new Database('data/foobar.db', { verbose: console.log });

  // db.exec(
  //   'CREATE TABLE IF NOT EXISTS `FILES` (`Full Type` TEXT, `Serial` TEXT, `Add data` TEXT, `c/n` TEXT, `Unit` TEXT, `Remarks` TEXT, `Location` TEXT, `Date` TEXT, `Country` TEXT, `Operator` TEXT, `Basic Type` TEXT, `Oper` TEXT, `Status` TEXT, `New` TEXT)'
  // );

  // db.exec("INSERT INTO `FILES` (`Full Type`) VALUES ('test2')");

  // console.log(db.prepare('SELECT * FROM `FILES`').all());

  it('test', async () => {
    expect('a').to.equal('a');
  });
});
