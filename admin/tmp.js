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
let path     = require('path');
const Backbone = require('backbone');
const mysql    = require('mysql');
const Log      = require('./utils/log');
const _        = require('lodash');

require('./core/addons');

const Session  = require('./core/session');
const route    = require('./router');

const _e       = require('./lex/event');
const _a       = require('./lex/attribute');
const _k       = require('./lex/constants');

const HT_PORT  = process.argv[2] || 8090;
const WS_PORT  = process.argv[3] || 8100;

// ========================================
// WEBSOCKET SERVER
// ========================================
path   = path_map[__dirname];
const socket = require('socket.io')(WS_PORT, {path, transports:['websocket', 'polling']});

let pass   = fs.readFileSync(_k.SECRET);
pass   = String(pass).trim().toString();
const yellow_page = mysql.createConnection({
      host     : _k.DB_HOST,
      database : _k.YELLOW_PAGE,
      user     : _k.DB_USER,
      password : pass
});

// ========================================
// Handler
// ========================================
const handler = function(request, response) {
  console.log("Request received WEBSOCKET 111");//, @
  const session = new Session(request, response, socket, yellow_page);
  session.on(_e.start, function(){
    Log.debug("STARTED service=", session.get(_a.service));
    return route(session);
  });

  return session.on("end", () => Log.debug("ENDED service=", session.get(_a.service)));
};

// ========================================
// MAIN SERVER
// ========================================
const server = http.createServer(handler);
server.listen(HT_PORT);

console.log(`Drumee services running on  http://127.0.0.1:${HT_PORT}/`);
console.log(`Drumee socket running on XXXX http://127.0.0.1:${WS_PORT}/`,  server);

process.on('SIGINT', () => process.exit(0));
