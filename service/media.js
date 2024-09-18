const {
  Attr, Events, Script, toArray, nullValue,
  RedisStore, Cache, sleep, Constants, sysEnv
} = require("@drumee/server-essentials");
const { DENIED } = Events;
const {
  BATCH_FILE,
  CARD,
  CATEGORY,
  DIRNAME,
  DOWNLOAD_FOLDER,
  EXTENSION,
  FAILED_CREATE_FILE,
  FILENAME,
  FILESIZE,
  FOLDER,
  GEOMETRY,
  IMAGE,
  MIMETYPE,
  NODE_ID,
  ORIGINAL,
  OTHER,
  PREVIEW,
  SLIDE,
  STREAM,
  STYLESHEET,
  THUMBNAIL,
  VIDEO,
  VIGNETTE,
  WEBP,
} = Constants;

const {
  Generator,
  Document,
  FileIo,
  Mfs,
  MfsTools,
} = require("@drumee/server-core");
const { move_dir, remove_dir } = MfsTools;

const {
  mkdirSync,
  readFileSync,
  unlinkSync,
  statSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} = require("fs");

const {
  isString,
  isObject,
  map,
  isEmpty,
  isArray,
  isFunction,
} = require("lodash");

const { 
  data_dir, tmp_dir, server_location, mfs_dir, quota 
} = sysEnv();
const { stringify } = JSON;
const { join, resolve, dirname, basename } = require("path");
const Spawn = require("child_process").spawn;
const DATA_ROOT = new RegExp(`^${data_dir}`);
const SPAWN_OPT = { detached: true, stdio: ["ignore", "ignore", "ignore"] };
const OFFLINE_DIR = resolve(server_location, "offline", "media");

class __media extends Mfs {

  /**
   *
   */
  async sendNodeAttributes(args) {
    const { nid, recipients, service, extraData, myData, exclude } = args;
    let nodes = {};
    let payload;
    for (let r of toArray(recipients)) {
      if (myData && r.uid == this.uid) {
        payload = this.payload({ ...myData, ...extraData }, { service });
      } else {
        let attr =
          nodes[r.uid] ||
          (await this.db.await_proc("mfs_access_node", r.uid, nid));
        nodes[r.uid] = attr;
        payload = this.payload({ ...attr, ...extraData }, { service });
      }
      await RedisStore.sendData(payload, r);
    }
  }

  /**
 * Return manifest of the node
 */
  manifest() {
    let { id } = this.granted_node();
    this.db.call_proc("mfs_manifest", id, this.uid, 1, this.output.list);
  }

  /**
   *
   * @returns
   */
  async make_dir() {
    const parent = this.source_granted();
    const pid = parent.id || this.home_id;
    let ownpath = decodeURI(this.input.get(Attr.ownpath));
    let node;
    let exclude = this.input.need(Attr.socket_id);
    if (exclude) exclude = [exclude];
    let uid = this.uid;
    let attr;
    if (nullValue(ownpath)) {
      let filename = this.input.need(DIRNAME);
      filename = filename.replace(/\//g, "-");
      filename = decodeURI(filename);
      let args = {
        owner_id: uid,
        filename,
        pid,
        category: Attr.folder,
        ext: "",
        mimetype: Attr.folder,
        filesize: 0,
        showResults: 1
      };
      node = await this.ensureCreateNode(args, {});
    } else {
      let path = ownpath.split(/\/+/).filter(function (e) {
        return e.length
      });
      let dir = await this.ensureMakeDir(this.home_id, path, 1);
      if (isEmpty(dir) || !dir.nid) {
        this.exception.user("FAILED_CREATE_FOLDER");
        return;
      }
      node = await this.db.await_proc("mfs_access_node", uid, dir.id);
    }

    if (/^(.|.+\/.+| )$/.test(dirname)) {
      this.exception.user("INVALID_FILENAME");
      return;
    }
    let recipients = await this.yp.await_proc("entity_sockets", {
      hub_id: parent.hub_id,
      exclude,
    });
    recipients = toArray(recipients);
    await this.sendNodeAttributes({
      nid: node.nid,
      recipients,
      service: "media.new",
      myData: attr,
      exclude
    });
    this.output.data(node);
  }

  /**
   * ownpath refers to the absolute path within the hub, nid must be set to hone_id
   * @returns
   */
  async _ensureParentExists() {
    let node = this.granted_node();
    let replace =
      this.input.get("replace") || this.input.get("createOrReplace");
    /** Standard upload, using nid as destination */
    let ownpath = this.input.get(Attr.ownpath);
    this.heap.upload = node;

    if (nullValue(ownpath)) {
      if (this.isBranche(node)) {
        this._mustReplace = false;
      } else {
        if (replace) {
          this._mustReplace = true;
        } else {
          this._mustReplace = false;
        }
      }
      this._done();
      return;
    }
    ownpath = decodeURI(ownpath);
    let { actual_home_id, id } = node;
    if (actual_home_id != this.home_id) {
      this.warn(`Using ownpath implies having same home_id: `,
        `Expected home_id=${this.home_id}, got ${actual_home_id}`,
        "Will bypass"
      )
      return this.exception.server("OWNPATH_INCONSISTENT");
    }

    let filename = basename(ownpath);
    id = await this.db.await_func("node_id_from_path", ownpath);
    if (id) {
      let item = await this.db.await_proc('mfs_access_node', this.uid, id);
      if (item && item.nid) {
        if (this.isBranche(item)) {
          return this.exception.server("CANNOT_REPLACE_FOLDER");
        }
        this._mustReplace = 1;
        this.granted_node(item);
        this.heap.upload = item;
        return this._done();
      }
    }

    let dir = dirname(ownpath).split(/\/+/).filter(function (e) {
      return e.length
    });

    if (!dir.length) {
      this._done();
      return;
    }

    let parent = await this.ensureMakeDir(actual_home_id, dir, 1);
    if (!parent || !parent.nid) {
      return this.exception.server("FAILED_CREATE_FOLDER");
    }
    parent.filepath = join(parent.file_path, filename);
    parent.file_path = parent.filepath;
    this.heap.upload = parent;
    this.granted_node(parent);
    this._done();
  }

  /**
   *
   */
  shouldReplace() {
    if (this._mustReplace != null) {
      return this._mustReplace;
    }
    let node = this.granted_node();

    if (this.isBranche(node)) {
      this._mustReplace = false;
      return this._mustReplace;
    }

    let replace =
      this.input.use("replace") || this.input.use("createOrReplace") || false;
    this._mustReplace = replace;
    return replace;
  }

  /**
   *
   * @returns
   */
  async pre_upload() {
    let json_str;

    if (this.session.isAnonymous()) {
      const token = this.input.use(Attr.token);
      if (isEmpty(token) && isEmpty(this.input.sid())) {
        this.warn("Trying to upload in without token");
        this.trigger(DENIED);
        return;
      }
    }
    let nid = this.input.use(Attr.nid);
    switch (nid) {
      case "-1":
      case "-2":
      case "-3":
      case -1:
      case -2:
      case -3:
        this._done();
        break;

      case -100:
      case "-100":
        const p = this.input.use(Attr.path);
        this.heap.tmp = p;
        json_str = stringify(
          map(p, function (e) {
            return decodeURI(e);
          })
        );
        let d = await this.ensureMakeDir(this.home_id, json_str, 1);
        this.output.data(d);
        break;

      default:
        await this._ensureParentExists();
    }
  }

  /** configure_icon
   * @param {any} nid
   * @param {any} incoming_file - the actual file prepared by core/io
   * @param {string} filename - the actual file prepared by core/io
   */
  configure_icon(nid, incoming_file, filename) {
    let mimetype = this.input.use(MIMETYPE);
    const c = this.get_format(filename, mimetype);
    mimetype = mimetype || c[MIMETYPE];
    const ext = c[EXTENSION];

    const filepath = join(this.user.get(Attr.home_dir), "__config__", "icons");
    mkdirSync(filepath, { recursive: true });
    if (!existsSync(filepath)) {
      this.warn(`ERROR : ${filepath} not found`);
      this.exception.user(FAILED_CREATE_FILE);
    }

    const orig = `${filepath}/tmp.${ext}`;
    copyFileSync(incoming_file, orig);
    unlinkSync(incoming_file);
    Generator.create_avatar(nid, ext, this.user.get(Attr.home_dir), orig);
    this.yp.call_proc("entity_touch", this.user.get(Attr.id), this.output.data);
  }

  /**
   * @param {any} nid - special operation when < 0
   * @param {any}
   * Uploaded files are received by core/io
   * which store the content into io.input->file_path
   */
  async upload() {
    let nid = this.input.use(Attr.nid);
    const incoming_file = this.input.need(Attr.uploaded_file); // internally set by io
    let filename = decodeURI(this.input.need(Attr.filename));
    switch (nid) {
      case -1:
      case -2:
      case -3:
      case "-1":
      case "-2":
      case "-3":
        this.configure_icon(nid, incoming_file, filename);
        break;

      default:
        let node = this.granted_node();
        if (this.shouldReplace()) {
          this.replace(node.id, incoming_file, filename);
        } else {
          if (nid == "0") {
            nid = this.home_id;
          }
          if (this.heap.upload.nid) {
            // set by pre_upload
            nid = this.heap.upload.nid;
          }
          await this.store(nid, incoming_file, filename);
        }
    }
  }

  /**
   * @param {any} nid - node id when reaching MFS area, special operation when < 0
   * @param {any}
   * Uploaded files are received by core/io
   * which store the content into io.input->file_path
   */
  async upload_base64() {
    const image = this.input
      .need(Attr.image)
      .replace(/^data:image\/\w+;base64,/, "");
    const parent = this.source_granted();
    const filename = this.randomString() + "-" + this.input.need(Attr.filename);
    let filepath = resolve(tmp_dir, `${filename}`);
    writeFileSync(filepath, image, { encoding: "base64" });
    await this.store(parent.id, filepath, this.input.need(Attr.filename));
  }

  /**
   *
   */
  async chekcDiskLimit(rid) {
    if (!rid) {
      rid = this.hub.get(Attr.id);
    }
    let curr_filesize = this.input.use(FILESIZE, 0);
    let disk_limit = await this.yp.await_proc("disk_limit", rid) || {};
    let { watermark, owner_id, available_disk } = disk_limit;
    let { watermark: sys_watermark } = quota;
    if (watermark == Infinity || sys_watermark == Infinity){
      return true;
    } 
    let allowed_limit = available_disk || 0;
    if (curr_filesize > allowed_limit) {
      let error = Cache.message("your_limit_exceeded");
      if (this.uid != owner_id) {
        error = Cache.message("limit_exceeded");
      }
      this.exception.user(error);
      return false;
    }
    return true;
  }

  /**
   * Preapre data for storage
   * @param {*} incoming_file 
   * @param {*} filename 
   * @param {*} parent 
   * @returns 
   */
  async before_store(incoming_file, filename, parent) {
    if (!existsSync(incoming_file)) {
      this.exception.user(FAILED_CREATE_FILE);
      return;
    }

    if (!(await this.chekcDiskLimit())) return;

    const mimetype = this.input.use(MIMETYPE);
    const c = this.get_format(filename, mimetype);
    if (!c.category || c.category == OTHER) {
      try {
        const Shell = require("shelljs");
        let str = Shell.exec(`/usr/bin/file ${incoming_file}`).stdout;
        str = str.replace(/^.+:/, "");
        if (/(script|text|ascii)/i.test(str)) {
          c.category = "text";
        }
      } catch (e) {
        this.warn("ERR:376", e);
      }
    }
    const data = {};
    data.filename = c.filename;
    data.parent_id = parent.nid;
    data.category = c.category;
    data.extension = c.extension;
    data.mimetype = mimetype || c.mimetype || "";
    data.geometry = "0x0";
    data.filesize = this.input.use(FILESIZE, 0);
    if (/^json$/i.test(c.extension)) {
      try {
        const { readFileSync } = require("jsonfile");
        let json = readFileSync(incoming_file) || {};
        if (/GraphLinksModel/i.test(json.class)) {
          data.metadata = {
            dataType: "diagram.state",
          };
        }
      } catch (e) {
        this.warn("ERR:397", e);
      }
    }
    return data;
  }

  /**
 * In case of massive write, DB dead lock may appear
 * Retry until dead lock left or too much rety 
 */
  async ensureMakeDir(id, path, showResult) {
    let node = await this.db.await_proc("mfs_make_dir", id, path, showResult);
    let i = 0;
    while (node[1] && node[1].sqlstate == '40001' && i < 30) {
      await sleep(500);
      node = await this.db.await_proc("mfs_make_dir", id, path, showResult);
      i++;
    }
    if (i > 29) {
      this.warn(`DEAD_LOCK_WAIT_TOOL_LONG. mfs_make_dir waited ${i} times`, node)
    }
    return node;
  }

  /**
   * In case of massive write, DB dead lock may appear
   * Retry until dead lock left or too much rety 
   */
  async ensureCreateNode(args, metadata, results = { isOutput: 1 }) {
    let node = await this.db.await_proc("mfs_create_node", args, metadata, results);
    let i = 0;
    while (node[1] && node[1].sqlstate == '40001' && i < 30) {
      await sleep(500);
      node = await this.db.await_proc("mfs_create_node", args, metadata, results);
      i++;
    }
    if (i > 29) {
      this.warn(`DEAD_LOCK_WAIT_TOOL_LONG. mfs_create_node waited ${i} times`, node)
    }
    return node;
  }

  /**
   *
   * @param {*} pid
   * @param {*} incoming_file
   * @param {*} filename
   * @param {*} callback
   * @returns
   */
  async store(pid, incoming_file, filename, callback) {
    let error;
    if (!pid) {
      error = `REQUIRE_PARENT_ID`;
      this.exception.server(error);
      return { error };
    }
    let uid = this.uid;
    let folder = this.granted_node();
    if (isEmpty(folder) || !folder.id) {
      error = `PERMISSION_DENIED`;
      this.exception.server(error);
      return { error };
    }

    let parent_of = await this.db.await_func("is_parent_of", folder.nid, pid);
    if (!parent_of && folder.nid != pid) {
      error = `WRONG_FILEPATH`;
      this.exception.server(error);
      return { error };
    }

    const data = await this.before_store(incoming_file, filename, folder);
    if (!data) {
      return { error: "failed_to_store" };
    }
    filename = data[FILENAME] || this.randomString();
    if (filename.length > 126) {
      filename = filename.slice(0, 126);
    }

    let args = {
      owner_id: uid,
      filename,
      pid,
      category: data[CATEGORY],
      ext: data[EXTENSION],
      mimetype: data[MIMETYPE],
      filesize: data[FILESIZE],
      showResults: 1
    }
    let md = this.input.get(Attr.metadata);
    let metadata = {};
    if (md) {
      if (isString(md)) {
        metadata = JSON.parse(md);
      } else if (isObject(md)) {
        metadata = md;
      }
    }
    let md5Hash = this.input.get("md5Hash");
    metadata.md5Hash = md5Hash;

    let node = this.ensureCreateNode(args, metadata);
    node = await this.normalizeNode(node);

    if (!node || !node.id) {
      this.exception.server(`Failed to save file ${filename}`);
      return { error: "failed_to_store" };
    }
    let res = await this.after_store(pid, incoming_file, node);
    if (res.error || res.done) {
      return;
    }
    if ([Attr.document, Attr.image].includes(data[CATEGORY])) {
      if (data[FILESIZE] < 1024 * 1024) {
        Document.buildIndex(node);
      } else {
        // TO DO : add yp.crontab
      }
    }
    if (isFunction(callback)) {
      return callback(node);
    }
    let disk_usage = await this.yp.await_func("disk_usage", this.uid);
    node.disk_usage = disk_usage;
    this.output.data(node);
  }

  /**
 *
 */
  async handleForm(incoming_file, data) {
    let error;
    if (this.shouldReplace()) {
      error = "UNSUPPORTED_REPLACE";
      this.exception.user(error);
      return { error };
    }
    let form = readFileSync(incoming_file) || {};
    let definition = form.schema;
    let keys = form.keys;
    if (form.type != Attr.form || !definition) return;
    let name = `form_${data.id}`;
    let k, def, key;
    let sql = `CREATE TABLE IF NOT EXISTS ${name} (`;
    if (!keys) {
      definition.sys_id = "int(11) unsigned NOT NULL AUTO_INCREMENT";
      keys = {
        primary: "sys_id",
      };
    }

    if (!keys.primary) keys.primary = "sys_id";

    for (k in definition) {
      def = definition[k];
      sql = `${sql} ${k} ${def},`;
    }
    sql = `${sql} primary key (\`${keys.primary}\`),`;
    if (isArray(keys.unique)) {
      for (k in keys.unique) {
        let key = keys.unique[k];
        if (!definition[key]) continue;
        sql = `${sql} unique key (\`${key}\`),`;
      }
    }
    if (isArray(keys.index)) {
      for (k in keys.index) {
        let key = keys.index[k];
        if (!definition[key]) continue;
        sql = `${sql} unique key (\`${key}\`),`;
      }
    }
    sql = sql.replace(/,$/, ")");
    let r = await this.db.await_run(sql);
    if (r.errno) {
      this.exception.user(r.text);
      return { error: "FAILED_TO_CREATE_TABLE", message: r.text };
    }
    let writeHtml = require("@drumee/server-core/template");

    let html_file = writeHtml({ ...data, ...form });
    let filesize = 0;
    if (existsSync(master)) {
      filesize = statSync(html_file).size;
    }
    let filename = data.filename.replace(/\.form+$/, ".html");
    let args = {
      owner_id: this.uid,
      filename,
      pid,
      category: 'web',
      ext: 'html',
      mimetype: 'text/html',
      filesize,
      showResults: 1
    }
    let lines = readFileSync(html_file);
    let { createHash } = require("crypto");

    let md = this.input.get(Attr.metadata);
    let md5Hash = createHash("md5");
    md5Hash.update(Buffer.from(lines));
    let metadata = { md5Hash };

    let node = this.ensureCreateNode(args, metadata);
    await this.sendNodeAttributes({
      nid: node.nid,
      recipients,
      service,
      myData: node
    });

    return { ...node, done: 1 };
  }

  /**
   *
   * @param {*} node
   */
  _convertToPdf(node) {
    let socket_id = this.input.get(Attr.socket_id);
    let args = {
      node,
      uid: this.uid,
      socket_id,
    };

    let cmd = resolve(OFFLINE_DIR, "to-pdf.js");
    let child = Spawn(cmd, [JSON.stringify(args)], SPAWN_OPT);
    child.unref();
  }

  /**
   *
   */
  toPdf() {
    this._convertToPdf(this.granted_node());
    this.output.data({ buildState: "wait" });
  }

  /**
   *
   * @param {*} data
   */
  async handlePdf(incoming_file, data) {
    const { writeFileSync } = require("jsonfile");
    let exclude = [this.input.get(Attr.socket_id)];
    const raw_data = { ...data };
    data.tmpfile = incoming_file;
    data.replace = this.shouldReplace();
    const base = resolve(data.mfs_root, data.id);
    const ext = data.extension.toLowerCase();
    let orig = `${base}/orig.${ext}`;
    let info = join(base, "info.json");
    // Store tmpfile for generator
    let hash = this.randomString();
    let fastdir = join(tmp_dir, hash);
    mkdirSync(fastdir, { recursive: true });
    let tmpfile = join(fastdir, `orig.${ext}`);
    let docInfo = { fastdir, buildState: Attr.working, tmpfile };
    move_dir(incoming_file, tmpfile);
    writeFileSync(info, docInfo);
    let child = Spawn("cp", [tmpfile, orig], SPAWN_OPT);
    data.position = this.input.get(Attr.position) || 0;
    let recipients = await this.yp.await_proc(
      "entity_sockets",
      {
        hub_id: this.hub.get(Attr.id),
        exclude,
      }
    );

    if (!data.replace) {
      await this.sendNodeAttributes({
        nid: data.nid,
        recipients,
        service: "media.new",
        myData: data,
      });
    } else {
      rmSync(info, { force: true });
      writeFileSync(info, docInfo);
      await this.sendNodeAttributes({
        nid: data.nid,
        recipients,
        service: "media.replace",
        myData: data,
        extraData: { buildState: "wait" },
      });
    }
    child.unref();
    this._convertToPdf({ ...raw_data, ...data });
  }

  /**
   * 
   * @param {*} incoming_file 
   * @param {*} data 
   * @returns 
   */
  async after_store(pid, incoming_file, data) {
    const base = resolve(data.mfs_root, data.id);
    let exclude = [this.input.get(Attr.socket_id)];
    mkdirSync(base, { recursive: true });
    const ext = data.extension.toLowerCase();
    let orig = `${base}/orig.${ext}`;

    this.granted_node(data);
    if (data.filetype == Attr.document && data.extension != Attr.pdf) {
      this.handlePdf(incoming_file, data);
      return data;
    }
    if (data.filetype == Attr.form) {
      let content = await this.handleForm(pid, incoming_file, data);
      return content;
    }

    move_dir(incoming_file, orig);
    if (!existsSync(orig)) {
      this.warn(`${__filename}:337 ${orig} not found`);
      this.exception.user(FAILED_CREATE_FILE);
      return { ...data, error: 1 };
    }

    // Force information generation
    if (data.filetype == Attr.document && data.extension == Attr.pdf) {
      Document.getInfo(data);
    }

    data.position = this.input.get(Attr.position) || 0;

    let hub_id = this.hub.get(Attr.id);
    let recipients = await this.yp.await_proc("entity_sockets", {
      hub_id,
      exclude,
    });
    this.debug("AAA:787", {recipients, hub_id, exclude})
    let service = "";
    if (this.shouldReplace()) {
      service = "media.replace";
    } else {
      service = "media.new";
    }
    await this.sendNodeAttributes({
      nid: data.nid,
      recipients,
      service,
      myData: data
    });

    return data;
  }

  /**
   * 
   */
  get_all() {
    const node_id =
      this.input.use(Attr.nid) || this.input.use(Attr.node_id, this.get_home_id());
    const page = this.input.use(Attr.page, 1);
    this.db.call_proc("mfs_list_all", node_id, page, this.output.data);
  }

  /**
   * 
   */
  async show_node_by() {
    const nid = this.source_granted().id || "0";
    let sort = this.input.use(Attr.sort, Attr.rank).toLowerCase();
    let order = this.input.use(Attr.order, "asc").toLowerCase();
    if (![Attr.rank, Attr.date, Attr.size, Attr.sort].includes(sort)) {
      sort = Attr.rank;
    }
    if (!["asc", "desc"].includes(order)) {
      order = "asc";
    }
    const page = this.input.use(Attr.page, 1);
    let data = await this.db.await_proc(
      "mfs_show_node_by",
      nid,
      this.uid,
      sort,
      order,
      page
    );
    this.output.list(data);
  }

  /**
   * 
   */
  async show_node_by_with_size() {
    const nid = this.source_granted().id || "0";
    let sort = this.input.use(Attr.sort, Attr.rank).toLowerCase();
    let order = this.input.use(Attr.order, "asc").toLowerCase();
    if (![Attr.rank, Attr.date, Attr.size, Attr.sort].includes(sort)) {
      sort = Attr.rank;
    }
    if (!["asc", "desc"].includes(order)) {
      order = "asc";
    }
    const page = this.input.use(Attr.page, 1);
    let branch = await this.db.await_proc(
      "mfs_show_node_by",
      nid,
      this.uid,
      sort,
      order,
      page
    );
    if (!isArray(branch)) {
      branch = [branch];
    }
    let tree = [];
    for (let file of branch) {
      if (file.ftype == "folder") {
        let nodes = await this.db.await_proc("mfs_manifest", nid, this.uid, 0);
        file.filesize = nodes[0].total_size;
        //file.node = nodes
      }
      tree.push(file);
    }
    this.output.data(tree);
  }

  /**
   * 
   */
  reorder() {
    // Do not allow browsing
    this.output.data([]);
  }

  /**
   * 
   */
  async get_by_type() {
    const type = this.input.use(Attr.type, IMAGE);
    const page = this.input.use(Attr.page, 1);
    let opt = {
      type: this.input.get(Attr.type) || IMAGE,
      page: this.input.get(Attr.page) || 1,
      order: this.input.get(Attr.order),
      sort: this.input.get(Attr.sort),
      pid: this.granted_node().id,
    };
    if (this.input.get("showAll")) {
      opt.pid = "*";
    }
    let files = await this.db.await_proc("mfs_list_by", opt);
    this.output.list(files);
  }

  /**
   * Gets list of all medias inside a node.
   */
  async get_path() {
    const node_id = this.source_granted().id;
    const filenames = await this.db.call_proc("mfs_get_filenames", node_id);
    const data = await this.db.call_proc("mfs_get_path", node_id);

    const p = [];
    if (isArray(data)) {
      for (let d of data) {
        if (!isEmpty(d)) {
          p.push(d);
        }
      }
    } else {
      p.push(data);
    }
    this.output.add_data({ filenames });
    this.output.data(p);
  }

  /**
   * 
   */
  show_slides() {
    const nid = this.input.need(Attr.nid);
    const page = this.input.use(Attr.page, 1);
    let files = this.mfs_list_node_by(nid, IMAGE, page);
    this.output.data(files);
  }

  /**
   * 
   * @returns 
   */
  media_search() {
    const string = this.input.safe_string(Attr.string);
    const page = this.input.use(Attr.page, 1);
    if (isEmpty(string)) {
      this.output.data([]);
      return;
    }

    this.db.call_proc("media_search", string, page, this.output.list);
  }

  /**
   * 
   */
  galery() { }

  /**
   * 
   */
  async vignette() {
    //const nid = this.input.need(Attr.nid);
    await this.send_media(this.source_granted(), VIGNETTE);
  }

  /**
   * 
   */
  async thumb() {
    await this.send_media(this.source_granted(), THUMBNAIL);
  }

  /**
   * 
   */
  async card() {
    await this.send_media(this.source_granted(), CARD);
  }

  /**
   * 
   */
  async mark_as_seen() {
    const nid = this.input.need(Attr.nid);
    let data = await this.db.await_proc(
      "mfs_mark_as_seen",
      this.input.need(Attr.nid),
      this.uid,
      1
    );
    let recipients = await this.yp.await_proc("user_sockets", this.uid);
    let keys = { entity_id: Attr.hub_id };
    await RedisStore.sendData(this.payload(data, { keys }), recipients);
    await RedisStore.sendData(
      this.payload({}, { service: "notification.resync" }),
      recipients
    );
    this.output.data(data);
  }

  /**
   * 
   */
  clear_notifications() {
    this.output.data({});
  }

  /**
   *
   */
  async slide() {
    await this.send_media(this.source_granted(), SLIDE);
  }

  /**
   *
   */
  async preview() {
    await this.send_media(this.source_granted(), PREVIEW);
  }

  /**
   *
   */
  async pdf() {
    //const nid = this.input.need(Attr.nid);
    let node = this.granted_node();
    if (node.filetype != Attr.document) {
      this.exception.user("WRONG_FORMAT");
      return;
    }
    let info = Document.getInfo(node);
    const fileio = new FileIo(this);
    let path = info.pdf;
    if (path != null) {
      if (!existsSync(path)) {
        let s = Document.rebuildInfo(
          node,
          this.uid,
          this.input.get(Attr.socket_id)
        );
        if (s.path) {
          path = s.path;
        } else {
          this.output.data(s);
          return;
        }
      }
      const opt = {
        name: `${node.filename}.pdf`,
        path,
        accel: path.replace(DATA_ROOT, ""),
        mimetype: "application/pdf",
        code: 200,
      };
      fileio.static(opt);
    } else {
      fileio.not_found();
    }
  }

  /**
   * 
   */
  async webp() {
    await this.send_media(this.source_granted(), WEBP);
  }

  /**
   * 
   */
  async folder() {
    await this.send_media(this.source_granted(), FOLDER);
  }

  /**
   *
   */
  async page() {
    let filepath;
    let p = this.input.need("p");
    const e = this.input.use("e");
    if (!isEmpty(e)) {
      filepath = join(`${p}.${e}`);
    } else {
      filepath = join(p);
    }
    // filepath = `/${filepath}`;
    // filepath = filepath.replace(/^(\/+)/, '/');
    filepath = decodeURI(filepath);

    let data = await this.await_proc("mfs_get_by_path", filepath);

    if (!isEmpty(data) && data.id) {
      await this.send_media(data.id, ORIGINAL, null, "raw");
    } else {
      const fileio = new FileIo(this);
      return fileio.not_found(filepath);
    }
  }

  /**
   * 
   */
  async view() {
    const nid = this.input.need(Attr.nid);
    const page = this.input.use(Attr.page) || 0;
    await this.send_media(this.source_granted(), SLIDE, page);
  }

  /**
   *
   * @param {array} args list of node to be created as zip
   */
  zip_release() {
    const id = this.input.need(Attr.id);
    const src = join(tmp_dir, DOWNLOAD_FOLDER, this.uid, id);
    const link = join(
      mfs_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      id
    );
    remove_dir(src, 1);
    remove_dir(link, 1);
    this.output.data({ id });
  }

  /**
   *
   * @param {array} args list of node to be created as zip
   * @param {array} cvf if present export cvf from user addresses book
   */
  create_large_zip(args, vcf) {
    //let dest_dir = this.home_dir;
    const zipid = this.randomString();

    const dest_dir = join(
      mfs_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      zipid
    );
    mkdirSync(dest_dir, { recursive: true });
    const batch_file = join(dest_dir, BATCH_FILE);
    if (vcf) this.writeVcf(vcf, dest_dir);

    const { writeFileSync } = require("jsonfile");
    writeFileSync(batch_file, { nodes: args, uid: this.uid, zipid });
    return zipid;
  }

  /**
   *
   * @param {array} args list of node to be created as zip
   * @param {string} zipname name of zipped file
   */
  create_small_zip(args, zipname, vcf) {
    const zipid = this.randomString();

    const dest_dir = join(
      tmp_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      zipid
    );
    //if (!this.sh_mkdir(dest_dir)) throw "Failed to create zip dir";
    mkdirSync(dest_dir, { recursive: true });
    let files = args;
    if (!isArray(files)) {
      files = [files];
    }
    let dump = this.makeArchiveList(files, dest_dir);
    for (let k of dump) {
      if ([Attr.hub, Attr.folder].includes(k.type)) continue;
      if (existsSync(k.src)) {
        symlinkSync(k.src, k.dest);
      }
    }
    if (vcf) this.writeVcf(vcf, dest_dir);

    let cmd = `${Script.archive} ${dest_dir} index`;
    if (this.sh_exec(cmd)) {
      return zipid;
    }
  }

  /**
   *
   * @param {*} nid
   * @returns
   */
  async get_branch_nodes(nid) {
    let ids = this.input.use(Attr.nodes);
    let nodes = [];
    let r;
    let filename = this.input.use(Attr.filename) || "drumee-dl";
    let size = 0;
    if (isArray(ids)) {
      let res = [];
      for (let n of ids) {
        r = await this.yp.await_proc(
          "redirect_proc",
          n.hub_id,
          "mfs_manifest",
          [n.nid, this.uid, 1]
        );
        res = res.concat(r[0]);
        size = parseInt(size) + parseInt(r[1].total_size);
      }
      nodes = [res, { size, total_size: size }, { filename }];
    } else {
      r = await this.db.await_proc("mfs_manifest", nid, this.uid, 1);
      filename = this.granted_node().filename || r[2].filename || "drumee";
      size = parseInt(r[1].total_size);
      nodes = [r[0], { size, total_size: size }, { filename }];
    }
    return nodes;
  }

  /**
   * 
   * @param {*} id 
   * @param {*} vcf 
   * @returns 
   */
  async download(id, vcf) {
    let node = this.source_granted();
    let nid = node.id;
    let socket_id = this.input.need(Attr.socket_id);
    if (id) {
      nid = id;
    }
    let nodes = await this.get_branch_nodes(nid);
    let size = nodes[1].total_size;
    let total_size = size;
    let zipid;
    let hub_id = this.hub.get(Attr.id);
    let filename = nodes[2].filename;
    let zipname = filename.replace(/[ \n\<\>'"\(\)\/]/g, "-");
    const Moment = require("moment");
    let t = Moment(Moment.now() / 1000, "X").format("YYYY-MM-DD hh:mm");
    zipname = `Drumee-${t}`;
    if (size <= 1024 * 1024 * 5) {
      zipid = this.create_small_zip(nodes[0], zipname, vcf);
      this.output.data({
        wait: 0,
        zipname,
        hub_id,
        size,
        nid,
        zipid,
      });
      return;
    }
    zipid = this.randomString();
    const lang = this.client_language();
    if (isArray(this.input.use(Attr.nodes))) {
      nodes = this.input.use(Attr.nodes);
    } else {
      nodes = [Document.cleanData(this.source_granted().node)];
    }
    let args = {
      nodes,
      lang,
      uid: this.uid,
      zipid,
      socket_id,
    };
    let cmd = resolve(OFFLINE_DIR, "download.js");
    const str_args = JSON.stringify(args);
    let child = Spawn(cmd, [str_args], SPAWN_OPT);
    this.notice("AAA:1271", cmd, `'${str_args}'`)
    this.output.data({
      wait: 1,
      size,
      total_size,
      zipid,
      nid,
      hub_id,
      zipname,
    });
    child.unref();
  }

  /**
   *
   */
  writeVcf(vcf, dest_dir) {
    let filename = Cache.message("_addresses_book", this.client_language());
    let entries = [];
    for (let entry of vcf) {
      entries.push(entry.join(""));
    }
    writeFileSync(resolve(dest_dir, `${filename}.vcf`), entries, {
      encoding: "utf8",
    });
  }

  /**
   * get prepared zip file
   * @returns 
   */
  async zip() {
    const id = this.input.need(Attr.id);
    const name = this.input.need(Attr.name);
    const src = join(
      tmp_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      id,
      `index.zip`
    );
    const target = join(
      mfs_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      id
    );
    mkdirSync(target, { recursive: true });
    const file = join(target, `index.zip`);
    const fileio = new FileIo(this);

    // In case of download several time
    if (existsSync(file)) {
      rmSync(file);
    }

    symlinkSync(src, file);
    if (existsSync(file)) {
      const opt = {
        path: file,
        mimetype: "application/zip",
        code: 200,
      };
      fileio.static(opt);
      return;
    }
    fileio.not_found();
  }

  /**
   *
   * @param {array} args list of node to be created as zip
   */
  zip_cancel() {
    const id = this.input.need(Attr.id);
    const cancelId = this.input.need("cancelId");
    const dirname = join(
      mfs_dir,
      DOWNLOAD_FOLDER,
      this.uid,
      id
    );
    const file = join(dirname, `index.zip`);
    if (existsSync(file) && cancelId) {
      // Provied process id is the parent of the actual zipper...
      process.kill(cancelId, 'SIGINT');
    }
    this.output.data({});
  }

  /**
   * 
   */
  async zip_size() {
    let nid = this.source_granted().id;
    // Check socket binding
    let dest = await this.yp.await_proc(
      "socket_get",
      this.input.need(Attr.socket_id)
    );

    let nodes = await this.get_branch_nodes(nid);
    let size = nodes[1].total_size;
    this.output.data({ size, socket_bound: isEmpty(dest) });
  }

  /**
   * 
   */
  async orig() {
    await this.send_media(this.source_granted(), ORIGINAL);
  }


  /**
   * cross log probe
   */
  xl() {
    let referer = this.input.get("referer");
    let probeid = this.input.get(Attr.nid);
    this.session.log_service({ referer, probeid });
    const fileio = new FileIo(this);
    fileio.icon();
  }

  /**
   * 
   */
  async stylesheet() {
    await this.send_media(this.source_granted(), STYLESHEET);
  }

  /**
   * 
   */
  async script() {
    await this.send_media(this.source_granted(), Attr.script);
  }
  /**
   * 
   */
  async audio() {
    await this.send_media(this.source_granted(), STREAM);
  }

  /**
   * 
   */
  async video() {
    await this.send_media(this.source_granted(), STREAM);
  }


  /**
   * 
   */
  async ogv() {
    await this.send_media(this.source_granted(), VIDEO);
  }

  /**
   * 
   * @returns 
   */
  async raw() {
    let filepath;
    let p = this.input.need("p");
    const e = this.input.use("e");
    if (p.match(/(\/+)$/)) {
      p = p.replace(/(\/+)$/, "");
      filepath = `/${p}`;
    } else if (!isEmpty(e)) {
      filepath = `/${p}.${e}`;
    } else {
      filepath = p;
    }
    filepath = `/${filepath}`;
    filepath = filepath.replace(/^(\/+)/, "/");
    filepath = decodeURI(filepath);
    let data = await this.db.await_proc("mfs_get_by_path", filepath);

    if (!isEmpty(data) && data.id) {
      try {
        let md = data.metadat;
        if (isString(md)) md = JSON.parse(md);

        if (md && md.loader) {
          let file = resolve(
            this.granted_node().home_dir,
            data.id,
            `orig.${data.extension}`
          );
          let loader = readFileSync(file);
          loader = String(loader).trim().toString();
          const Bootstrap = require("../client/bootstrap");
          let b = new Bootstrap(this);
          let c = await b.htmlContent(md.loader, md);
          this.output.html(c);
          b.stop();
          return;
        }
      } catch (e) {
        this.warn("FAILED TO GET HTML CONTENT", e);
      }
      await this.send_media(data.id, ORIGINAL, null, "raw");
      if (this.input.get("xid")) {
        this.session.log_service();
      }
      return;
    }
    const fileio = new FileIo(this);
    fileio.not_found(filepath);
  }

  /**
   * 
   * @param {*} id 
   * @param {*} name 
   * @param {*} value 
   * @param {*} cb 
   */
  _setAttr(id, name, value, cb) {
    switch (name) {
      case "mtime":
      case "ctime":
        name = "publish_time";
    }
    this.db.call_proc("mfs_set_attr", id, name, value, cb);
  }

  /**
   * 
   * @param {*} data 
   * @returns 
   */
  _clean_json(data) {
    //data._clean_ = 1;
    let str = stringify(data);
    str.replace(/\'/g, "&#9054;");
    return JSON.parse(str);
  }

  /**
   * 
   * @param {*} n 
   * @returns 
   */
  async info(n) {
    let node = n || this.granted_node();
    if (!node || !node.id) {
      this.exception.forbiden();
      return;
    }
    let info = { status: "na" };
    switch (node.filetype) {
      case Attr.document:
        info = Document.getInfo(node);
        if (
          info.error == "FILE_NOT_FOUND" ||
          !info.pdf ||
          !existsSync(info.pdf)
        ) {
          info = Document.rebuildInfo(
            node,
            this.uid,
            this.input.get(Attr.socket_id)
          );
        }
        break;
      case Attr.audio:
        try {
          info = await Generator.get_mm_info(node);
        } catch (e) {
          this.warn("Generator failed", e);
        }
        break;
      case Attr.video:
        info = Generator.get_video_info(node);
        break;
      case Attr.image:
        info = Generator.get_image_info(node);
        if (info.Image && /[0-9]+x[0-9]+/.test(info.Image.Geometry)) {
          await this.db.await_proc(
            "mfs_set_attr",
            node.id,
            "geometry",
            info.Image.Geometry
          );
        }
        break;

      case Attr.folder:
        info = await this.db.await_proc("mfs_manifest", node.id, this.uid, 0);
        break;
    }
    if (isEmpty(info)) {
      info = { error: "FILE_NOT_FOUND", reason: "NO_MORE_EXISTS" };
    }
    info.stats = this.sanitize(node);
    this.output.data(info);
  }

  /**
   * 
   */
  async get_node_attr() {
    let node = this.granted_node();
    let relpath = this.input.get('relpath');
    if (relpath) {
      let filepath = join(node.ownpath, relpath);
      let id = await this.db.await_func("node_id_from_path", filepath);
      if (id) {
        let item = await this.db.await_proc('mfs_access_node', this.uid, id);
        if (item && item.nid) {
          return this.output.data(item);
        }
      }
    }
    this.output.data(node);
  }

  /**
   * 
   */
  async is_expired() {
    const id = this.input.use(NODE_ID);
    let res = {};
    res.is_expired = 1;
    res.expiry = await this.db.await_func("user_expiry", this.uid, id);
    res.now = new Date().getTime(); //await this.db.await_func(" UNIX_TIMESTAMP");
    if (res.expiry > res.now) res.is_expired = 0;
    this.output.data(res);
  }
}

module.exports = __media;
