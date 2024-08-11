#!/usr/bin/env nodejs

const _         = require('lodash');
const Fs        = require('fs');
const Shell     = require('shelljs');
const Jsonfile  = require('jsonfile');
const Db        = require('../core/db/db');
const yp        = new Db({user:process.env.USER, verbose:0});
const Stringify = require('json-stringify');



console.log("---------------------------------------------------------");
console.log("Starting migration...");
console.log("---------------------------------------------------------");
const in_dir = '/home/somanos/tmp/restore/drumates';
const mfs_dir = '/home/somanos/tmp/restore/mfs';

// ========================
check = function(item, cb) {

  yp.query(`SELECT count(*) as c FROM ${item.db_name}.permission`,
  function(e, d){
    if(e){
      console.warn(`ERROR IN ${item.db_name}`, e);
    }
    cb()
  });
}

// ========================
read_conf = function() {
    yp.query(`SELECT id, home_dir, ident, db_name FROM entity where area='pool'`, 
    function(err, data){
      const c = _.after(data.length, ()=>{
        yp.end();
      });
      for(let row of data){
        check(row, c);
    }
  });
}
read_conf()