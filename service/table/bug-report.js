// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/yp
//   TYPE  : module
// ================================  *

const fs            = require('fs');
const _             = require('lodash');
const shell         = require('shelljs');
const _e            = require('@drumee/server-essentials/lex/event');
const _a            = require('@drumee/server-essentials/lex/attribute');
const _k            = require('@drumee/server-essentials/lex/constants');
//const PROXY         = require('@drumee/server-core/proxy');
const Entity        = require('@drumee/server-core/entity');
const sync_mysql    = require('sync-mysql');
const Fileio        = require('@drumee/server-core/file-io');
const fu            = require('@drumee/server-core/utils');

//########################################
class __support_bug_collector extends Entity {

// ========================
// initialize
// ========================
  constructor(...args) {
    this.special_access = this.special_access.bind(this);
    this.bug_report = this.bug_report.bind(this);
    this.login = this.login.bind(this);
    this.get_external_share = this.get_external_share.bind(this);
    this.notification_count = this.notification_count.bind(this);
    this.notification_list = this.notification_list.bind(this);
    this.get_ident_availablility = this.get_ident_availablility.bind(this);
    this.get_laguages = this.get_laguages.bind(this);
    this.get_lexicon = this.get_lexicon.bind(this);
    this.avatar = this.avatar.bind(this);
    this.verify_email = this.verify_email.bind(this);
    this.check_drumate_exist = this.check_drumate_exist.bind(this);
    this.send_forgot_password_token = this.send_forgot_password_token.bind(this);
    this.validate_forgot_password_token = this.validate_forgot_password_token.bind(this);
    super(...args);
  }

  // initialize(session, permission) {
  //   this.debug(`INIT YP p=${permission}`, permission);
  //   if (typeof opt !== 'undefined' && opt !== null) {
  //     this.before_granting = opt.checker;
  //   }
  //   return super.initialize(session, permission);
  // }


// ========================
// special_access translation table
// ========================
  special_access() {
    //@debug "YP :::: CHECK_SANITY =========== 339399"
    return this.yp.call_proc('get_visitor', this.uid, function(){
      const data = this.get_row(arguments);
      if (parseInt(data.remit) < 2) {
        this.debug("IMPROper remit");
        this.trigger(_e.denied);
        return;
      }
      return this._done();
    }.bind(this));
  }

// ========================
// list translation table
// ========================
  bug_report() {}
    
// ========================
// login
// ========================  
  login() {
    return this.session.login(this.input.use('vars'));
  }

// ========================
// get_external_share
// ========================  
  get_external_share() {  
    const share_id        = this.input.need(_a.share_id); 
    return this.yp.call_proc("get_external_share", share_id, this.output.data); 
  }

// ========================
// Notification count
// ========================  
  notification_count() {
    return this.yp.call_proc('yp_notification_count', this.uid, this.output.data);
  }

// ========================
// Notification List
// ========================   
  notification_list() {
    return this.yp.call_proc('yp_notification_receive_list', this.uid, this.output.data);  
  }

// ========================
// Gets ident availability.
// ========================
  get_ident_availablility() {
    const ident      = this.input.need(_a.ident);
    return this.yp.call_proc('available_ident', ident, this.output.data);
  }

// ========================
// get_laguages
// Gets list of languages available from yellow page.
// ========================
  get_laguages() {
    const name        = this.input.use(_a.name, "");
    const page        = this.input.use(_a.page) || 1;
    return this.yp.call_proc('get_laguages', name, page, this.output.data);
  }


// ========================
// get_lexicon
// ========================
  get_lexicon() {
    let lang = this.session.language();
    if (['en', 'fr', 'ru', 'zh'].includes(!lang)) {
      lang = 'en';
    }
    const filename = `/lexicon/${lang}.json`;
    
    const fname = encodeURIComponent(filename);
    const stat = fs.statSync('/srv/direct/' + filename);
    const opt = {};
    opt["Content-Disposition"] = `attachment; filename=\"${filename}\"; \
filename*=UTF-8''${fname}`;
    opt["Content-Length"]      = stat.size;
    opt[_k.ACCEL_REDIRECT]     = filename;

    this.session.response.writeHead(200, opt);
    this.session.response.end();
    return this.session.trigger(_e.end); 
  }


// ========================
// avatar
//
// ========================
  avatar() {
    const uid = this.input.use(_a.id);
    const send_file = function(){
      const node = this.get_row(arguments);
      const file = new Fileio(this.output);
      if ((node == null) || _.isEmpty(node[_k.SYS_FILE_PATH])) {
        file.static('default_avatar');
        return;
      }
      return file.output(node, _k.VIGNETTE);
    }.bind(this);

    const cb = function(){
      const row = this.get_row(arguments);
      this.debug(`AVATAR:::::::::: uid=${uid}`, row); 
      if ((row == null) || !row.permission || (row.avatar === _k.DEFAULT)) {
        const file = new Fileio(this.output);
        file.static('default_avatar');
        return;
      }
      if (row.db_name) {
        return this.yp.call_proc(`\`${row.db_name}\`.mfs_node_attr`, row.avatar, send_file); 
      } else {
        this.debug("USER DB NO FOUND", row); 
        return this.exception.user(Cache.message('_internal_error'));
      }
    }.bind(this);
    return this.yp.call_proc('drumate_get_avatar', uid, cb);
  }


// ========================
// verify_email
// Verifies email of a drumate.
// ========================
  verify_email() {
    const user_id       = this.input.use(_a.uid) || this.user_id();
    const email_hash    = this.input.need(_a.email);
    const token         = this.input.need(_a.token);
    const cb = function(){
      const data = this.get_row(arguments);
      if ((data != null) && (data.updated === "1")) {
        return this.output.data();
      } else {
        return this.excetion.user(_k.INVALID_DATA);
      }
    }.bind(this);
    return this.yp.call_proc('drumate_verify_email', user_id, email_hash, token, cb);
  }

// ========================
// check_drumate_exist
// Checks whether drumate with given id/email exist or not.
// ========================
  check_drumate_exist() {
    const id       = this.input.need(_a.id);
    return this.yp.call_proc('drumate_exists', id, function(){
      const data = this.get_rows(arguments);
      return this.output.data(data);
    }.bind(this));
  }

// ========================
// send_forgot_password_token
// Send link for forgot password
// ========================
  send_forgot_password_token() {
    const email    = this.input.need(_a.email);
    const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
    if (!regex.test(email)) {
      return this.excetion.user(_k.INVALID_EMAIL_FORMAT);
    } else {
      const cb_drumate_exist =function(){
        const data_drumate_exist = this.get_row(arguments);
        if (data_drumate_exist != null) {
          const cb_validation_code = function(){
            const data_validation_code = this.get_row(arguments);
            const mailer = new Mailer();
            return mailer.send_mail(email, "Drumee: Reset Forgot Password", '<b> <a href="https://www.drumee.com/forgot-password/' + data_validation_code.code + '/' + email+ '">Click here to reset password</a></b>', this.email_handler);
          }.bind(this);
          return this.yp.call_proc('yp_add_validation_code', data_drumate_exist.id , _k.FORGOT_PASSWORD, 10, cb_validation_code);
        } else {
          return this.excetion.user(_k.EMAIL_NOT_FOUND);
        }
      }.bind(this);
      return this.yp.call_proc('drumate_exists', email, cb_drumate_exist);
    }
  }

// ========================
// validate_forgot_password_token
// Validates forgot password link's  hashcode and email.
// ========================
  validate_forgot_password_token() {
    const code     = this.input.need(_a.code);
    const email    = this.input.need(_a.email);
    const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;
    if (!regex.test(email)) {
      return this.excetion.user(_k.INVALID_EMAIL_FORMAT);
    } else {
      const cb =function(){
        const data = this.get_row(arguments);
        if (data != null) {
          return this.yp.call_proc('yp_check_code_validity', data.id,_k.FORGOT_PASSWORD,code,this.output.data);
        } else {
          return this.excetion.user(_k.EMAIL_NOT_FOUND);
        }
      }.bind(this);
      return this.yp.call_proc('drumate_exists', email, cb);
    }
  }
}


module.exports = __support_bug_collector;