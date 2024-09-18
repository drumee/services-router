

/**
 * Handle LETC Edition. To migrate to MFS
 */
const { Attr, Constants } = require("@drumee/server-essentials");

const Lang = require('../lang');
const {statSync} = require('fs');
const {find, rm, mkdir, cp, ln, ls} = require('shelljs');
const {isEmpty, orderBy} = require('lodash');
const fsUtils = require("nodejs-fs-utils");

class __private_lang extends Lang {

  constructor(...args) {
    super(...args);
    this.remove = this.remove.bind(this);
    this.freeze = this.freeze.bind(this);
    this.add = this.add.bind(this);
    this.restore_lang = this.restore_lang.bind(this);
    this.shell_remove_block_path = this.shell_remove_block_path.bind(this);
    this.shell_copy_block_path = this.shell_copy_block_path.bind(this);
    this.check_lang_exist = this.check_lang_exist.bind(this);
    this.add_lang_to_db = this.add_lang_to_db.bind(this);
    this.change_state = this.change_state.bind(this);
    this.shell_get_file_size = this.shell_get_file_size.bind(this);
    this.add_default_blocks = this.add_default_blocks.bind(this);
    this.write_letc = this.write_letc.bind(this);
    this.copy_default_page = this.copy_default_page.bind(this);
    this.fallback_content = this.fallback_content.bind(this);
    this.get_nearest_lang = this.get_nearest_lang.bind(this);
    this.get_default_content = this.get_default_content.bind(this);
    this.fileExists = this.fileExists.bind(this);
  }

  /**
   * 
   */
  remove() {
    const hub_id = this.hub.get(Attr.id);
    this.get_block_ids_by_lang(hub_id, 0);
  }

  /**
   * 
   * @returns 
   */
  freeze() {
    const hub_id = this.hub.get(Attr.id);
    return this.change_state(hub_id, Constants.FROZEN, this.user_id());
  }

  /**
   * 
   * @returns 
   */
  add() {
    const lang_code = this.input.use("locale") || this.input.use("lang_code") || "fr";
    return this.db.call_proc("language_add_next", lang_code, this.output.data);
  }

  /**
   * 
   * @returns 
   */
  restore_lang() {
    const restore = this.input.use(Attr.restore) || "0";
    const hub_id = this.hub.get(Attr.id);
    if (restore === "1") {
      return this.add_lang_to_db();
    } else if (restore === "2") {
      return this.get_block_ids_by_lang(hub_id, 1);
    } else {
      return this.excetion.user(Constants.INVALID_DATA);
    }
  }


  /**
   * 
   * @param {*} block_id 
   * @param {*} device 
   * @param {*} locale 
   */
  shell_remove_block_path(block_id, device, locale) {
    let dirname = `${this._block_root}/${block_id}/${device}/${locale}`;
    dirname = dirname.replace(/[\/]+/g, '/');
    rm('-rf', dirname);
  }

  /**
   * Copies a path of base block's json file to new language path using shell script.
   * @param {*} destination_path 
   * @param {*} source_file 
   * @param {*} dest_file 
   * @returns 
   */
  shell_copy_block_path(destination_path, source_file, dest_file) {
    mkdir('-p', destination_path);
    cp('-rf', source_file, dest_file);
    return ln('-sf', dest_file, `${destination_path}/current.json`);
  }

  /**
   * Checks a language already added to hub or not.
   * @param {*} check_availability 
   */
  check_lang_exist(check_availability) {
    const locale = this.input.need(Attr.locale);
    const cb = function (data) {
      if ((!isEmpty(data)) && (data.state === Constants.FROZEN)) {
        this.excetion.user(Constants.CONFIRM_RESTORE);
      } else if ((!isEmpty(data)) && ((data.state === Constants.ACTIVE) || (data.state === Constants.REPLACED))) {
        this.excetion.user(Constants.LANG_ALREADY_ACTIVE);
      } else {
        this.find_base_lang(check_availability);
      }
    }.bind(this);
    this.db.call_proc('language_get_by_locale', locale, cb);
  }

  /**
   * 
   * @returns 
   */
  add_lang_to_db() {
    const hub_id = this.hub.get(Attr.id);
    this.debug("add function by ME");
    const hub_root = this._block_root;
    const locale = this.input.need(Attr.locale);
    const cb = function (data) {
      if (!isEmpty(data)) {
        if (!isEmpty(data.locale)) {
          this.output.data(data);
          return;
        }
        if (data.invalid == 1) {
          this.excetion.user(Constants.INVALID_DATA);
          return;
        }
      }
      this.excetion.server(Constants.INTERNAL_ERROR);
    }.bind(this);
    return this.db.call_proc('language_add', this.user_id(), hub_id, hub_root, locale, Constants.ACTIVE, cb);
  }

  /**
   * 
   * @param {*} hub_id 
   * @param {*} state 
   * @param {*} user_id 
   */
  change_state(hub_id, state, user_id) {
    const hub_root = this._block_root;
    const locale = this.input.use(Attr.locale) || this.get(Attr.locale);
    const cb = function (data) {
      if (!isEmpty(data) && (data.updated === "1")) {
        this.output.data(data);
      } else {
        this.excetion.user(Constants.INVALID_DATA);
      }
    }.bind(this);
    this.db.call_proc('language_change_state', user_id, hub_id, hub_root, locale, state, cb);
  }


  /**
   * 
   * @param {*} block_id 
   * @param {*} device 
   * @param {*} locale 
   * @param {*} history_id 
   * @returns 
   */
  shell_get_file_size(block_id, device, locale, history_id) {
    let dirname = `${this._block_root}/${block_id}/${device}/${locale}`;
    dirname = dirname.replace(/[\/]+/g, '/');
    const config = { skipErrors: true, symbolicLinks: true, countFolders: true, countSymbolicLinks: true };
    if (history_id === 0) {
      return parseInt(fsUtils.fsizeSync(dirname, config));
    } else {
      const filename = `${dirname}/${history_id}.json`;
      return parseInt(fsUtils.fsizeSync(filename, config));
    }
  }

  /**
   * Check default page exist, then create a 404 & maintenance page 
   * */    
  add_default_blocks(hashtag, lang) {
    const id = '0';
    lang = this.input.use("locale") || this.input.use("lang_code") || "fr"; //@input.use(Attr.locale) ||  @input.use(Attr.locale) 
    const editor = 'creator';
    const type = 'block';
    const device = this.input.use(Attr.device, Attr.desktop);
    lang = lang;
    const author_id = this.user_id();
    const vesrion = this.input.use(Attr.version, Constants.VERSION.LETC);
    const comment = null;
    const status = 'active';
    return this.db.call_proc(
      "block_save_int_default_page",
      id, hashtag, editor, type, device,
      lang, 1, author_id, vesrion, function (data) {
        this.debug("My Data Page Please >>> =", data);
        this.copy_default_page(data, Attr.mobile);
        return this.copy_default_page(data, Attr.desktop);
      }.bind(this));
  }

  /**
   * 
   * @param {*} data 
   * @param {*} lang 
   * @param {*} hashtag 
   */
  write_letc(data, lang, hashtag) {
    this.copy_default_page(data, Attr.mobile);
    this.copy_default_page(data, Attr.desktop);
  }

  /**
   * 
   * @param {*} data 
   * @param {*} device 
   * @returns 
   */
  copy_default_page(data, device) {
    let dest_dir = `${this._block_root}/${data.id}/${device}/${data.lang}`;
    dest_dir = dest_dir.replace(/[\/]+/g, '/');
    mkdir('-p', dest_dir);
    let src_dir = `${data.src_path}/${device}/${data.lang}`;
    if (!this.fileExists(src_dir)) {
      src_dir = `${data.src_path}/${device}/en`;
    }
    if (!this.fileExists(src_dir)) {
      src_dir = `${data.src_path}/desktop/en`;
    }
    this.debug(`SRC DIR=${src_dir} `);
    if (this.fileExists(src_dir)) {
      const online = `${src_dir}/online.json`;
      const current = `${src_dir}/current.json`;
      const dest_file = `${dest_dir}/${data.active}.json`;
      this.debug(`SRC_FILE=${online} DEST_FILE = ${dest_file}`);
      if (this.fileExists(online)) {
        cp('-f', online, dest_file);
        ln('-sf', dest_file, `${dest_dir}/online.json`);
      }
      if (this.fileExists(current)) {
        cp('-f', current, dest_file);
        return ln('-sf', dest_file, `${dest_dir}/current.json`);
      }
    }
  }

  /**
   * 
   * @param {*} data 
   * @param {*} device 
   * @param {*} hashtag 
   * @returns 
   */
  fallback_content(data, device, hashtag) {
    let d;
    const dir = `${this._block_root}/${data.id}`;
    this.debug(`FILE NOT FOUND for ${hashtag} SCANNING IN LANGUAGES FOR DEVICE=${device}\n`);

    for (d of [Attr.desktop, Attr.mobile]) {
      //skip what's already done
      if (d !== device) {
        const lang = this.get_nearest_lang(d, data.id);
        const filename = `${dir}/${d}/${lang}/current.json`;
        try {
          if (this.fileExists(filename)) {
            return file;
          }
        } catch (error) { }
      }
    }

    let found = null;
    for (d of [Attr.desktop, Attr.mobile]) {
      //skip what's already done
      if (d !== device) {
        found = this.get_default_content(d, data.id);
      }
    }
    return found;
  }

  /**
   * 
   * @param {*} device 
   * @param {*} id 
   * @returns 
   */
  get_nearest_lang(device, id) {
    const pattern = `${this._block_root}/${id}/${device}`;
    if (!this.fileExists(pattern)) {
      return 'en';
    }

    const languages = [];
    ls(pattern).forEach(dir => {
      return languages.push(dir);
    });

    const vis_lang = this.lang();
    const re = new RegExp(vis_lang, 'i');
    let i = 0;
    for (let lang of languages) {
      const re2 = new RegExp(lang, 'i');
      if (lang.match(re) || vis_lang.match(re2)) {
        return languages[i];
      }
      i++;
    }
    return languages[0];
  }


  /**
   * 
   * @param {*} device 
   * @param {*} id 
   * @returns 
   */
  get_default_content(device, id) {
    const pattern = `${this._block_root}/${id}/${device}`;
    if (!this.fileExists(pattern)) {
      return null;
    }
    let files = [];
    let found = null;
    find(pattern).forEach(file => {
      const z = file.match(/(.+\/)([0-9]+)(\.json$)/);
      if (z != null) {
        return files.push({
          serial: z[2],
          path: z[0]
        });
      }
    });
    if (isEmpty(files)) {
      return false;
    }
    try {
      files = orderBy(files, ['serial'], ['asc']);
      found = files.pop().path;
      this.debug("SORTED DEFAULT", found);
    } catch (error) { }
    return found;
  }

  /**
   * 
   * @param {*} filename 
   * @returns 
   */
  fileExists(filename) {
    try {
      statSync(filename);
      return true;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.debug(`CONTENT ACCESS ERROR file=${filename}`, filename, err);
      }
      return false;
    }
  }
}

module.exports = __private_lang;
