#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *
const { sysEnv } = require("@drumee/server-essentials");
const { exit } = require('process');
const APP_CONF_DIR = '/etc/drumee/conf.d';
const { existsSync } = require('fs');
const { version } = require('./package.json');
const {endpoint:endpointRoute, instance} = sysEnv();
global.VERSION = version;
let myDrumee = null;

/**
 * 
 * @param {*} reload 
 * @returns 
 */
function load(reload = 0) {
  const Jsonfile = require('jsonfile');
  const Path = require('path');
  const APP_CONF_FILE = Path.resolve(APP_CONF_DIR, 'drumee.json');
  const JITSI_FILE = Path.resolve(APP_CONF_DIR, 'conference.json');
  const JITSI_VERSIONS = '/etc/jitsi/versions.js';
  if (myDrumee && !reload) {
    return myDrumee;
  }
  let globalConf = {};
  let myConf;
  if (existsSync(APP_CONF_FILE)) {
    globalConf = Jsonfile.readFileSync(APP_CONF_FILE);
  } else {
    console.log(`Could not find default config file ${APP_CONF_FILE}, APP_CONF_DIR=${APP_CONF_DIR}`);
    exit(1);
  }


  let MY_CONF = Path.resolve(APP_CONF_DIR, instance, 'myDrumee.json');
  if (existsSync(MY_CONF)) {
    myConf = Jsonfile.readFileSync(MY_CONF);
  } else {
    MY_CONF = Path.resolve(APP_CONF_DIR, 'myDrumee.json');
    if (existsSync(MY_CONF)) {
      myConf = Jsonfile.readFileSync(MY_CONF);
    }
  }

  myDrumee = { ...globalConf, ...myConf };
  if (existsSync(JITSI_FILE)) {
    myDrumee.conference = require(JITSI_FILE);
  }
  if (existsSync(JITSI_VERSIONS)) {
    myDrumee.conference.versions = require(JITSI_VERSIONS);
  }
  global.debug_dest = null;
  global.myDrumee = myDrumee;
  global.debug = myDrumee.debug || {};
  global.verbosity = myDrumee.verbosity || process.env.verbosity || 2;
  global.myQuota = { ...myDrumee.quota };
  if (global.verbosity > 3) {
    console.log(`***************************************************`);
    console.log(myDrumee);
    console.log(`***************************************************`);
  }
  return myDrumee;

}

/**
 * 
 * @param {*} response 
 * @param {*} msg 
 * @returns 
 */
const error = function (response, msg = 'SERVER FAULT') {
  console.warn(`_____________ ERROR RAISED ${msg} _____________`);
  if (response.headersSent) {
    return;
  }
  const opt = { 'Content-Type': 'text/html' };
  response.statusCode = 'error';
  response.writeHead(500, opt);
  response.write(msg);
  response.end();
}

/**
 * 
 * @returns 
 */
function env() {
  //const Db = require('./core/db/mariadb');
  const Minimist = require('minimist');
  const argv = Minimist(process.argv.slice(2));
  const restPort = argv.restPort;
  const pushPort = argv.pushPort;
  const { Mariadb } = require('@drumee/server-essentials/lib');
  const IP = require('ip');
  const address = IP.address();
  const endpointAddress = `${address}:${pushPort}`;
  const restServer = `${address}:${restPort}`;

  let limit = 1;
  if (process.env.instance_name === 'main') {
    limit = 2;
  }
  const yp = new Mariadb({ limit });
  const r = {
    yp,
    instance: restServer,
    port: restPort,
    location: process.env.location,
    restServer,
    endpointAddress,
    endpointRoute,
    restPort,
    pushPort,
    error,
  }
  global.endpointAddress = endpointAddress;
  global.wsPeer = pushPort;

  return r;
}

/**
 * 
 */
function handleSignals(cb) {
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGHUP', () => {
    console.log("Reloading settings");
    load(1);
    if (cb) {
      cb()
    }
  });
}

module.exports = { load, env, handleSignals };