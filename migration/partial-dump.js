
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2017
//   FILE : src/utils/svc-gen
//   MANDATORY: attributes lexicon
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *

//Log       = require './log'
const _         = require('lodash');
const Fs        = require('fs');
const Shell     = require('shelljs');
const Jsonfile  = require('jsonfile');
const mysql     = require('mysql');
const Backbone  = require('backbone');
const Db           = require('../core/db/db');




//root = "/data/mfs/hub/edbd6399edbd639c/Block/"
// pass   = fs.readFileSync(_k.SECRET)
// pass   = String(pass).trim().toString()

// ----------- START OF migrate -------

const fifo = [];
const zz   = new Backbone.Model();
const files = {};

const yp           = new Db({user:process.env.USER});

console.log("---------------------------------------------------------");
console.log("Starting migration...");
console.log("---------------------------------------------------------");
const out_dir = '/data/backup/db/dump';

// ========================
cmd = function(db_name) {
  const c = `mysqldump \
    -u ${process.env.USER} --no-create-info ${db_name} > ${out_dir}/${db_name}.sql`;
  const r = Shell.exec(c);
  if (r.code !== 0) {
    console.warn("Caught error", r);
  }
}

yp.query("call migrate()", function(err, data){
  if (err) {
    console.log("ERROR", err);
    return;
  }
  // console.log("QQQQQ", data);
  let conf = [];
  for (let row of data[0]) {
    // console.log("QQQQQ HHH", row);
    if (Fs.existsSync(row.home_dir)) {
      cmd(row.db_name);
      conf.push(row);
      console.log(row.ident, row.user_filename);
    }else{
      console.log("skip...", row.ident, row.user_filename);
    }
    //fifo.push(row);
  } 
  Jsonfile.writeFileSync(`${out_dir}/meta.json`,conf); 
  yp.end();
});
