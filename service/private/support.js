// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/support
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");

const Support       = require('../support');

//########################################
class __private_support extends Support {

// ========================
// initialize
// ========================
  constructor(...args) {
    super(...args);
    this.list_feedback = this.list_feedback.bind(this);
  }

  /**
   * 
   * @returns 
   */
  list_feedback() {
    const page   = this.input.use(Attr.page);    
    const column = this.input.use(Attr.sort_by) || Attr.date;
    const order  = this.input.use(Attr.order)   || Attr.desc;
    return this.db.call_proc('support_list_feedback', column, order, page, this.output.data);
  }

}

module.exports = __private_support;
