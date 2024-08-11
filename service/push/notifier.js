
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/socket
//   TYPE  : module
// ================================  *

const Socket   = require('./index');

//########################################
class __push_notifier extends Socket {


// ========================
//
// ========================
  constructor(...args) {
    super(...args);
    this.get_count = this.get_count.bind(this);
    this.notify = this.notify.bind(this);
  }

  get_count(data, service) {
    this.yp.call_proc('yp_notification_count', this.user.uid(), function(rows){
      this.echo(rows[0]);
    }.bind(this)); 
  }

// ========================
//
// ========================
  notify(recipient, data) {
    this.sendTo(recipient, data);
  }
}

module.exports = __push_notifier;

