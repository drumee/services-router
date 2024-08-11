// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/yp
//   TYPE  : module
// ================================  *
const { RuntimeEnv } = require('@drumee/server-core');
const SUPPORTED_UA = {
  baidu: { name: "Baidu", version: 7.12, link: "https://www.baidu.com/" },
  chrome: { name: "Chrome", version: 80.0, link: "https://www.google.fr/chrome" },
  edg: { name: "Edge Chromium", version: 80.0, link: "https://www.microsoft.com/edge" },
  firefox: { name: "Firefox", version: 76.0, link: "https://www.mozilla.org/fr/firefox" },
  opr: { name: "Opera", version: 68.0, link: "https://www.opera.com/" },
  safari: { name: "Safari", version: 13.1, link: "http://www.apple.com/fr/safari/" },
  yowser: { name: "Yandex Browser", version: 1.23, link: "https://browser.yandex.com" }
};


class __page extends RuntimeEnv {


  /**
   * 
   * @param {*} opt 
   * @returns 
   */
  check_ua(opt) {
    const input = opt.session.input;

    let ua = input.ua();
    if (input.get('browser') || !ua) {
      return false;
    }
    this.silly(`USER AGENT: ${ua}`);
    if (ua.match(/( .+bot| spider)/i)) return true;
    ua = ua.replace(/\(.+\)/, '') || "";
    let compat = ua.split(/ +/).reverse();
    let list = [];
    for (let c of compat) {
      let a = c.split('/');
      list.push({ name: a[0], version: a[1] });
    }
    for (let b of list) {
      let supported = SUPPORTED_UA[b.name.toLowerCase()];
      let major = 0;
      let minor = 0;
      if (b.version) {
        let a = b.version.split('.');
        major = a[0];
        minor = a[1];
      }
      let version = parseFloat(`${major}.${minor}`);
      if (supported) {
        if (version < supported.version) {
          return false;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 
   * @param {*} opt 
   */
  support_edge(opt) {

  }


  /**
   * 
   * @returns 
   */
  async getRuntimeEnv() {
    let a = super.getRuntimeEnv();
    try {
      await this.session.log_service();
    } catch (e) {

    }
    return a;
  }
}

module.exports = __page;
