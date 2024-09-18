
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/room
//   TYPE  : module
// ================================  *
const { Attr } = require("@drumee/server-essentials");
const { PAGE } = require('@drumee/server-essentials/lex/constants');
const { Entity } = require('@drumee/server-core');


//########################################
class __icon extends Entity {

  /**
   * 
   * @returns 
   */
  icon_list() {
    const page = this.input.use(PAGE, 1);
    this.debug(`icon_list page=${page}`);
    return this.db.call_proc('mfs_list_by', 'vector', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  plateform_list() {
    const page = this.input.use(PAGE, 1);
    this.debug(`plateform_list page=${page}`);
    return this.db.call_proc('yp.plf_icons_list', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  icon_search() {
    const value = this.input.use(Attr.value, "a");
    const page = this.input.use(Attr.page, 1);
    this.debug(`icon_search value=${value} page=${page}`);
    return this.db.call_proc('mfs_search', value, 'vector', page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  plateform_search() {
    const page = this.input.use(PAGE, 1);
    const value = this.input.use("string", "a");
    this.debug(`plateform_search page=${page}`);
    return this.db.call_proc('yp.plf_icons_search', value, page, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  icon_get() {
    const id = this.input.use(Attr.id);
    this.debug(`icon_search value=${id} `);
    return this.db.call_proc('mfs_file_stat', id, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  get_classes() {
    this.debug("icon_get_classes");
    return this.db.call_proc('icon_get_classes', this.output.data);
  }

  /**
   * 
   * @returns 
   */
  icon_plateforme() {
    this.debug("icon_get_files");
    return this.db.call_proc('icon_get_files', this.output.data);
  }
}



module.exports = __icon;
