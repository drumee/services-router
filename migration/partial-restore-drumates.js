
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
const Db           = require('../core/db/db');
const yp           = new Db({user:process.env.USER, verbose:0});
const Stringify = require('json-stringify');



console.log("---------------------------------------------------------");
console.log("Starting migration...");
console.log("---------------------------------------------------------");
const in_dir = '/home/somanos/tmp/restore/drumates';
const mfs_dir = '/home/somanos/tmp/restore/mfs';

// ========================
restore_db = function(items) {
  // let remotes = Jsonfile.readFileSync(`${in_dir}/meta.json`);
  let c;
  let length = _.values(items).length;
  let j = 0;
  for(let i in items){
    j++;
    let r = items[i];
    // console.log(`RESTORING  : `, i, r);
    Shell.mkdir('-p', `${mfs_dir}/user${r.dest.home_dir}`);
    c = `rsync -rav drumee.net:${r.src.home_dir} ${mfs_dir}/user${r.dest.home_dir}`;
    console.log(`RESTORING ${j}/${length} : ${c}`);
    let sync = Shell.exec(c, {silent:true});
    if (sync.code !== 0) {
      console.warn(`****** Failed to restore MFS ${j}/${length} ==> ${r.db_name}`, c);
    }
  }
}

// ========================
read_conf = function() {
  let remotes = Jsonfile.readFileSync(`${in_dir}/meta.json`);
  let out = {};
  const count = _.after(remotes.length, ()=>{
    restore_db(out);
    yp.end();
  });
  for (let r of remotes){
    yp.query(`SELECT name, id, h.id as hub_id, home_dir, ident, db_name FROM entity join hub h using(id) where db_name='${r.db_name}'`, 
      function(err, data){
        let l = data[0];
        if(!l){
          //console.log(`NEW HUB  ${r.db_name} `, Stringify(r), r);
          yp.call_proc('migrate_drumates', Stringify(r),
            function(e, d){
            l = d[0][0];
            console.log("KKKKKKK", e, l);
            out[r.db_name]={
              src:{
                home_dir : r.home_dir,
                db_name  : r.db_name
              },
              dest:{
                home_dir : l.home_dir,
                db_name  : l.db_name
              }
            }
            count();
          })
        }else{
          if(l.db_name === r.db_name){
            out[r.db_name]={
              src:{
                home_dir : r.home_dir,
                db_name  : r.db_name
              },
              dest:{
                home_dir : l.home_dir,
                db_name  : l.db_name
              }
            }
          }
          count();
        }
      })
  }
}
read_conf()