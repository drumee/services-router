
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/yp
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");

const yp = require('./yp');
const {values}  = require('lodash');

class __locale extends yp {

  /**
   * 
   */
  group_data(data){
    let r = {};
    for (let d of data) {
      if (!r[d.key_code]) {
        r[d.key_code] = {key_code:d.key_code};
      }
      r[d.key_code][d.lng] = d;
    }
    return r;
  }

  /**
   * 
   */
  async list() {
    const page = this.input.use(Attr.page, 1);
    const cat = this.input.get(Attr.category) || 'ui';
    let data = await this.yp.await_proc('intl_list_next', cat, page);
    let r = this.group_data(data);
    this.output.list(values(r));
  }

  /**
   * 
   */
  async keys() {
    const key = this.input.get(Attr.key) || "";
    const cat = this.input.get(Attr.category) || 'ui';
    let data = await this.yp.await_proc('intl_keys_next', key, cat);
    this.output.list(data);
  }

  /**
   * 
   */
  async search() {
    const page = this.input.use(Attr.page, 1);
    const value = this.input.use(Attr.value, "");
    const cat = this.input.use(Attr.category, 'ui');

    let data = await this.yp.await_proc('intl_search_next', value, cat, page);
    let r = this.group_data(data);
    this.output.list(values(r));
  }



  /**
   * 
   */
  async show() {
    const key = this.input.get(Attr.key) || "";
    const type = this.input.get(Attr.type) ||  this.input.get(Attr.category) || 'ui';
    let data = await this.yp.await_proc('intl_get_next', key, type);
    this.output.data(data);
  }

  /**
   * 
   */
  group() {
    const key = this.input.need('name');
    this.yp.call_proc('intl_get_by_group', key, this.output.data);
  }

}


module.exports = __locale;