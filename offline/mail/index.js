#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist  = require('minimist');
const Jsonfile  = require('jsonfile');
const Path      = require('path');
const {Mariadb, Messenger, Offline} = require('@drumee/server-essentials');

class __send_mail extends Offline {

// ========================
// initialize
// ========================
  async initialize() {
    const argv      = Minimist(process.argv.slice(2));
    this.yp         = new Mariadb({user:process.env.USER});
    let id   = argv._[0];
    const batch = Path.resolve(process.env.DRUMEE_TMP_DIR, '.mail', `${id}.json`);
    const data = Jsonfile.readFileSync(batch);
    this.set(data);

    const msg = new Messenger(data);
    await msg.send();    
  }
  
}

new __send_mail();
//module.exports = __send_mail;
