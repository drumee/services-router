
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/poll
//   TYPE  : module
// ================================  *

/**  
 * Experimental
 * Planned to hande poll form
*/
const { Attr } = require("@drumee/server-essentials");
const Poll      = require('../poll');

//########################################
class __private_poll extends Poll {

  /**
   * 
   * @param {*} error 
   * @param {*} info 
   */
  init(error, info) {
    const {
      ident
    } = this.get(Attr.visitor);
    const name          = this.get(Attr.visitor).fullname;
    const referrer      = this.input.use(Attr.id);
    const ip            = this.input.use(Attr.id);
    this.db.call_proc('poll_create', ident, name, referrer, ip, this.output.data);
  }
      
  /**
   * 
   * @returns 
   */
  create() {
    const {
      id
    } = this.get(Attr.visitor);
    const {
      ident
    } = this.get(Attr.visitor);
    const name          = this.get(Attr.visitor).fullname;
    const referrer      = this.input.use(Attr.id);
    const ip            = this.input.use(Attr.id);
    return this.db.call_proc('poll_init', id, ident, name, referrer, ip, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_list() {
    const {
      id
    } = this.get(Attr.visitor);
    return this.db.call_proc('poll_get', id, this.output.data);
  }
}

module.exports = __private_poll;
