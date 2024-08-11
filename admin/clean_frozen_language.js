
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/admin/clean_frozen_lang
//   TYPE : application instance
// ================================  *

const _         = require('lodash');
const fs        = require('fs');
//String    = require 'string'
const Striptags = require('striptags');
const _e        = require('@drumee/server-essentials/lex/event');
const _a        = require('@drumee/server-essentials/lex/attribute');
const _k        = require('@drumee/server-essentials/lex/constants');
const shell     = require('shelljs');
const sync_mysql      = require('sync-mysql');
const __private_lang  = require('../service/private/lang');

//########################################
class clean_frozen_language extends __private_lang {
// ========================
  constructor(...args) {
    this.clean_expired = this.clean_expired.bind(this);
    super(...args);
  }

  initialize(opt) {
    this.set(_a.hub_id, opt.hub_id);
    this.set(_a.db_name, opt.dbase_name);
    this.set(_a.locale, opt.locale);
    this.set(_a.host, opt.host);
    this.set(_a.user_id, opt.user_id);
    this.set(_a.home_dir, opt.hub_root);
    return super.initialize(opt.session, opt.permission);    
  }

// ========================
// clean_expired
// Cleans frozen expired languages.
// ========================
  clean_expired() {
    return this.remove();
  }
}

module.exports = clean_frozen_language;