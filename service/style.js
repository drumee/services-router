
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/room
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");

/** ===========================================  */
const {Entity}   = require('@drumee/server-core');
class __style extends Entity {

  /**
   * 
   * @returns 
   */
  style_list() {
    const page      = this.input.use('page', 1);
    this.debug(`style_list page=${page}`);
    return this.db.call_proc('style_list', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  style_search() {
    const value     = this.input.use(Attr.value, "%");
    const page      = this.input.use(Attr.page, 1);
    this.debug(`style_search value=${value} page=${page}`);
    return this.db.call_proc('style_search', value, page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  style_get() {
    const id     = this.input.use(Attr.id);
    this.debug(`style_search value=${id} `);
    return this.db.call_proc('style_get', id, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  style_sheets() {
    const page      = this.input.use(Attr.page, 1);
    this.debug(`style_sheets value=${page} `);
    return this.db.call_proc('style_sheets', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_classes() {
    this.debug("style_get_classes");
    return this.db.call_proc('style_get_classes', this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_files() {
    this.debug("style_get_files");
    return this.db.call_proc('style_get_files', this.output.data);
  }
}



module.exports = __style;
