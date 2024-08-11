#!/usr/bin/env nodejs

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE : src/admin/clean_frozen_drumate
//   CLASS :                         *
//   TYPE : application instance
// ================================  *
//

let entity, er;
const fs            = require('fs');
const _k            = require('@drumee/server-essentials/lex/constants');
const _mfs_util     = require('../lib/mfs');
const sync_mysql    = require('sync-mysql');

const current_date = new Date();
const current_formatted_date = "" + ("0" + current_date.getDate()).slice(-2) + "-" + ("0" + parseInt(current_date.getMonth() + 1)).slice(-2) + "-" + current_date.getFullYear() + "-" + ("0" + current_date.getHours()).slice(-2) + "-" + ("0" + current_date.getMinutes()).slice(-2) + "-" + ("0" + current_date.getSeconds()).slice(-2);
console.log(`******STARTED PROCESSING CLEAN FROZEN ENTITIES ${current_formatted_date} ******`);
let pass   = fs.readFileSync(_k.SECRET);
pass   = String(pass).trim().toString();
const yp = new sync_mysql({
  host     : _k.DB_HOST,
  database : _k.YELLOW_PAGE,
  user     : _k.DB_USER,
  password : pass
});
let entities = yp.call("get_frozen_entities", []);
entities = entities.filter(x => (x.fieldCount === undefined) && (x.serverStatus === undefined) && (x.affectedRows === undefined));

for (entity of entities) {
  try {
    if (entity.type === "drumate") {
      yp.call(`${entity.db_name}.leave_hubs`, []);
    }
  } catch (error) {
    er = error;
    console.log("ERROR: ", er);
  }
}

let response = yp.call("clean_frozen_entities", []);
response = response.filter(x => (x.fieldCount === undefined) && (x.serverStatus === undefined) && (x.affectedRows === undefined));
console.log("DELETED FROZEN ENTITIES", response);

if ((response.length === 0) || ((response.length > 0) && (response[0].error === 0))) {
  for (entity of entities) {
    try {
      yp.query(`DROP DATABASE ${entity.db_name}`);
      console.log(`Started processing directory - ${entity.home_dir}`);
      const _mfs = new _mfs_util();
      _mfs.remove(entity.home_dir, entity.type);
    } catch (error1) {
      er = error1;
      console.log("ERROR: ", er);
    }
  }
  console.log("CLEANED FROZEN ENTITIES SUCCESSFULLY");
} else {
  console.log("FAILED TO CLEAN FROZEN ENTITIES");
}
yp.dispose();
console.log("******COMPLETED PROCESSING CLEAN FROZEN ENTITIES******\n\n\n");