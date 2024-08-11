
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/room
//   TYPE  : module
// ================================  *


/** NOT USED */
const {Entity} = require('@drumee/server-core');


//########################################
class __page extends Entity {




  fileExists(filename) {
    try {
      fs.statSync(filename);
      return true;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.debug(`CONTENT ACCESS ERROR file=${filename}`, filename, err);
      }
      return false;
    }
  }



  is_block_root(dir) {
    return this._block_root === dir.replace(/\/*$/, '');
  }


  remove_item(id, callback) {
    if ((id == null)) {
      this.warn("id required");
      return;
    }
    const path = `${this._block_root}/${id}`;
    if (!this.fileExists(path)) {
      this.warn(`${path} not found`);
      return;
    }

    const cb = () => {
      if (!this.is_block_root(path)) {
        return fsx.remove(path, callback);
      }
    };

    return this.db.call_proc('block_remove_item', id, cb);
  }



  search() {
    let string = this.input.use(_a.string, "*");
    string = string.replace(/-/g, ' ');
    const page = this.input.use(_a.page, 1);
    const found = function () {
      const data = this.get_rows(arguments);
      return this.output.data(data);
    }.bind(this);
    return this.db.call_proc('block_search', string, page, found);
  }


  check() {
    const value = this.input.use(_a.value, "*");
    const string = this.input.use(_a.string, value);

    this.debug(`check  STRING... =${string}`, _a.value);
    const found = function () {
      const data = this.get_rows(arguments);
      //@debug "search found", data
      return this.output.data(data);
    }.bind(this);
    return this.db.call_proc('block_exists', string, found);
  }


  content() {
    let hashtag = this.input.use(_a.id);
    const status = this.input.use(_a.status, "");
    if (_.isEmpty(hashtag)) {
      hashtag = this.input.need(_a.hashtag);
    }
    const device = this.input.device();
    this._serial = this.input.use(_a.serial);
    const serial = this.input.use(_a.serial, 0) + "";
    hashtag = hashtag.split(/[\>\#]/);
    let pagename = hashtag[0]; //decodeURI(hashtag[0])
    const z = Qstring.parse(pagename, true);
    const lang = this.input.page_language();
    this.debug(`hashtag --> ${pagename} lang=${lang}  device =${device}`, z);
    pagename = pagename.replace(/\/.*$/, '');
    if (pagename.match(/\w +\w/)) {
      pagename = encodeURI(pagename);
    }
    const cb = function () {
      const data = this.get_row(arguments);
      return this.find_content(data, device, pagename, serial, status);
    }.bind(this);
    return this.db.call_proc('block_get', pagename, device, lang, cb);
  }

  /** */
  index() {
    this.output.data({ message: "Rest service requires service name." });
  }


  menu() {
    const device = this.input.device();
    const hashtag = this.hub('menu');
    const cb = function () {
      const data = this.get_row(arguments);
      return this.find_content(data, device, hashtag, "0", "", {});
    }.bind(this);
    this.db.call_proc('block_get', hashtag, this.input.page_language(), device, cb);
    return this._dont_cache = true;
  }


  lookup_file(id, device, lang, history_id, status) {
    let file;
    const dir = `${this._block_root}/${id}`;
    this.debug(`LOOKING FOR FILE ${dir}/${device}/${lang}...`);
    if (!_.isEmpty(status) && (status === "published")) {
      file = `${dir}/${device}/${lang}/online.json`;
    } else if (!_.isEmpty(status) && (status === "draft")) {
      file = `${dir}/${device}/${lang}/current.json`;
    } else if ((history_id != null) && (parseInt(history_id) > 0)) {
      file = `${dir}/${device}/${lang}/${history_id}.json`;
    } else if (this.fileExists(`${dir}/${device}/${lang}/online.json`)) {
      file = `${dir}/${device}/${lang}/online.json`;
    } else {
      file = `${dir}/${device}/${lang}/current.json`;
    }
    return file;
  }

  lookup_by_languages(dir) {
    for (let l of this._languages) {
      const out_file = `${dir}/${l}/current.json`;
      this.debug(`CHECKING for lang : ${out_file} \n`);
      try {
        if (this.fileExists(out_file)) {
          this.debug(`FOUND ${out_file} \n`);
          return out_file;
        }
      } catch (error) { }
    }
    return false;
  }



  try_fallback_content(id, hashtag, device, lang, history_id, status) {
    const f = function () {
      let file, l;
      const data = this.get_rows(arguments) || ['en'];
      this.debug(`GOT LANGUAGES for ${hashtag}`, data);
      for (l of data) {
        file = this.lookup_file(id, device, l.lang, history_id, status);
        if (this.fileExists(file)) {
          this.debug(`GOT FILE ${file}`);
          this.send_content(file);
          return;
        }
      }

      if (device === _a.desktop) {
        device = _a.mobile;
      } else {
        device = _a.desktop;
      }

      for (l of data) {
        file = this.lookup_file(id, device, l.lang, history_id, status);
        if (this.fileExists(file)) {
          this.debug("LOOKING FOR CONTENT");
          this.send_content(file);
          return;
        }
      }
      return this.send_content(null, hashtag);
    }.bind(this);
    return this.db.call_proc('block_get_used_languages', hashtag, f);
  }

  get_nearest_lang(device, id) {
    const pattern = `${this._block_root}/${id}/${device}`;
    if (!this.fileExists(pattern)) {
      return 'en';
    }

    const languages = [];
    shell.ls(pattern).forEach(dir => {
      return languages.push(dir);
    });

    const vis_lang = this.input.page_language();
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


  get_default_content(device, id) {
    const pattern = `${this._block_root}/${id}/${device}`;
    if (!this.fileExists(pattern)) {
      return null;
    }
    let files = [];
    let found = null;
    shell.find(pattern).forEach(file => {
      const z = file.match(/(.+\/)([0-9]+)(\.json$)/);
      if (z != null) {
        return files.push({
          serial: z[2],
          path: z[0]
        });
      }
    });
    if (_.isEmpty(files)) {
      return false;
    }
    try {
      files = _.orderBy(files, ['serial'], ['asc']);
      found = files.pop().path;
      this.debug("SORTED DEFAULT", found);
    } catch (error) { }
    return found;
  }

  fallback_content(data, device, hashtag) {
    let d;
    const dir = `${this._block_root}/${data.id}`;
    this.debug(`FILE NOT FOUND for ${hashtag} SCANNING IN LANGUAGES FOR DEVICE=${device}\n`);

    for (d of [_a.desktop, _a.mobile]) {
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

    this.debug(`FILE NOT FOUND for ${hashtag} SCANNING THE WHOLE  HITSORY\n`);
    let found = null;
    // Scan previous versions in all languages, for each kind of device
    for (d of [_a.desktop, _a.mobile]) {
      //skip what's already done
      if (d !== device) {
        found = this.get_default_content(d, data.id);
      }
    }
    return found;
  }


  send_content(out_file, hashtag, data) {
    let stats;
    hashtag = this.input.use(_a.id, this.input.need(_a.hashtag)) || '';
    if (!this.fileExists(out_file)) {
      this.output.data(require('../skeleton/block-not-found')(hashtag, this.input.device(), this.input.page_language()));
      return;
    }

    try {
      stats = fs.statSync(out_file);
    } catch (err) {
      this.session.die('_unknown_error', err, this);
      return;
    }

    out_file = out_file.replace(/^\/data/, '');
    const cache_control = this.hub.get(_a.settings).cache_control || "public,max-age=10000000";
    this.debug(`path selected >>= ${out_file} LENGTH = ${stats.size}, cache-control=${cache_control}\n`);
    this.output.set_header('Content-type', 'text/plain charset=utf-8');
    this.output.set_header('Content-Disposition', `inline; filename*=UTF-8'' ${hashtag}.json`);
    this.output.set_header('Cache-Control', cache_control);
    this.output.set_header('Access-Control-Allow-Methods', 'GET');
    this.output.set_header('Content-Length', stats.size);
    this.output.set_header('X-Accel-Redirect', out_file);
    return this.output.flush();
  }


  find_content(data, device, hashtag, history_id, status, default_data) {
    this.debug("LOOKING FOR CONTENT", data, device, hashtag, history_id, status, default_data);
    const lang = this.input.page_language();
    if ((data == null)) {
      if (default_data != null) {
        this.output.data(default_data);
        return;
      }
      this.output.data(require('../skeleton/block-not-found')(hashtag, this.input.device(), lang));
      return;
    }

    const dir = `${this._block_root}/${data.id}`;

    const file = this.lookup_file(data.id, device, lang, history_id, status);
    this.debug(`VISITOR LANGUAGE --> ${lang}, DEVICE=${device}, hashtag=${hashtag}`, this.input.device(), dir, file);
    if (this.fileExists(file)) {
      this.send_content(file);
      return;
    }

    return this.try_fallback_content(data.id, hashtag, device, lang, history_id, status);
  }


  get_item(data, device, serial) {
    const pattern = `${this._block_root}/${data.id}`;
    let found = {};
    shell.find(pattern).forEach(file => {
      const z = file.match(/(.+\/)([0-9]+)(\.json$)/);
      if ((z != null) && (z[2] === serial.toString())) {
        return found = {
          serial: z[2],
          path: z[0]
        };
      }
    });
    return this.send_content(found.path);
  }


  content_path(id, serial = "current") {
    let device = this.input.device();
    let lang = this.input.page_language();

    let file = `${this._block_root}/${id}/${device}/${lang}/${serial}.json`;
    if (this.fileExists(file)) {
      return file;
    }

    lang = this.get_nearest_lang(device, id);
    file = `${this._block_root}/${id}/${device}/${lang}/${serial}.json`;
    if (this.fileExists(file)) {
      return file;
    }

    file = this.get_default_content(device, id);
    if (this.fileExists(file)) {
      return file;
    }

    device = this.session.alt_device(device);

    file = `${this._block_root}/${id}/${device}/${lang}/${serial}.json`;
    if (this.fileExists(file)) {
      return file;
    }
  }
}



module.exports = __page;

