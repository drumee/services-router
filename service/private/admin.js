// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/admin
//   TYPE  : module
// ================================  *

const { DENIED, GRANTED } = require("@drumee/server-essentials/lex/event");
const { Attr } = require("@drumee/server-essentials");

/** =========================================  */
const { Entity } = require("@drumee/server-core");
class __admin extends Entity {
  // ========================
  // initialize
  // ========================
  constructor(...args) {
    super(...args);
    this.initialize = this.initialize.bind(this);
    this._check_permission = this._check_permission.bind(this);
    this.ping = this.ping.bind(this);
    this.yp_test = this.yp_test.bind(this);
    this.show_watermark = this.show_watermark.bind(this);
  }


  _check_permission() {
    if (!this.user.get(Attr.remit) & this._required_remit) {
      this.debug(
        "::::::::::::_check_permission",
        this.user.get("remit"),
        this._remit,
        Attr.remit
      );
      return this.trigger(DENIED, {
        message: "BSSBSBSBmessage",
        remit: this.remi,
      });
    } else {
      return this.trigger(GRANTED);
    }
  }

  // ========================
  //
  //
  // ========================
  ping() {
    this.debug("ping", this.attributes);
    return this.output.data(require("../skeleton/dummy")("PING"));
  }

  // ========================
  // Updates ident of the entity.
  // ========================
  async show_watermark() {
    let sql = function (a) {
      let r = `select ctime from entity WHERE area='pool' and type='${a}' \
      order by ctime desc limit 1`;
      return r;
    };
    let data = { ctime: {} };
    data.hub = await this.yp.await_proc("watermark", "hub");
    data.drumate = await this.yp.await_proc("watermark", "drumate");
    let r = await this.yp.await_query(sql("drumate"));
    data.ctime.drumate = r.ctime;
    r = await this.yp.await_query(sql("hub"));
    data.ctime.hub = r.ctime;
    this.output.data(data);
  }

  // ========================
  //
  // ========================
  async yp_test() {
    const name = this.input.use(Attr.name);
    const values = this.input.use("values");
    this.debug("AAA:79", name, values);
    let data = await this.yp.await_proc(name, ...values);
    this.output.data(data);
  }
}

module.exports = __admin;
