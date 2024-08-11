
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/poll
//   TYPE  : module
// ================================  *

const {Entity}   = require('@drumee/server-core');
const {RedisStore}   = require('@drumee/server-essentials');


//########################################
class __debug extends Entity {


  // ========================
  // version
  // Gets list of languages available from yellow page.
  // ========================
  async test_notify() {
    let recipients = await this.yp.await_proc('user_sockets', this.uid);
    const data        = this.input.use("data");
    await RedisStore.sendData(this.payload(data, { service }), recipients);
    this.output.data(data);
  }
 
}
   
module.exports = __debug;
