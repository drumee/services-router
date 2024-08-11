#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Schema = require("./schema");
const { rm, exec } = require("shelljs");
const { existsSync } = require("fs");
const { argv } = require("process");

const { Mariadb, Offline, sysEnv } = require("@drumee/server-essentials");
const { system_user } = sysEnv();
const LOG_CHANGED = {};
class __drumee_factory extends Offline {
  /**
   * 
   */
  initialize() {
    this.yp = new Mariadb();
    this.timer = 5000;
    this.watermark = {
      hub: 210,
      drumate: 210,
    };
    this.info = this.checkSanity().then(async () => {
      if (argv.rebuild === "no" && this.scripts_clean()) {
        console.log("Skip buillding new templates");
      } else {
        await this.make_template("hub");
        await this.make_template("drumate");
      }
      while (1) {
        await this.run();
      }
    });
  }

  /**
   *
   * @param {*} cb
   */
  run(cb) {
    return new Promise(async (resolve, reject) => {
      for (var type of ["drumate", "hub"]) {
        let ok = await this.check_pool(type);
        if (!existsSync(this.script_path(type, "ok"))) {
          this.error("Exit due to doubious template!");
          return;
        }
        if (!ok) {
          this.timer = 15000;
          LOG_CHANGED[type] = true;
          await this.make_schema(type);
        } else {
          if(LOG_CHANGED[type]){
            console.log(`Watermark ${type}=${ok}, timer=${this.timer}`);
          }
          LOG_CHANGED[type] = false;
          if (this.timer < 60000) this.timer = this.timer + 1000;
        }
        setTimeout(resolve, this.timer);
      }
    });
  }

  /**
   *
   */
  async checkSanity() {
    console.log(`STARTING SCHEMAS FACTORY... `);
    let s = await this.yp.await_query(`SHOW SLAVE STATUS`);
    if (s && s.Slave_IO_Running) {
      this.error("Must be run on replica server");
      return;
    }
    const { userInfo } = require('os');
    const { username } = userInfo();
    if (![system_user, "root"].includes(username)) {
      this.error(`Must be run with root privilege or ${system_user}`);
    }
    console.log(`STARTING SCHEMAS FACTORY... USER=${username}`);

    for (var type of ["drumate", "hub"]) {
      console.log(`Cleaning existing template ${this.script_path(type)}`);
      let s = rm("-f", this.script_path(type, "ok"));
      s = rm("-f", this.script_path(type));
      if (s.code !== 0) {
        this.error(s);
      }
    }
  }
  /**
   *
   * @param {*} e
   */
  error(e) {
    console.error(`_________________________________________\n`);
    console.error(e);
    console.error("______________________________________\n");
    process.exit(1);
  }

  /**
   *
   * @param {*} type
   */
  scripts_clean() {
    let a = this.scripts_clean("drumate") && this.scripts_clean("hub");
    let b =
      this.scripts_clean("drumate", "ok") && this.scripts_clean("hub", "ok");
    return a && b;
  }

  /**
   *
   * @param {*} type
   */
  script_path(type, ext = "sql") {
    const { resolve } = require("path");
    return resolve("/tmp/", `drumee-template-${type}.${ext}`);
  }

  /**
   *
   * @param {*} type
   */
  async make_template(type) {
    let script = this.script_path(type);
    let sql = `SELECT db_name, id FROM entity WHERE type='${type}' AND status='active' AND dom_id=1 limit 1`;
    let row = await this.yp.await_query(sql);
    if (!row || row.id == null) {
      this.error(`COULD NOT SELECT TEMPLATE ${type} FROM ENTITY TABLE`);
      return null;
    }

    console.log(`Building ${type} template FROM ${row.db_name} (${row.id})`);
    const opt =
      "--routines --quick --no-data --single-transaction --skip-comments";
    const dump = `/usr/bin/mysqldump -u ${system_user} ${opt} ${row.db_name} > ${script}`;
    console.log(`DUMPING FRESH TEMPLATE : ${dump}`);
    let res = exec(dump, { silent: true });
    if (res == null || res.code !== 0) {
      console.error(`FAILED TO RUN **${dump}**`, res.stderr);
      process.exit(1);
    }
    exec(`touch ${this.script_path(type, "ok")}`, { silent: true });
    return script;
  }

  /**
   *
   * @param {*} type
   */
  make_schema(type) {
    let yp = this.yp;
    return new Promise((resolve, reject) => {
      const s = new Schema({
        folders: [],
        type,
        script: this.script_path(type),
        lang: "en",
        verbose: 0,
        yp,
      });
      let failed = function (e) {
        console.error(e);
        s.delete_entity();
        reject(e);
      };
      let check = function (ok) {
        if (!ok) {
          s.delete_entity();
          reject("Aborted");
          return;
        }
        s.destroy();
        console.log("Completed. Wait 5s before next round.");
        setTimeout(resolve, 5000);
      };
      try {
        s.create_entity().then(check).catch(failed);
      } catch (e) {
        failed(e);
      }
    });
  }

  /**
   *
   * @param {*} type
   */
  async check_pool(type) {
    const { resolve } = require("path");
    let c = await this.yp.await_func("pool_free", type);
    if (c >= this.watermark[type]) {
      resolve(c);
      return c;
    }
    return 0;
  }
}

try {
  new __drumee_factory();
} catch (e) {
  let msg = "Failed to Drumee Factory" + e.toString();
  console.error(msg, e);
  this.syslog(msg);
  process.exit(1);
}
// ==========================================
// _____________________________________

module.exports = __drumee_factory;
