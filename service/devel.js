
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/admin
//   TYPE  : module
// ================================  *


/** ===================== */
const { Entity } = require('@drumee/server-core');
const { readFileSync } = require('jsonfile');
const { keys } = require('lodash');
const { existsSync } = require("fs");
const { sysEnv } = require("@drumee/server-essentials");
const { instance } = sysEnv()
const ENDPOINTS = '/etc/drumee/infrastructure/instances.json'
class Devel extends Entity {
  /**
   * 
   */
  instances() {
    let instances = [instance];
    if (existsSync(ENDPOINTS)) {
      instances = readFileSync(ENDPOINTS)
    }
    this.output.list(keys(instances));
  }
}

module.exports = Devel;
