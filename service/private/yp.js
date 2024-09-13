const { Attr, Events } = require("@drumee/server-essentials");
const { DENIED } = Events;

const yp = require("../yp");

class private_yp extends yp {
  /**
   * 
   * @param  {...any} args 
   */
  constructor(...args) {
    super(...args);
    this.special_access = this.special_access.bind(this);
  }

  /**
   * 
   */
  async special_access() {
    let data = await this.yp.await_proc("get_visitor", this.uid);

    if (parseInt(data.remit) < 2) {
      this.warn("Improper remit");
      this.trigger(DENIED);
      return;
    }
    return this._done();
  }

  /**
   * 
   */
  check_password() {
    const pw = this.input.use(Attr.password);
    this.yp.call_proc("check_password_next", this.uid, pw, this.output.data);
  }

  /**
   * Prevent login inside a session
   */
  login() {
    let resent = this.input.use("resent");
    if (resent || !this.user.get("signed_in")) {
      this.session.login(this.input.use("vars"), this.input.use("resent"));
    } else {
      let vars = this.input.need("vars");
      let username = this.user.get(Attr.username);
      let profile = this.user.get(Attr.profile) || {};
      if ([username, profile.email, this.uid].includes(vars.ident)) {
        this.output.data({ status: "ALREADY_SIGNED_IN" });
      } else {
        this.output.data({
          status: "CROSS_SIGNED_IN",
          current: profile.email,
          uid: this.user.get(Attr.id),
          input: vars.ident,
        });
      }
    }
  }
}

module.exports = private_yp;
