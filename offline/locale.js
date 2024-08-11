#!/usr/bin/env node

const Cache        = require('../dataset/cache');
const Db           = require('../core/db/mariadb');
let yp = new Db({user:process.env.USER, name:'yp'});
let cache = new Cache({lang:'en', yp});
cache.load().then(()=>{
  cache.write();
  process.exit();
});
