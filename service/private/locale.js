
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/yp
//   TYPE  : module
// ================================  *

const { Attr, Events, sysEnv, toArray } = require("@drumee/server-essentials");

const { DENIED } = Events;
const { writeFileSync } = require('jsonfile');
const { resolve, dirname } = require('path');
const { existsSync, mkdirSync, readdirSync } = require('fs');
const { static_dir, ui_base } = sysEnv();

const APP_TYPES = ['ui', 'server', 'transfer', 'electron-web', 'electron-main', 'liceman', 'sandbox'];

/** =================================  */
const Locale = require('../locale');
class __private_yp extends Locale {


  // ========================
  // special_access translation table
  // ========================
  special_access() {
    this.yp.call_proc('get_visitor', this.uid, function (data) {
      if (parseInt(data.remit) < 2) {
        this.debug("IMPROper remit");
        this.trigger(DENIED);
        return;
      }
      this._done();
    }.bind(this));
  }

  /**
   * 
   */
  async isUsed(word) {
    let dir = resolve(ui_base, 'app');
    const { exec } = require('shelljs');
    const files = readdirSync(dir);
    for (const file of files) {
      let path = resolve(dir, file);
      if (/\.js$/.test(file)) {
        const count = exec(`grep -wc '${word}' ${path}`, { silent: true }).stdout;
        if (count > 0) return true;
      }
    }
    return false;
  }


  /**
   * 
   * @param {*} locale 
   * @param {*} file_format 
   * @returns 
   */
  write(locale, file_format) {
    let file;
    const easyReading = { spaces: 2, EOL: '\n' };
    let base = resolve(static_dir, 'locale');
    let r = {};
    for (var name of APP_TYPES) {
      let outdir = resolve(base, name);
      if (!existsSync(outdir)) {
        mkdirSync(outdir, { recursive: true });
      }

      for (let l of this.supportedLanguage()) {
        file = resolve(outdir, `${l}.json`);
        r[name] = dirname(file);
        this.notice(`Writing ${name} locale into file ${file}`);
        writeFileSync(file, locale[name][l], easyReading);
      }
    }

    let dataset_dir = resolve(static_dir, 'dataset');
    if (!existsSync(dataset_dir)) {
      mkdirSync(dataset_dir, { recursive: true });
    }

    file = resolve(dataset_dir, `files-formats.json`);
    this.notice(`Writing file_format file ${file}`);
    r.mimetype = file;
    writeFileSync(file, file_format, easyReading);
    return r;
  }

  /* -------------------------------------------------
   * to load locale languages into json file
   * @params {string} output file
   * @params {string} language
   * @params {string} category (frontend, backend, error, system)
   * @refer to data from yp.intl
   * ------------------------------------------------- */
  async build() {
    let data;
    let locale = {};
    for (var name of APP_TYPES) {
      locale[name] = {};
      for (let l of this.supportedLanguage()) {
        locale[name][l] = {};
        data = await this.yp.await_proc('get_locale_next', l, name);
        data = toArray(data);
        if (!data || !data.length) continue;
        for (let d of data) {
          locale[name][l][d.key_code] = d.des;
        }
      }
    }
    data = await this.yp.await_proc('get_file_format');
    let file_format = {};
    for (let d of data) {
      file_format[d.key] = d;
    }
    data = this.write(locale, file_format);
    this.output.data(data);
  }

  /**
   * 
   */
  async update() {
    const id = this.input.get(Attr.id);
    let value = this.input.need(Attr.value);
    let data;
    if (id) {
      data = await this.yp.await_proc('intl_update_by_id_next', id, value);
    } else {
      let category = this.input.need(Attr.category);
      let lang = this.input.need(Attr.lang);
      let code = this.input.need(Attr.code);
      data = await this.yp.await_proc('intl_add_next', code, category, lang, value);
      data = await this.yp.await_proc('intl_update_by_id_next', data.id, value);
    }
    let r = {};
    if (data && data.length) {
      for (var p of ['previous', 'current', 'next']) {
        r[p] = data.filter((e) => {
          return e.position == p;
        })[0];
      }
    }

    this.output.data(r);
  }

  /**
   * 
   */
  async add() {
    let values = this.input.need(Attr.values);
    let category = this.input.need(Attr.category);
    let key = values.key_code;
    key = key.replace(/[ \-\.,;:\/=\?+\\]+/, '_');
    if (category == 'server') {
      key = key.toLowerCase();
      if (!/^\_/.test(key)) {
        key = `_${key}`;
      }
    } else {
      if (!this.supportedLanguage().includes(key)) {
        key = key.toUpperCase();
      }
    }
    if (key) {
      for (var k of this.supportedLanguage()) {
        await this.yp.await_proc('intl_add_next',
          key, category, k, values[k]
        );
      }
    }
    values = await this.yp.await_proc('intl_get_next', key, category);
    this.output.list(values);
  }

  /**
   * 
   */
  async delete() {
    let key = this.input.need(Attr.key);
    let type = this.input.get(Attr.type) || 'ui';
    await this.yp.await_proc('intl_delete_next', key, type);
    this.output.data({ key_code: key });
  }

}


module.exports = __private_yp;
