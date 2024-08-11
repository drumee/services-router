
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/block
//   TYPE  : module
// ================================  *


const { Attr } = require("@drumee/server-essentials");
/** =========================== */
const Style    = require('../style');
class __private_style extends Style {


  /**
   * 
   */
  create() {
    const name        = this.input.need(Attr.name);
    const selector    = this.input.use(Attr.selector, "");
    const style       = this.input.need(Attr.style);
    const comment     = this.input.use(Attr.comment);
    //@debug "style_create ", name, selector, style, comment
    this.db.call_proc('style_create', name, selector, style, comment, this.output.data);
  }

  /**
   * 
   */
  remove() {
    const id        = this.input.need(Attr.id);
    this.db.call_proc('style_remove', id, this.output.data);
  }

  /**
   * 
   */
  rename() {
    const id     = this.input.need(Attr.id);
    const name   = this.input.need(Attr.name);
    this.db.call_proc('style_rename', id, name, this.output.data);
  }


  /**
   * 
   */
  save() {
    const id      = this.input.need(Attr.id);
    const style   = this.input.need(Attr.style);
    this.db.call_proc('style_save', id, style, this.output.data);
  }
}


module.exports = __private_style;
