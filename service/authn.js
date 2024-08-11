// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/yp
//   TYPE  : module
// ================================  *



const { Entity } = require('@drumee/server-core');
const { uniqueId } = require("@drumee/server-essentials");

//########################################
class __authn extends Entity {

  /**
   * 
   */
  async create() {
    let token = uniqueId(22);
    let auth = this.input.authorization();
    await this.yp.await_proc(`authn_store`, token, auth);
    this.output.data({token});
  }

}

module.exports = __authn;
