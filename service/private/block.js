
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/block
//   TYPE  : module
// ================================  *

/** ================= DEPRECATED ================== */

//########################################
const Block = require('../block');
class __private_block extends Block {


  // ========================
  // purge
  // purge block
  // ========================
  constructor(...args) {
    super(...args);
    this.purge = this.purge.bind(this);
    this.rename = this.rename.bind(this);
    this.history_old = this.history_old.bind(this);
    this.history = this.history.bind(this);
    this.copy_old = this.copy_old.bind(this);
    this.copy = this.copy.bind(this);
    this.check_hashtag_exist_by_lang = this.check_hashtag_exist_by_lang.bind(this);
    this.write_letc = this.write_letc.bind(this);
    this.walk = this.walk.bind(this);
    this.unpublish = this.unpublish.bind(this);
    this.unpublish_block = this.unpublish_block.bind(this);
    this.shell_remove_online_link = this.shell_remove_online_link.bind(this);
    this.delete = this.delete.bind(this);
    this.remove_block = this.remove_block.bind(this);
    this.shell_remove_block_path = this.shell_remove_block_path.bind(this);
    this.store = this.store.bind(this);
    this.store_menu = this.store_menu.bind(this);
    this.list = this.list.bind(this);
    this.filter = this.filter.bind(this);
    this.log = this.log.bind(this);
    this.add_to_seo = this.add_to_seo.bind(this);
    this.read_content = this.read_content.bind(this);
  }

  purge() {
    const id = this.input.need(_a.id);
    const hashtag = id; // || @input.need(_a.hashtag, id)
    const cb = function (data) {
      const dirname = `${this._block_root}/${data.id}`;
      if (_.isEmpty(data) || _.isEmpty(data.id)) {
        this.debug("HIGH LEVEL ALERT : NO ID !!!!!");
        this.on_error("FAILED");
        return;
      }
      this.debug(` PURGIN DIR =${dirname}`, data);
      if (!this.is_block_root(dirname)) {
        return fsx.remove(dirname)
          .then(() => {
            return this.output.data(data);
          })
          .catch(err => {
            return this.on_error(err);
          });
      }
    }.bind(this);

    return this.db.call_proc('block_purge', hashtag, cb);
  }

  // ========================
  // rename
  // rename block
  // ========================
  rename() {
    const id = this.input.need(_a.id);
    const hashtag = this.input.use(_a.name) || this.input.need(_a.hashtag);
    const cb = function (data) {
      this.debug(` RENAMING  hashtag=${hashtag}`, data);
      if (_.isEmpty(data)) {
        this.excetion.user(_k.INVALID_DATA);
      }
      if (data.hash_exist === "1") {
        return this.excetion.user(_k.BLOCK_NAME_EXIST);
      } else {
        delete data.hash_exist;
        const dir = `${this._block_root}/${data.id}`;
        if (this.is_block_root(dir)) {
          return;
        }
        //@debug "SANITY CHECHED  id=#{id} data.id=#{data.id} dir=#{dir}"
        shell.find(dir).forEach(file => {
          //@debug "CHECKING...", file
          return fs.lstat(file, (err, stats) => {
            if (err) {
              return console.log(err);
            }

            if (stats.isFile()) {
              //@debug "REWRITING  ", file
              const json = jsonfile.readFileSync(file);
              json.meta = json.meta || {};
              json.meta.hashtag = hashtag;
              json.hashtag = hashtag;
              //@debug " REWRITING  =#{hashtag}", file, json
              return jsonfile.writeFileSync(file, json);
            }
          });
        });
        return this.output.data(data);
      }
    }.bind(this);
    return this.db.call_proc('block_rename_new', id, hashtag, cb);
  }

  // ========================
  // history
  // history block
  // ========================
  history_old() {
    const id = this.input.need(_a.id);
    const page = this.input.use('page', 1);
    this.debug(` HISTORY page =${page}`, id);
    return this.db.call_proc('block_get_thread', id, 'D', page, this.output.data);
  }

  // ========================
  // history
  // history block
  // ========================
  history() {
    let year;
    const id = this.input.need(_a.id);
    const page = this.input.use('page', 1);
    const month = this.input.use('month', 0);
    if (month !== 0) {
      year = this.input.need('year');
    } else {
      year = this.input.use('year', 0);
    }
    this.debug(` HISTORY page =${page}`, id);
    const device = this.input.use(_a.device, _a.desktop);
    const lang = this.input.use(_a.lang, this.get(_a.default_lang));
    return this.db.call_proc('block_history_log', id, device, lang, page, month, year, 'D', this.output.data);
  }

  // ========================
  // seek
  // get a snapshot from history
  // ========================
  //  seek: () =>
  //    hashtag = @input.need(_a.hashtag)
  //    serial  = @input.need('serial')
  //    device  = @input.use(_a.device ) || @input.use(_a.screen) || _k.DESKTOP
  //    hashtag = hashtag.split />/
  //    cb = ()=>
  //      data = @get_row(arguments)
  //      @send_content data, hashtag[0], device
  //    @db.call_proc 'block_seek', hashtag[0], serial, @lang(), device, cb

  // ========================
  // copy
  // copy block
  // ========================
  copy_old() {
    const history_id = this.input.need(_a.history_id);
    const author_id = this.user_id();
    const locale = this.input.need(_a.locale);
    const hashtag = this.input.use(_a.hashtag, "");
    const new_page = this.input.use(_a.option) || 0; // 0 - default, 1 - copy as new page, 2 - copy as new revision history
    const cb = function (data) {
      if (!_.isEmpty(data)) {
        if (data.confirm_copy === "1") {
          return this.excetion.user(_k.CONFIRM_COPY_AS_NEW_PAGE);
        } else {
          const src_file = this.content_path(data.src_id, history_id);
          const dest_dir = `${this._block_root}/${data.master_id}/${this.device()}/${locale}`;
          this.debug(` COPYING ${src_file}  ---> ${dest_dir}`);
          if (fs.existsSync(src_file)) {
            const json = jsonfile.readFileSync(src_file);
            json.meta = json.meta || {};
            json.meta.device = data.device;
            json.meta.lang = data.lang;
            json.meta.serial = data.serial;
            json.meta.id = data.master_id;
            json.meta.hashtag = data.meta;
            json.device = data.device;
            json.lang = data.lang;
            json.serial = data.serial;
            json.id = data.master_id;
            json.hashtag = data.meta;
            shell.mkdir('-p', dest_dir);
            jsonfile.writeFileSync(`${dest_dir}/${data.serial}.json`, json);
            shell.ln('-sf', `${data.serial}.json`, `${dest_dir}/current.json`);
          } else {
            this.on_error("Origin not found");
          }
          return this.output.data(data);
        }
      } else {
        return this.excetion.user(_k.INTERNAL_ERROR);
      }
    }.bind(this);
    if ((hashtag !== "") && this.check_hashtag_exist(hashtag)) {
      return this.excetion.user(_k.BLOCK_NAME_EXIST);
    } else {
      return this.db.call_proc('block_copy_new', history_id, author_id, locale, hashtag, new_page, cb);
    }
  }


  copy() {
    const history_id = this.input.need(_a.history_id);
    const author_id = this.user_id();
    const locale = this.input.need(_a.locale);
    const hashtag = this.input.use(_a.hashtag, "");
    const new_page = this.input.use(_a.option) || 0; // 0 - default, 1 - copy as new page, 2 - copy as new revision history
    const cb = function (data) {
      if (!_is.isEmpty(data)) {
        if (data.confirm_copy === "1") {
          return this.excetion.user(_k.CONFIRM_COPY_AS_NEW_PAGE);
        } else {
          const src_file = this.content_path(data.src_id, history_id);
          const dest_dir = `${this._block_root}/${data.master_id}/${this.device()}/${locale}`;
          this.debug(` COPYING ${src_file}  ---> ${dest_dir}`);
          if (fs.existsSync(src_file)) {
            const json = jsonfile.readFileSync(src_file);
            json.meta = json.meta || {};
            json.meta.device = data.device;
            json.meta.lang = data.lang;
            json.meta.serial = data.serial;
            json.meta.id = data.master_id;
            json.meta.hashtag = data.meta;
            json.device = data.device;
            json.lang = data.lang;
            json.serial = data.serial;
            json.id = data.master_id;
            json.hashtag = data.meta;
            shell.mkdir('-p', dest_dir);
            jsonfile.writeFileSync(`${dest_dir}/${data.serial}.json`, json);
            shell.ln('-sf', `${data.serial}.json`, `${dest_dir}/current.json`);
          } else {
            this.on_error("Origin not found");
          }
          return this.output.data(data);
        }
      } else {
        return this.excetion.user(_k.INTERNAL_ERROR);
      }
    }.bind(this);
    return this.db.call_proc("block_get_by_id", hashtag, function (blocks) {
      if ((hashtag !== "") && (blocks.length > 0)) {
        return this.excetion.user(_k.BLOCK_NAME_EXIST);
      } else {
        return this.db.call_proc('block_copy_new', history_id, author_id, locale, hashtag, new_page, cb);
      }
    }.bind(this));
  }


  // ========================
  // check_hashtag_exist
  // Checks whether given hashtag exists already or not.
  // ========================
  // check_hashtag_exist_tobedelete(hashtag) {
  //   const blocks = this.sync_proc_get_rows("block_get_by_id", [hashtag]);
  //   if (blocks.length > 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // ========================
  // check_hashtag_exist_by_lang
  // Checks whether given hashtag exists already in the language or not.
  // ========================
  check_hashtag_exist_by_lang() {
    const hashtag = this.input.use(_a.name) || this.input.need(_a.hashtag);
    const lang_code = this.input.need(_a.lang_code);
    const device = this.device();
    return this.db.call_proc("block_get", hashtag, device, lang_code, function (block) {
      if (!_.isArray(block) && !_.isEmpty(block)) block = [block]
      if (block.length > 0) {
        return this.output.data({ available: 0 });
      } else {
        return this.output.data({ available: 1 });
      }
    }.bind(this));
  }

  // ========================
  //
  // Write letc into file
  // ========================
  write_letc(data, device, lang) {
    this.debug(`HOME_DIR =${this.get(_a.home_dir)}`, data, this.input.use(_a.letc));
    let dirname = `${this._block_root}/${data.id}/${device}/${lang}`;
    dirname = dirname.replace(/[\/]+/g, '/');
    const hashtag = this.input.use(_a.hashtag, data.hashtag);
    const status = this.input.use(_a.status);
    const id = this.input.use(_a.id) || 0;
    this.debug(` CREATING DIR =${dirname}, hash1=${hashtag} LANNNNGGG=${lang}`);
    shell.mkdir('-p', dirname);
    const filename = `${data.active}.json`;
    const letc = this.input.use(_a.letc);
    this.debug("LETCCCCCCCCCCCCCCCCCCCCCCC", letc);
    letc.meta = this.input.use('meta', {});
    letc.meta.device = device;
    letc.meta.lang = lang;
    letc.meta.serial = data.active;
    letc.meta.id = data.id;
    letc.meta.hashtag = data.hashtag;
    letc.device = device;
    letc.lang = lang;
    letc.serial = data.active;
    letc.id = data.id;
    letc.hashtag = data.hashtag;

    //meta =
    //  id : data.id
    //  device : device
    //  lang : lang
    //hashtag : data.hashtag
    //_.merge letc.meta, meta
    // letc = @input.use(_a.letc)
    const content = stringify(letc);
    //@debug  " LETC --->  #{filename}", content
    let cb = err => {
      if (err) {
        this.on_error(err);
        return;
      }
      if ((status === "publish_with_history") || (status === "publish_without_history")) {
        shell.ln('-sf', filename, `${dirname}/online.json`);
        return shell.ln('-sf', filename, `${dirname}/current.json`);
      } else {
        return shell.ln('-sf', filename, `${dirname}/current.json`);
      }
    };
    fs.writeFile(`${dirname}/${filename}`, content, 'utf-8', cb);
    this._text = [];
    this.walk(letc);
    cb = () => {
      return this.output.data(data);
    };
    return this.db.call_proc('block_index', hashtag, lang, this._text.join(' '), cb);
  }

  // ========================
  // walk
  // store block
  // ========================
  walk(d) {
    if (d.content) {
      this._text.push(Striptags(d.content, ['a']));
    }
    if (_.isArray(d.kids) && d.kids.length) {
      return d.kids.map((k) =>
        this.walk(k));
    }
  }

  // ========================
  // unpublish
  // unpublishes a block
  // ========================
  unpublish() {
    const id = this.input.need(_a.id);
    const device = this.input.use(_a.device, _a.desktop);
    const locale = this.input.need(_a.locale);
    this.debug(`UNPUBLISH BLOCK >>> id=${id}, lang=${locale} device=${device}`);
    const cb = function (data) {
      if (!_.isEmpty(data) && data.IS_PUBLISHED === "1") {
        return this.unpublish_block();
      } else {
        return this.excetion.user(_k.NOT_PUBLISHED);
      }
    }.bind(this);
    return this.db.call_proc('block_history_check_published', id, locale, device, cb);
  }

  // ========================
  // unpublish_block
  // unpublishes a block
  // ========================
  unpublish_block() {
    const id = this.input.need(_a.id);
    const device = this.input.use(_a.device, _a.desktop);
    const locale = this.input.need(_a.locale);
    this.debug(`UNPUBLISH BLOCK >>> id=${id}, lang=${locale} device=${device}`);
    const cb = function (data) {
      this.shell_remove_online_link(id, device, locale, data.history_id);
      this.output.data(data);
    }.bind(this);
    return this.db.call_proc('block_unpublish', id, locale, device, cb);
  }

  // ========================
  // Removes online symbolic link to a json using shell script.
  // ========================
  shell_remove_online_link(block_id, device, locale, history_id) {
    let dirname = `${this._block_root}/${block_id}/${device}/${locale}`;
    dirname = dirname.replace(/[\/]+/g, '/');
    const filename = `${history_id}.json`;
    shell.exec(`unlink ${dirname}/online.json`);
    return shell.ln('-sf', filename, `${dirname}/current.json`);
  }

  // ========================
  // delete
  // delete block
  // ========================
  delete() {
    const id = this.input.need(_a.id);
    const device = this.input.use(_a.device, _a.desktop);
    const locale = this.input.need(_a.locale);
    this.debug(`DELETE BLOCK >>> id=${id}, lang=${locale} device=${device}`);
    const cb = function (data) {
      if (data && data.IS_PUBLISHED === "1") {
        return this.excetion.user(_k.UNPUBLISH_TO_DELETE);
      } else {
        return this.remove_block();
      }
    }.bind(this);
    return this.db.call_proc('block_history_check_published', id, locale, device, cb);
  }

  // ========================
  // remove_block
  // Removes a block by id, device and language
  // ========================
  remove_block() {
    const id = this.input.need(_a.id);
    const device = this.input.use(_a.device, _a.desktop);
    const locale = this.input.need(_a.locale);
    const cb = () => {
      this.shell_remove_block_path(id, device, locale);
      return this.output.data({ id, device, lang: locale });
    };
    return this.db.call_proc('block_delete_by_id_lang', id, locale, device, cb);
  }

  // ========================
  // Removes a path of block's json file using shell script.
  // ========================
  shell_remove_block_path(block_id, device, locale) {
    let dirname = `${this._block_root}/${block_id}/${device}/${locale}`;
    dirname = dirname.replace(/[\/]+/g, '/');
    return shell.rm('-rf', dirname);
  }

  // ========================
  // store
  // store block
  // ========================
  store() {
    let serial;
    const id = this.input.use(_a.id) || 0;
    const hashtag = this.input.use(_a.name) || this.input.need(_a.hashtag);
    const editor = this.input.use(_a.editor);
    const type = this.input.use(_a.type);
    const device = this.input.use(_a.device, _a.desktop);
    const lang = this.input.use(_a.lang, this.get(_a.default_lang));
    const author_id = this.user_id();
    const vesrion = this.input.use(_a.version, _k.VERSION.LETC);
    const comment = this.input.use(_a.comment);
    const status = this.input.use(_a.status);
    if (id === 0) {
      this.debug(`######*******IF ID ${id}*******#########`);
      serial = this.input.use(_a.serial) || 0;
    } else {
      this.debug(`######*******ELSE ID ${id}*******#########`);
      serial = this.input.need(_a.serial);
    }
    this.debug(`LETEC >>> id=${id}, lang=${lang} hashtag=${hashtag}, device=${device}`, this.input.use(_a.letc));
    const cb = function (data) {
      if (data && data.hash_exist === "1") {
        return this.excetion.user(_k.BLOCK_NAME_EXIST);
      } else {
        delete data.hash_exist;
        this.output.data(data);
        return this.write_letc(data, device, lang);
      }
    }.bind(this);
    if ((status === "publish_without_history") && (serial > 0)) {
      return this.db.call_proc('block_update_new', id, serial, 1, cb);
    } else if ((status === "draft_without_history") && (serial > 0)) {
      return this.db.call_proc('block_update_new', id, serial, 0, cb);
    } else if (status === "publish_with_history") {
      return this.db.call_proc('block_save_int', id, hashtag, editor, type, device, lang, 1, author_id, vesrion, cb);
    } else {
      return this.db.call_proc('block_save_int', id, hashtag, editor, type, device, lang, 0, author_id, vesrion, cb);
    }
  }

  // ========================
  // content
  // ========================
  store_menu() {
    const id = this.hub('menu') || 0;
    const hashtag = id;
    const editor = this.input.use(_a.editor) || 'creator';
    const type = 'menu';
    const device = this.input.use(_a.device, _a.desktop);
    const lang = this.input.use(_a.lang, this.get(_a.default_lang));
    const author_id = this.user_id();
    const vesrion = this.input.use(_a.version, _k.VERSION.LETC);
    const comment = this.input.use(_a.comment);

    this.debug(`LETEC >>> id=${id}, lang=${lang} hashtag=${hashtag}, device=${device}`, this.input.use(_a.letc));
    const cb = function (data) {
      this.write_letc(data, device, lang);
      this.output.data(data);
    }.bind(this);
    this.db.call_proc('block_save', id, hashtag, editor, type, device, lang, author_id, vesrion, cb);
  }

  // ========================
  // list
  // ========================
  list() {
    this.debug("LISTING BLOCKS");
    const editor = this.input.use(_a.editor, _a.creator);
    const page = this.input.use(_a.page, 1);
    const order = this.input.use(_a.order, 'D');
    this.db.call_proc('block_list', page, editor, order, this.output.data);
  }

  // ========================
  // Gets list of pages in a language.
  // ========================
  list_by() {
    const i = this.input;
    const locale = i.get(_a.locale) || i.language() || i.app_language() || 'fr';
    const published = i.need(_a.published);
    const name = i.get(_a.name) || "";
    const sort_by = i.get(_a.sort_by) || _a.date;
    const sort = i.need(_a.sort);
    const page = i.get(_a.page) || 1;
    return this.db.call_proc('block_get_draft_publish', locale, published, name, sort_by, sort, page, this.output.data);
  }

  // ========================
  //
  // ========================
  filter() {
    const page = this.input.use(_a.page, 1);
    //pattern = @input.need(_a.pattern)
    this.debug("FILTER DDD 111111 BLOCKS", page);
    return this.db.call_proc('yp.plf_list_models', page, this.output.data);
  }
  //    cb = ()=>
  //      data = @get_rows(arguments)
  //      @output.data arguments[1]
  //    @query "SELECT * FROM block WHERE hashtag LIKE '#{pattern}%'", cb
  //    @query "SELECT * FROM block WHERE hashtag LIKE '#{pattern}%'", cb


  // ========================
  // log
  // ========================
  log() {
    this.debug("LISTING BLOCKS");
    const page = this.input.use(_a.page, 1);
    const order = this.input.use(_a.order, 'D');
    return this.db.call_proc('block_log', page, order, this.output.data);
  }

  // ========================
  // addToSeo
  // ========================
  add_to_seo() {
    const id = this.input.use(_a.id);
    const hashtag = this.input.need(_a.hashtag, id);

    this._contents = [];
    var walk = d => {
      if (d.content) {
        this._contents.push({ kind: d.kind, content: d.content });
      }
      if (_.isArray(d.kids) && d.kids.length) {
        return d.kids.map((k) =>
          walk(k));
      }
    };

    const cb = function (data) {
      if (file) {
        walk(this.read_content(data, device, hashtag[0]));
        //for c in @_contents
        //  html = mustache.to_html(template, c)
        //@debug "SEO STRING ", html

        //@db.call_proc 'seo_add', hashtag, html, cb
        return this.output.data(data);
      } else {
        return this.exception.user(`No data has been bound to ${hashtag} `, 404);
      }
    }.bind(this);

    return this.db.call_proc('block_get', hashtag[0], this.lang(), device, cb);
  }


  // ========================
  // read_content
  // ========================
  read_content(data, device, hashtag) {
    if ((data == null)) {
      this.exception.user(`No data has been bound to ${hashtag} `, 404);
      return null;
    }

    const dir = `${this._block_root}/${data.id}`;
    const vis_lang = this.lang();
    this.debug(`VISITOR LANGUAGE --> ${vis_lang}, DEVICE=${device}, hashtag=${hashtag}`, this.device(), dir);

    let file = `${dir}/${device}/${vis_lang}/current.json`;
    if (fs.existsSync(file)) {
      return jsonfile.readFileSync(file);
    }

    const lang = this.get_nearest_lang(device, data.id);
    this.debug(`CONTENT NOT FOUND with ${vis_lang}, TRYING the nearest language ${lang} `);
    file = `${dir}/${device}/${lang}/current.json`;
    if (fs.existsSync(file)) {
      return jsonfile.readFileSync(file);
    }
    return null;
  }
}



module.exports = __private_block;
