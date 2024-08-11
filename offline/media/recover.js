#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
const { exit } = require('process');
const Jsonfile = require('jsonfile');
const Path = require('path');
const Shell = require('shelljs');
const Fs = require("fs");
const {Mariadb, Offline} = require('@drumee/server-essentials');

class __media_recover extends Offline {



  // ========================
  // initialize
  // ========================
  initialize() {
    const argv = Minimist(process.argv.slice(2));
    this.db = new Mariadb({ user: process.env.USER, name: "d_a82214baa82214c6" });


    this.prepare()
      .then(() => { exit(0) })
      .catch((e) => {
        console.error('eee', e);
        exit(0);
      });
  }

  /**
   * 
   * @param {*} msg 
   */
  stop(msg) {
    exit(0);
  }

  /**
   * 
   * @param {*} msg 
   */

  /* 
  */
  async prepare() {

    const data = Jsonfile.readFileSync('/tmp/regis.json');
    for (var nid of data) {
      //console.log(`PATHS  =${r.file_path}`)
      console.log(`PROCESSING NID=${nid}`);
      let r = await this.db.await_proc('mfs_node_attr', nid);
      if (r.home_dir && r.filetype == 'document') {
        let src = Path.resolve(r.home_dir, nid, 'orig.' + r.ext);
        let p = Path.join('/srv/drumee/runtime/tmp/regis', r.parent_path.replace(/(__trash__)|([ ]+)|(__chat__)/, ''));
        if (!Fs.existsSync(p)) {
          Shell.mkdir('-p', p);
        }
        let f = Path.join(p, `${r.filename}.${r.extension}`);
        console.log("Copying", src, '-->', f);
        Shell.cp(src, f);
      }
    }

  }


}

new __media_recover();
