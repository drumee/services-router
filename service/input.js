// ================================  *
//   Copyright Xialia.com  2013-2023 *
//   FILE  : src/service/yp
//   TYPE  : module
// ================================  *


const { Entity } = require('@drumee/server-core');
const DRUMEE_PUB_KEY = '/etc/drumee/publickeys/drumee.com.pem';
const { verifyMessage } = require("@drumee/server-essentials").subtleCrypto;
const { Cache } = require("@drumee/server-essentials");
const { existsSync } = require('fs');

//########################################
class __input extends Entity {


  /**
   * 
   */
  async updateLicence() {
    let { signature, content } = this.input.data();
    //console.log("AAA:27XX", { signature, content }, this.input.data());
    let verified = false;
    if(!existsSync(DRUMEE_PUB_KEY)){
      return this.exception.server("DRUMEE_PUB_KEY_NOT_FOUND");
    }

    try {
      verified = await verifyMessage({ signature, content }, DRUMEE_PUB_KEY);
      if (verified) {
        console.log("AAA:32XX verified", { verified, signature, content});
        await this.yp.await_proc("sys_conf_set", 'licence_content', content);
        console.log("AAA:34XX NEW");
        await this.yp.await_proc("sys_conf_set", 'licence_signature', signature);
        console.log("AAA:36XX NEW");
        await Cache.load(this.yp, 1);
        console.log("AAA:38XX NEW");
        let current = await this.yp.await_func("sys_conf_get", 'licence_content');
        console.log("AAA:40XX NEW", current);

      }
    } catch (e) {
      this.warn("ERR:44", e);
    }
    this.output.data({ verified });
  }

}

module.exports = __input;
