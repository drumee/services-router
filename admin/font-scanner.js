// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE : src/drumee/main
//   CLASS :                         *
//   TYPE : application instance
// ================================  *
//

const path_map =
  {'/home/somanos/drumee/server/build' : '/dev/back/somanos/ws'};

const name_spaces = {};

const http     = require('http');
const url      = require('url');

const fs       = require('fs');
//String   = require 'string'
const shell    = require('shelljs');
const path     = require('path');
const Backbone = require('backbone');
const mysql    = require('mysql');
//Log      = require '../utils/log'
const _        = require('lodash');

const querystring = require("querystring");

require('../core/addons');


const _e       = require('@drumee/server-essentials/lex/event');
const _a       = require('@drumee/server-essentials/lex/attribute');
const _k       = require('@drumee/server-essentials/lex/constants');


let pass   = fs.readFileSync(_k.SECRET);
pass   = String(pass).trim().toString();
const yp = mysql.createConnection({
  host     : _k.DB_HOST,
  database : _k.YELLOW_PAGE,
  user     : _k.DB_USER,
  password : pass
});

yp.connect();

const queries=[];

const ls = shell.find("/srv/www/cdn/fonts.drumee.name/fonts/free").forEach(file=> {
  let style, weight;
  const e = file.split('/').reverse();
  const a = e[0].split('.');
  if (a[1] !== 'ttf') {
    return;
  }
  const family= a[0];
  if (family.match(/italic/i)) {
    style='italic';
  } else if (family.match(/obli/i)) {
    style='oblic';
  } else {
    style='normal';
  }

  if (family.match(/bold/i)) {
    weight=800;
  } else if (family.match(/black/i)) {
    weight=900;
  } else {
    weight=400;
  }

  const l1 = family.replace('-', ' ');
  const l2 = family.replace('-', '');
  const d = querystring.escape(e[1]);
  const f = querystring.escape(e[0]);
  const link =  `fonts.drumee.name/fonts/free/${d}/${f}`;
  const sql = `replace into font values(null, '${family}', '${style}', \
${weight}, '${l1}', '${l2}', '${link}', 'truetype', '', 'active', '')`;
  return queries.push(sql);
});

var next = function(err, rows, fields){
  if (err != null) {
    console.log("ERREUR", err);
    return;
  }
  if (queries.length === 0) {
    yp.destroy();
    return;
  }
  const sql = queries.shift();
  console.log(`RUNNING ${sql}...`);
  return yp.query({sql, timeout: 4000}, next);
};


next();