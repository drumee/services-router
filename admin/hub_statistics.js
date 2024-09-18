// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE : src/admin/hub_statistics
//   CLASS :                         *
//   TYPE : application instance
// ================================  *
//

const path_map =
  {'/home/somanos/drumee/server/build' : '/dev/back/somanos/ws'};

const name_spaces = {};

const http     = require('http');
const url      = require('url');

const fs       = require('fs');
//String   = require 'string'
const shell    = require('shelljs');
const path     = require('path');
const Backbone = require('backbone');
const _        = require('lodash');


const _e       = require('@drumee/server-essentials/lex/event');
const _a       = require('@drumee/server-essentials/lex/attribute');
const _k       = require('@drumee/server-essentials/lex/constants');
const sync_mysql    = require('sync-mysql');
const fsUtils = require("nodejs-fs-utils");

const current_date = new Date();
const current_formatted_date = "" + ("0" + current_date.getDate()).slice(-2) + "-" + ("0" + parseInt(current_date.getMonth() + 1)).slice(-2) + "-" + current_date.getFullYear() + "-" + ("0" + current_date.getHours()).slice(-2) + "-" + ("0" + current_date.getMinutes()).slice(-2) + "-" + ("0" + current_date.getSeconds()).slice(-2);
console.log(`******STARTED PROCESSING STATISTICS ${current_formatted_date} ******`);
let pass   = fs.readFileSync(_k.SECRET);
pass   = String(pass).trim().toString();
const yp = new sync_mysql({
  host     : _k.DB_HOST,
  database : _k.YELLOW_PAGE,
  user     : _k.DB_USER,
  password : pass
});
const hub_list = yp.query("call hub_list()");
for (let hub of hub_list[0]) {
  try {
    const config  = { skipErrors : true, symbolicLinks : true, countFolders : true, countSymbolicLinks : true };
    const size = fsUtils.fsizeSync(hub.home_dir, config);
    // commandOutput = shell.exec("du -hcsb #{hub.home_dir}").stdout
    // folderSize = (commandOutput.split "\n", 2)[1].split "\t", 2
    // size = folderSize[0]
    console.log(`Started processing database - ${hub.db_name}`);
    if (typeof err !== 'undefined' && err !== null) {
      console.log("ERROR: ", err);
      throw err;
    }
    // console.log(size + ' bytes');
    // console.log((size / 1024 / 1024).toFixed(2) + ' MB');
    const args = [size];
    yp.call(`${hub.db_name}.statistics_add`, args);
  } catch (er) {
    console.log("ERROR: ", er);
  }
}
yp.dispose();
console.log("******COMPLETED PROCESSING STATISTICS******\n\n\n");
