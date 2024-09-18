
const {
  Attr, Constants, uniqueId, Messenger, Cache, Remit, sysEnv
} = require("@drumee/server-essentials");

const { isEmpty, isString} = require("lodash");
const {
  PASS_CHECKER,
  ID_NOBODY,
  FORGOT_PASSWORD,
  INVALID_EMAIL_FORMAT,
} = Constants;
const { Entity } = require("@drumee/server-core");

class Lobby extends Entity {
  constructor(...args) {
    super(...args);
    this.get_reset_token = this.get_reset_token.bind(this);
    this.set_password = this.set_password.bind(this);
    this.password_otpverify = this.password_otpverify.bind(this);
    this.password_otpresend = this.password_otpresend.bind(this);
  }


  /**
   * Check tocken
   * @param {string} secret - token to be cheked
   */
  async check_token() {
    const secret = this.input.need(Attr.secret);
    let data = await this.yp.await_proc("token_get_next", secret);
    let a;
    if (data && isString(data.metadata)) {
      let md = {};
      try {
        md = this.parseJSON(data.metadata);
      } catch (e) { }
      if (md.mobile && data.method == "forgot_password") {
        let mobile = md.mobile;
        md.mobile = mobile.substr(mobile.length - 4);
      }
      data.metadata = md;
    }

    try {
      a = data.email.split("@");
    } catch (e) {
      this.exception.user("invalid_token");
      return;
    }

    if (data.status != "active") {
      this.exception.user("invalid_token");
      return;
    }

    a = a[0].split(/[\.-_]/);
    const base = a[0] || "a";
    let i = await this.yp.await_proc("unique_ident", base);
    data.ident = i.ident;
    this.output.data(data);
  }

  /**
   * Generate a secret and send by email
   * @param {string} email - email required to send the secret token to
   */
  async get_reset_token() {
    const email = this.input.need(Attr.email).trim();
    if (!email.isEmail()) {
      this.output.data({
        rejected: INVALID_EMAIL_FORMAT,
      });
      return;
    }

    let user = await this.yp.await_proc("get_visitor", email);
    if (isEmpty(user) || user.id === ID_NOBODY) {
      this.output.data({});
      return null;
    }
    const token = this.randomString();
    await this.yp.await_proc(
      "token_generate_next",
      email,
      email,
      token,
      FORGOT_PASSWORD,
      user.id
    );

    if (token == null) {
      this.exception("Failed to create link");
      return;
    }
    const ulang = this.input.ua_language();
    const link = `${this.input.homepath()}#/welcome/reset/${user.id}/${token}`;
    const subject = Cache.message("_password_reset_link", ulang);

    const msg = new Messenger({
      template: "butler/password-forgot",
      subject,
      recipient: email,
      lex: Cache.lex(ulang),
      data: {
        icon: this.hub.get(Attr.icon),
        recipient: user.fullname,
        link,
        home: process.env.domain_name,
      },
      handler: this.exception.email,
    });
    await msg.send();
    this.output.data({ email });
  }

  /**
   *
   * @returns
   */
  async set_password() {
    const secret = this.input.need(Attr.secret);
    const pw = this.input.need(Attr.password);
    const id = this.input.need(Attr.id);
    let res = {};
    let metadata = {};
    let drumate;

    if (!PASS_CHECKER.test(pw)) {
      return this.output.data({ status: "BAD_PASSWORD" });
    }

    drumate = await this.yp.await_proc("drumate_exists", id);
    if (isEmpty(drumate)) {
      return this.output.data({ status: "DRUMATE_NOT_EXISTS" });
    }

    let pass = await this.yp.await_proc("token_get_next", secret);

    if (isEmpty(pass)) {
      return this.output.data({ status: "INVALID_SECRET" });
    }
    if (pass.status != "active") {
      return this.output.data({ status: "INVALID_SECRET" });
    }
    if (pass.method != "forgot_password") {
      return this.output.data({ status: "INVALID_METHOD" });
    }

    metadata = this.parseJSON(pass.metadata);
    if (metadata.step != "password") {
      return this.output.data({ status: "INVALID_STEP" });
    }

    drumate = await this.yp.await_proc("drumate_exists", pass.email);
    if (isEmpty(drumate)) {
      return this.output.data({ status: "DRUMATE_NOT_EXISTS" });
    }
    drumate = await this.yp.await_proc("set_password", id, pw);
    let user = await this.yp.await_proc("get_user", id);

    let { profile } = user;
    let connection = "offline";
    if (/^(sms|email|passkey|1)$/.test(profile.otp)) {
      let data = await this.session.send_otp(user);
      metadata.step = "otpverify";
      metadata.uid = id;
      metadata.mobile = drumate.mobile;
      metadata.areacode = drumate.areacode;

      delete metadata["otp_secret"];
      if (!isEmpty(data)) {
        metadata.otp_secret = data.secret;
      }
      connection = "otp";
    } else {
      profile.email_verified = "yes";
      profile.connected = "1";
      await this.yp.call_proc("drumate_update_profile",
        id, profile
      );
      await this.yp.await_proc(
        "session_login_next",
        id,
        pw,
        this.input.sid(),
        drumate.domain
      );
      metadata.step = "complete";
      //await this.log_connection(id)
      await this.yp.await_proc("token_delete", secret);
      connection = "online";
    }
    await this.yp.await_proc("token_update", secret, metadata);
    res = await this.yp.await_proc("token_get_next", secret);
    if (!isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {};
        res.metadata.step = metadata.step;
        if (!isEmpty(metadata.mobile)) {
          res.metadata.mobile = metadata.mobile.substr(
            metadata.mobile.length - 4
          );
        }
      }
    }
    this.output.data({ ...user, ...res, connection });
  }

  /**
   *
   */
  async password_otpresend() {
    const secret = this.input.need(Attr.secret);
    // let mobile = this.input.use(Attr.mobile)
    let res = {};
    let metadata = {};

    let pass = await this.yp.await_proc("token_get_next", secret);

    if (isEmpty(pass) || pass.status != "active") {
      return this.output.data({ status: "INVALID_SECRET" });
    }

    if (pass.method != "forgot_password") {
      return this.output.data({ status: "INVALID_METHOD" });
    }

    metadata = this.parseJSON(pass.metadata);
    if (metadata.step != "otpresend" && metadata.step != "otpverify") {
      return this.output.data({ status: "INVALID_STEP" });
    }

    let user = await this.yp.await_proc("get_user", pass.email);
    if(isEmpty(user)){
      return this.output.data({ status: "INVALID_SECRET" });
    }

    let data = await this.session.send_otp(user);
    delete metadata["otp_secret"];
    if (!isEmpty(data)) {
      metadata.otp_secret = data.secret;
    }
    metadata.step = "otpverify";
    await this.yp.await_proc("token_update", secret, metadata);
    res = await this.yp.await_proc("token_get_next", secret);
    if (!isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {}; // this.parseJSON(res.metadata)
        res.metadata.step = metadata.step;
        if (!isEmpty(metadata.mobile)) {
          res.metadata.mobile = metadata.mobile.substr(
            metadata.mobile.length - 4
          );
        }
      }
    }
    this.output.data(res);
  }

  /**
   *
   * @returns
   */
  async password_otpverify() {
    let secret = this.input.use(Attr.secret);
    let code = this.input.use(Attr.code);
    let res = {};
    let profile = {};
    let metadata = {};
    let pass = {};

    pass = await this.yp.await_proc("token_get_next", secret);
    if (isEmpty(pass)) {
      return this.output.data({ status: "INVALID_SECRET" });
    }
    if (pass.status != "active") {
      return this.output.data({ status: "INVALID_SECRET" });
    }

    if (pass.method != "forgot_password") {
      return this.output.data({ status: "INVALID_METHOD" });
    }

    metadata = this.parseJSON(pass.metadata);
    if (metadata.step != "otpverify") {
      return this.output.data({ status: "INVALID_STEP" });
    }
    let otp = await this.yp.await_proc(
      "otp_check",
      metadata.uid,
      metadata.otp_secret,
      code
    );
    if (!isEmpty(otp)) {
      metadata.step = "complete";

      profile.email_verified = "yes";
      profile.mobile_verified = "yes";
      profile.connected = "1";
      await this.yp.call_proc(
        "drumate_update_profile",
        metadata.uid,
        profile
      );

      await this.yp.await_proc("token_update", secret, metadata);
      res = await this.yp.await_proc("token_get_next", secret);
      await this.yp.await_proc(
        "session_login_otp",
        metadata.uid,
        code,
        metadata.otp_secret,
        this.input.sid()
      );
      //await this.log_connection(metadata.uid)
      await this.yp.await_proc("token_delete", secret);
      await this.yp.await_proc(
        "otp_delete",
        metadata.uid,
        metadata.otp_secret,
        code
      );
    } else {
      metadata.step = "otpresend";
      await this.yp.await_proc("token_update", secret, metadata);
      res = await this.yp.await_proc("token_get_next", secret);
    }
    if (!isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {}; // this.parseJSON(res.metadata)
        res.metadata.step = metadata.step;
        if (!isEmpty(metadata.mobile)) {
          res.metadata.mobile = metadata.mobile.substr(
            metadata.mobile.length - 4
          );
        }
      }
    }
    this.output.data(res);
  }

}

module.exports = Lobby;
