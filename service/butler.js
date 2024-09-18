// ================================  *
//   Copyright Xialia.com  2013-2023 *
//   FILE  : src/service/yp
//   TYPE  : module
// ================================  **
const {
  Attr, Constants, uniqueId, Messenger, Cache, Remit, sysEnv
} = require("@drumee/server-essentials");

const _ = require("lodash");
const {
  PASS_CHECKER,
  ID_NOBODY,
  FORGOT_PASSWORD,
  INVALID_EMAIL_FORMAT,
} = Constants;
const { dom_owner } = Remit;
const { Mfs, MfsTools } = require("@drumee/server-core");
const { remove_node } = MfsTools;

const Sms = require("../vendor/smsfactor");
const { stringify } = JSON;

class __butler extends Mfs {

  /**
   * 
   */
  async join_contact(secret, user_id, inviter_id) {
    let { db_name } = await this.yp.await_proc('get_entity', user_id);
    let data = await this.yp.await_proc(
      `${db_name}.contact_join`, secret
    );
    if (!_.isEmpty(data)) {
      data = await this.yp.await_proc(
        `${db_name}.contact_notification_by_entity`,
        inviter_id
      );
      data.service = "contact.invite_accept";
      this.notify_user(inviter_id, data);
    }
  }

  /**
   * 
   */
  async send_otp(mobile, uid) {
    const token = this.randomString();
    const lang = this.user.language() || this.input.app_language();
    let otp = await this.yp.await_proc("otp_create", uid, token);
    const message = Cache.message("_otp_update_profile", lang);
    const Moment = require("moment");
    Moment.locale(lang);
    const expiry = Moment(otp.expiry, "X").format("hh:mm");
    let opt = {
      message: `${message.format(otp.code, expiry)}`,
      receivers: [mobile],
    };
    let sms = new Sms(opt);
    let data = await sms.send().then((result) => {
      if (!_.isEmpty(result.invalidReceivers)) {
        return 0;
      }
      return 1;
    });

    if (data == 1) {
      return otp;
    }
    return null;
  }



  /**
   * Check tocken
   * @param {string} secret - token to be cheked
   */
  async check_token() {
    const secret = this.input.need(Attr.secret);
    let data = await this.yp.await_proc("token_get_next", secret);
    let a;
    if (data && _.isString(data.metadata)) {
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
    if (_.isEmpty(user) || user.id === ID_NOBODY) {
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
    // const pathname = this.input.use(Attr.location).pathname.replace(/service.*$/, '');
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
    // const socket_id = this.input.need(Attr.socket_id);
    const pw = this.input.need(Attr.password);
    const id = this.input.need(Attr.id);
    let res = {};
    let metadata = {};
    let pass = {};
    let drumate;

    if (!PASS_CHECKER.test(pw)) {
      return this.output.data({ status: "BAD_PASSWORD" });
    }

    drumate = await this.yp.await_proc("drumate_exists", id);
    if (_.isEmpty(drumate)) {
      return this.output.data({ status: "DRUMATE_NOT_EXISTS" });
    }

    pass = await this.yp.await_proc("token_get_next", secret);

    if (_.isEmpty(pass)) {
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
    if (_.isEmpty(drumate)) {
      return this.output.data({ status: "DRUMATE_NOT_EXISTS" });
    }
    drumate = await this.yp.await_proc("set_password", id, pw);
    let connection = "offline";
    //this.debug("AAA:1586", drumate);
    if ([1, "1", "sms"].includes(drumate.otp)) {
      metadata.step = "otpverify";
      metadata.uid = id;
      metadata.mobile = drumate.mobile;
      metadata.areacode = drumate.areacode;

      let data = await this.send_otp(
        `${metadata.areacode}${metadata.mobile}`,
        metadata.uid
      );
      delete metadata["otp_secret"];
      if (!_.isEmpty(data)) {
        metadata.otp_secret = data.secret;
      }
      await this.yp.await_proc("token_update", secret, metadata);
      res = await this.yp.await_proc("token_get_next", secret);
      connection = "otp";
    } else {
      let profile = {};
      profile.email_verified = "yes";
      profile.connected = "1";
      await this.yp.call_proc("drumate_update_profile", id, stringify(profile));
      //let domain = await this.yp.await_func("domain_name", sid);
      await this.yp.await_proc(
        "session_login_next",
        id,
        pw,
        this.input.sid(),
        drumate.domain
      );
      metadata.step = "complete";
      //await this.log_connection(id)
      await this.yp.await_proc("token_update", secret, metadata);
      res = await this.yp.await_proc("token_get_next", secret);
      await this.yp.await_proc("token_delete", secret);
      connection = "online";
    }
    if (!_.isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {};
        res.metadata.step = metadata.step;
        if (!_.isEmpty(metadata.mobile)) {
          res.metadata.mobile = metadata.mobile.substr(
            metadata.mobile.length - 4
          );
        }
      }
    }
    let user = await this.yp.await_proc("get_user", drumate.id);
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
    let pass = {};

    pass = await this.yp.await_proc("token_get_next", secret);
    if (_.isEmpty(pass)) {
      return this.output.data({ status: "INVALID_SECRET" });
    }
    if (pass.status != "active") {
      return this.output.data({ status: "INVALID_SECRET" });
    }

    if (pass.method != "forgot_password") {
      return this.output.data({ status: "INVALID_METHOD" });
    }

    metadata = this.parseJSON(pass.metadata);
    if (metadata.step != "otpresend" && metadata.step != "otpverify") {
      return this.output.data({ status: "INVALID_STEP" });
    }

    let data = await this.send_otp(
      `${metadata.areacode}${metadata.mobile}`,
      metadata.uid
    );

    delete metadata["otp_secret"];
    if (!_.isEmpty(data)) {
      metadata.otp_secret = data.secret;
    }
    metadata.step = "otpverify";
    await this.yp.await_proc("token_update", secret, metadata);
    res = await this.yp.await_proc("token_get_next", secret);
    if (!_.isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {}; // this.parseJSON(res.metadata)
        res.metadata.step = metadata.step;
        if (!_.isEmpty(metadata.mobile)) {
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
    if (_.isEmpty(pass)) {
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
    if (!_.isEmpty(otp)) {
      metadata.step = "complete";

      profile.email_verified = "yes";
      profile.mobile_verified = "yes";
      profile.connected = "1";
      await this.yp.call_proc(
        "drumate_update_profile",
        metadata.uid,
        stringify(profile)
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
    if (!_.isEmpty(res)) {
      if (res.metadata != null) {
        res.metadata = {}; // this.parseJSON(res.metadata)
        res.metadata.step = metadata.step;
        if (!_.isEmpty(metadata.mobile)) {
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
   */
  async check_domain() {
    let url = this.input.get(Attr.domain) || this.input.host();
    let res = {};
    let domain = url;

    try {
      domain = new URL(url).hostname;
    } catch (err) { }
    res.isvalid = 0;
    domain = domain.replace(/^(.*\/\/)/, "").replace(/\/.*$/, "");
    let org = await this.yp.await_proc("organisation_get", domain);
    if (_.isEmpty(org)) {
      res.url = domain;
      return this.output.data(res);
    }
    res.isvalid = 1;
    let user = await this.yp.await_proc("get_user", this.uid);
    res.user = { ...this.user.toJSON(), ...user };
    res.organization = {
      url: org.link,
      name: org.name,
      domain_id: user.domain_id,
      username: user.username,
      uid: user.id,
      ...org,
    };
    const { main_domain } = sysEnv();
    res.main_domain = main_domain;
    res.user.main_domain = main_domain;
    this.session.refreshAuthorization();
    this.output.data({ ...org, ...res });
  }

  /**
   * Set new password through reset link
   * @param {string} secret - secret sent by email
   * @param {string} id - sdrumate id
   * @param {string} password - new password
   */
  async set_pass_phrase() {
    const secret = this.input.need(Attr.secret);
    const id = this.input.need(Attr.id);
    const pw = this.input.need(Attr.password);
    if (!PASS_CHECKER.test(pw)) {
      this.output.data({
        rejected: 1,
        reason: "bad_pass",
      });
      return;
    }
    let user = await this.yp.await_proc("drumate_get", id);
    if (_.isEmpty(user) || user.id === ID_NOBODY) {
      this.output.data({
        rejected: 1,
        reason: "not_found",
      });
      return;
    }
    let data = await this.yp.await_proc(
      "token_check",
      user.email,
      secret,
      FORGOT_PASSWORD
    );
    if (_.isEmpty(data)) {
      this.output.data({
        rejected: 1,
        reason: "not_found",
      });
      return;
    }
    if (data.age / 3600 > 12) {
      await this.yp.await_proc("token_delete", secret);
      this.output.data({
        rejected: 1,
        reason: "expired",
      });
      return;
    }

    await this.yp.await_proc("set_password", user.id, pw);
    await this.yp.await_proc("token_delete", secret);
    this.output.data(user);
  }

  /**
   * 
   */
  hello() {
    const geoip = require("geoip-lite");
    const ip = this.input.ip();
    //this.debug("HELLO", this.user.get(Attr.domain));
    const data = geoip.lookup(ip) || {};
    data.ip = ip;
    this.output.data(data);
  }

  /**
   * 
   */
  ping() {
    const id = this.user.uid();
    this.yp.call_proc("get_visitor", id, this.output.data);
    this.output.list([
      { mfs_rooo: ["db_name", 2] },
      [{ db_name: "data" }],
      { domain_name: process.env.domain_name },
      ["1/1/1", 2],
      "/data",
    ]);
  }
}

module.exports = __butler;
