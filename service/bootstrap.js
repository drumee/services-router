const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');
const keyFile = '/etc/drumee/credential/crypto/public.pem';
const { RuntimeEnv } = require('@drumee/server-core');
const { uniqueId, sysEnv, Attr } = require("@drumee/server-essentials");
const TPL_BASE = "page/templates";

class __bootstrap extends RuntimeEnv {

  /**
   * 
   */
  async js() {
    let type = this.input.get(Attr.type) || 'text/javascript';
    let data = await this.getRuntimeEnv();
    data = { ...this.hub.toJSON(), ...data, type };
    let auth = this.input.authorization();
    data.keysel = auth.keysel || Attr.regsid;
    this.set({ data });
    this.output.setAuthorization(auth);
    const { server_location } = sysEnv();
    let template_dir = resolve(server_location, TPL_BASE);
    let content = this.getRender(template_dir, "bootstrap.js.tpl")(data);
    this.output.javascript(content);
  }

  /**
   * 
   */
  async dom() {
    let type = 'text/javascript';
    let data = await this.getRuntimeEnv();
    data = { ...this.hub.toJSON(), ...data, type };
    let auth = this.input.authorization();
    data.host = this.input.host();

    data.keysel = auth.keysel || Attr.regsid;
    this.set({ data });
    this.output.setAuthorization(auth);
    const { server_location } = sysEnv();
    let template_dir = resolve(server_location, TPL_BASE);
    let content = this.getRender(template_dir, "bootstrap.dom.tpl")(data);
    this.output.javascript(content);
  }

  /**
   * 
   */
  async publicKey() {
    if (existsSync(keyFile)) {
      let key = readFileSync(keyFile);
      this.output.text(key);
    } else {
      this.output.text("-----NO PUBLIC KEY-----");
    }
  }

  /**
   * 
   */
  async authn() {
    let token = uniqueId(22);
    let auth = this.input.authorization();
    let otp_key = this.user.get('otp_key');
    let data = { token };
    if (otp_key) data.otp_key = otp_key;
    if (/^(dmz|share)$/.test(this.hub.get(Attr.area))) {
      auth.type = Attr.guest;
    }
    await this.yp.await_proc(`authn_store`, token, auth);
    this.output.data(data);
  }

}

module.exports = __bootstrap;
