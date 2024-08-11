
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/room
//   TYPE  : module
// ================================  *
const { Attr } = require("@drumee/server-essentials");
const {Entity}   = require('@drumee/server-core');


//########################################
class __font extends Entity {


  /**
   * 
   * @returns 
   */
  font_list() {
    const page      = this.input.use('page', 1);
    this.debug(`font_list page=${page}`);
    return this.db.call_proc('font_list', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  font_search() {
    const value     = this.input.use(Attr.value, "a");
    const page      = this.input.use(Attr.page, 1);
    this.debug(`font_search value=${value} page=${page}`);
    return this.db.call_proc('plf_search_fonts', value, page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  font_get() {
    const id     = this.input.use(Attr.id);
    this.debug(`font_search value=${id} `);
    return this.db.call_proc('font_get', id, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_classes() {
    this.debug("font_get_classes");
    return this.db.call_proc('font_get_classes', this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_files() {
    this.debug("font_get_files");
    return this.db.call_proc('font_get_files', this.output.data);
  }
}



module.exports = __font;
