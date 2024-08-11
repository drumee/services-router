#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');
const Shell = require('shelljs');
const Readline = require('readline-sync');
const Jsonfile = require('jsonfile');

const MODULE_BASE = __dirname.replace("offline", "");
const ARGV = require('minimist')(process.argv.slice(2));
const SCHEMAS_PATH = ARGV.schemas || process.env.SCHEMAS_PATH;

const { Mariadb, Offline } = require('@drumee/server-essentials');

class __patch extends Offline {
  // ========================
  // initialize
  // 
  // ========================
  initialize(opt) {
    this.yp = new Mariadb({ verbose: 0, user: process.env.USER, socketPath: '/var/run/mysqld/mysqld.sock', verbose: 0 });
    // QQQ@_pass = @yp.config().password
    this._error = [];
    this._types = ['hub', 'drumate', 'common', 'mailserver', 'utils', 'costums', 'yellow_page', 'licence'];
    this._usage = `Usage : \n \
--source=${this._types.join('|')}/filename[.sql] \n \
--target=[check]|both|drumate|hub|'list of db name'\n`;
  }

  // ========================
  async exec(db_name, e) {
    let user = ARGV.user || process.env.USER;
    let password = ARGV.password || process.env.USER;
    let cmd;
    if (user && password) {
      cmd = `/usr/bin/mysql -u${user} -p${password} --database ${db_name} < ${e.file}`;
    } else if (user) {
      cmd = `/usr/bin/mysql -u${user} --database ${db_name} < ${e.file}`;
    } else {
      cmd = `/usr/bin/mysql --database ${db_name} < ${e.file}`;
    }
    const res = Shell.exec(cmd, { silent: true });
    this._done++;
    let p = (100 * (this._done / this._length));
    let pad = '';
    var progress = [];
    let limit = Math.ceil(p / 10);
    let i = 0;
    while (i < 10) {
      if (i < limit) {
        progress[i] = '\u2588';
      } else {
        progress[i] = '.';
      }
      i++;
    }
    if (ARGV.log) {
      console.log(`Applying ${e.filename} on ${db_name}`);
    } else if (!ARGV.quite) {
      //console.log(`${source} --> ${db_name} \r`);
      if (p < 10) pad = '0';
      process.stdout.write(`[${pad}${p.toFixed(2)}%] ${progress.join('')} ${e.filename} --> ${db_name}\r`);
    }
    //console.log "#{cmd} \r"
    if (res.code !== 0) {
      if (/1049.+42000/.test(res.stderr)) {
        if (ARGV.orphan == 'remove') {
          console.log(`Removing orphaned entity ${db_name}`);
          await this.yp.await_proc(`entity_delete`, db_name);
        } else {
          console.log(`Got orphaned entity ${db_name}`);
        }
      } else {
        console.log("\n-------------------------\n",
          `ERROR on db ${db_name}`, res.stderr,
          "\n-------------------------\n"
        );
        if (ARGV["ignore-error"]) return
        this._abort(`\nFailed to patch ${db_name}. Task aborted.\n`);
      }
    }
  }




  // ========================
  _abort(e) {
    //console.trace();
    if ((e == null)) {
      throw this._usage;
    }
    throw e;
  }

  /**
   * 
   * @returns 
   */
  async choice(args) {
    const msg = `\n [x] This shall apply ${args.file} on ${ARGV.target}`;

    if (ARGV.force) {
      try {
        console.log(` [x] Applying ${args.file} on ${ARGV.target}`);
      } catch (error1) {
        e = error1;
        console.log("ERROR RAISED", e);
      }
      return;
    }

    console.log(msg);
    const res = Readline.question(" [x] Are you sure ? [Y/N]: ");

    if (!(['yes', 'Y', 'y', 'oui', 'O'].includes(res))) {
      console.log("\n..... Patch aborted !\n");
      process.exit(1);
    }
    return;
  }

  // ========================
  async check_sanity() {
    if (!Fs.existsSync(SCHEMAS_PATH)) {
      this._abort(`FAILED TO FIND SCHEMAS FOLDER SCHEMAS_PATH=${SCHEMAS_PATH}`);
    }

    let s = await this.yp.await_query(`SHOW SLAVE STATUS`);
    if (s && s.Slave_IO_Running) {
      this._abort(`MUST NOT BE RUN ON REPLICA SERVER`);
    }

    this._error = [];
    let filename = ARGV.source;
    if (_.isEmpty(filename)) {
      this._abort(this._usage);
    }

    if (!filename.match(/\.sql$/i)) {
      filename = filename + ".sql";
    }

    if (filename.match(/^\//)) {
      if (!Fs.existsSync(filename)) {
        this._abort(`Specified fource file ${filename} was not found`);
      }
    }
    const reg = new RegExp("^" + this._types.join('|') + "/.+$");
    if (!reg.test(filename)) {
      this._abort(`Type ${filename} is not supported`);
    }

    const a = filename.split(/\/+/);
    if (a.length < 2) {
      this._abort();
    }

    const type = a.shift();
    filename = a.join('/');

    const file = Path.resolve(SCHEMAS_PATH, type, filename);
    if (!Fs.existsSync(file)) {
      const dir = Path.dirname(file);
      if (Fs.existsSync(dir)) {
        console.log(`\nFile available from ${dir}:`);
        Fs.readdirSync(dir).forEach(file => console.log(".... ", file));
      }
      this._abort(`Could not resolve source file ${file}`);
    }
    return { file, type, filename };
  }


  // ========================
  async select_schemas(args) {
    let target = ARGV.target || "";
    const source_dir = args.type;
    let rows;
    let error;
    target = target.replace(/\//g, '');
    switch (target) {
      case 'both':
      case 'all':
      case 'common':
        rows = await this.yp.await_query("select db_name from entity where type IN ('drumate', 'hub')");
        error = (source_dir != 'common');
        break;

      case 'hub':
      case 'drumate':
        rows = await this.yp.await_query(`select db_name from entity where type='${target}'`);
        error = (source_dir != target)
        break;

      case 'yp': case 'yellow_page':
        rows = [{ db_name: 'yp' }]
        error = (source_dir != 'yellow_page');
        break;

      case 'utils':
        rows = ['utils']
        error = (source_dir != 'utils');
        break;

      default:
        rows = [];
        if (ARGV.domain) {
          let type = ARGV.type;
          let dom = ARGV.domain;
          switch (type) {
            case 'both':
            case 'all':
            case 'common':
              rows = await this.yp.await_query(`select db_name from entity where type IN ('drumate', 'hub')  AND dom_id='${dom}'`);
              break;
            case 'drumate':
            case 'hub':
              rows = await this.yp.await_query(`select db_name from entity where type='${type}' AND dom_id='${dom}'`);
              break;
          }
          return rows;
        }
        let t = target.split(/[ ,;]+/);
        for (var r of t) {
          rows.push({ db_name: r })
        }
      //console.log("TARGETS == ", rows);
    }

    if (error) {
      this._abort(`\n ERROR RAISED --> : TARGET ${args.file} CAN NOT BE APPLIED ON TAG ${target}`);
    }

    if (_.isEmpty(rows)) {
      this._abort(`Unable de run patch with source=${args.file}, target=${target}`);
    }
    console.log(` [x] Running patch with target=${target}\n`);
    return rows;
  }

  // ========================
  async start() {
    let env = await this.check_sanity();
    //console.log("check_sanity", env);
    await this.choice(env);
    let schemas = await this.select_schemas(env);
    //console.log("SELECTED ROWS", schemas);
    this._done = 0;
    this._length = schemas.length;
    for (let s of schemas) {
      await this.exec(s.db_name, env);
    }
  }

  /**
   * 
   */
  stop() {
    this.yp.end();
  }
}
module.exports = __patch;

// ========================
const p = new __patch();
p.start().then(() => {
  console.log("\nDONE!");
  p.stop();
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
