// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE : src/admin/clean_expired_contributors
//   CLASS :                         *
//   TYPE : application instance
// ================================  *
//

const path_map =
  {'/home/somanos/drumee/server/build' : '/dev/back/somanos/ws'};

const name_spaces   = {};

const http          = require('http');
const url           = require('url');

const fs            = require('fs');
//String        = require 'string'
const shell         = require('shelljs');
const path          = require('path');
const Backbone      = require('backbone');
const _             = require('lodash');
const _e            = require('@drumee/server-essentials/lex/event');
const _a            = require('@drumee/server-essentials/lex/attribute');
const _k            = require('@drumee/server-essentials/lex/constants');
const sync_mysql    = require('sync-mysql');

const current_date = new Date();
const current_formatted_date = "" + ("0" + current_date.getDate()).slice(-2) + "-" + ("0" + parseInt(current_date.getMonth() + 1)).slice(-2) + "-" + current_date.getFullYear() + "-" + ("0" + current_date.getHours()).slice(-2) + "-" + ("0" + current_date.getMinutes()).slice(-2) + "-" + ("0" + current_date.getSeconds()).slice(-2);
console.log(`******STARTED PROCESSING CLEAN EXPIRED CONTRIBUTORS ${current_formatted_date} ******`);
let pass   = fs.readFileSync(_k.SECRET);
pass   = String(pass).trim().toString();
const yp = new sync_mysql({
  host     : _k.DB_HOST,
  database : _k.YELLOW_PAGE,
  user     : _k.DB_USER,
  password : pass
});
let hubs = yp.call("hub_list", []);
hubs = hubs.filter(x => (x.fieldCount === undefined) && (x.serverStatus === undefined) && (x.affectedRows === undefined));

for (let hub of hubs) {
  console.log(`Started processing database - ${hub.db_name}`);
  try {
    let hubers = yp.call(`${hub.db_name}.get_expired_huber`, []);
    hubers = hubers.filter(x => (x.fieldCount === undefined) && (x.serverStatus === undefined) && (x.affectedRows === undefined));
    for (let huber of hubers) {
      console.log(`Started removing huber - ${huber.id}`);
      yp.call(`${hub.db_name}.remove_huber`, [`${huber.id}`]);
    }
  } catch (er) {
    console.log("ERROR: ", er);
  }
}
yp.dispose();
console.log("******COMPLETED PROCESSING CLEAN EXPIRED CONTRIBUTORS******\n\n\n");