#!/usr/bin/env node

const { exit, env } = process;

if (!env.DRUMEE_STATIC_DIR) {
  console.log("DRUMEE env variables are not set. Please source /etc/drumee/drumee.sh");
  exit(1);
}

const { Mariadb } = require('@drumee/server-essentials');
const yp = new Mariadb({ user: env.USER, verbose: 0 });
const Minimist = require('minimist');
const Path = require('path');
const argv = Minimist(process.argv.slice(2));
const Fs = require('fs');
const Jsonfile = require('jsonfile');
const { removeDrumate } = require('./account');
const APP_CONF_DIR = env.APP_CONF_DIR || '/etc/drumee/conf.d';
let myConfPath = Path.resolve(APP_CONF_DIR, 'myDrumee.json');
if (Fs.existsSync(myConfPath)) {
  global.myDrumee = Jsonfile.readFileSync(myConfPath);
}

function usage(a) {
  const prog_name = Path.basename(process.argv[1]);
  if (a) {
    console.log(`Usage ${prog_name} :  ${a}`);
  } else {
    console.log(`Usage ${prog_name} \
    --user=[id|ident|email]\n
    --test=[1|0]`
    );
  }
  exit(1);
}

function done() {
  console.log('Done sucessfully', argv.test);
  yp.end();
  exit(0);
}

function failed(e) {
  console.error('Error occured : ', e);
  yp.end();
  exit(1);
}

function check_sanity(cb) {
  argv.user || usage();
  (env.USER == 'root') || usage('Must be run by root');
}

check_sanity();
removeDrumate({ ...argv, yp }).then(done).catch(failed);

