
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *


const _         = require('lodash');
const Backbone  = require('backbone');
const Cache     = require('../../dataset/cache');
const fs        = require('fs');
const Shell     = require('shelljs');
const Db        = require('../../core/db/db');
const {Cache, Mariadb} = require("@drumee/server-essentials");

class __backup extends Backbone.Model {
// ========================
// initialize
// 
// ========================
  initialize(opt) {
    new Cache({lang:'en'});
    this.yp    = new Mariadb();
  }
      
// ========================
  cmd(db_name, out_dir) {
    const c = `mysqldump \
-u ${process.env.USER} \
--single-transaction --routines --triggers --quick \
--add-drop-database --add-drop-table \
--lock-tables=false > ${out_dir}/${db_name}.sql`;
    return c;
  }

// ========================
  dump_all(out_dir) {
    const pass = this.yp.config().password;

    return this.yp.query("select * from entity where type='hub' or type='community' or type='drumate'", (e, d, f)=> {
      const rows = d.concat([{db_name:"yp"}, {db_name:"mailserver"}]);
      for (let r of rows) {
        const cmd = this.cmd(r.db_name, out_dir);
        console.log(`Dumping ${r.db_name}`);
        const res = Shell.exec(cmd, { silent: true });
        if (res.stderr && !res.stderr.match(/warning/i)) {
          console.error(`ERROR RAISED by ${cmd}: `, res.stderr);
        }
      }
        // break
      return this.yp.end();
    });
  }

// ========================
  dump(out_dir, databases) {
    const pass = this.yp.config().password;
    for (let r of databases) {
      const cmd = this.cmd(r.db_name, out_dir);
      const res = Shell.exec(cmd, { silent: true });
      if (res.stderr && !res.stderr.match(/warning/i)) {
        console.error(`ERROR RAISED by ${cmd}: `, res.stderr);
      }
    }
      // break
    return this.yp.end();
  }
}


module.exports = __backup;

const start = function(){
  const argv = require('minimist')(process.argv.slice(2));
  const out_dir   = argv['out-dir'];
  let databases = argv['databases'];
  if (_.isEmpty(out_dir)) {
    console.log(`Usage : ${process.argv[1]} : --out-dir=/path/to/dir --databases=[all|*]`);
    process.exit(1);
  }
  if (!fs.existsSync(out_dir)) {
    Shell.mkdir('-p', out_dir);
  }
  const i = new __backup();

  if (databases === 'all') {
    return i.dump_all(`${out_dir}`);
  } else { 
    if (_.isEmpty(databases)) {
      console.log(`Usage : ${process.argv[1]} : --databases= must be set`);
    } else { 
      databases = databases.split(/ +/);
    }
    return i.dump(`${out_dir}`, databases);
  }
};
 
start();
