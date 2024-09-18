// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/support
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");

const { isObject } = require('lodash');
const { stringify } = JSON;

/** =============================================  */
const { Entity } = require('@drumee/server-core');
class __support extends Entity {


  /**
   * 
   */
  bug_report() {
    const vars = this.input.use(Attr.vars);
    for (let k in vars) {
      const v = vars[k];
      if (isObject(v)) {
        vars[k] = stringify(v);
      }
    }

    return this.db.call_proc('support_bug_report',
      this.uid,
      vars.feature,
      vars.description,
      vars.context,
      vars.location,
      vars.navigator,
      vars.browser,
      vars.frequency,
      vars.category,
      this.output.data);
  }

  /**
   * 
   */
  leave_comment() {
    const msg = this.input.use(Attr.message);
    this.yp.call_proc('feedback_create', msg, this.output.data);
  }
}
module.exports = __support;
