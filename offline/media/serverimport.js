#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const stringify = require("json-stringify");
const Minimist = require("minimist");
const { exit } = require("process");
const shell = require("shelljs");
const Fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
var mime = require("mime-types");
const Jsonfile = require("jsonfile");
const {Attr, Constants, RedisStore, Mariadb, Offline, Cache, toArray, sysEnv} = require('@drumee/server-essentials');

class __offline_media_import extends Offline {
  /**
   * 
   */
  initialize() {
    const argv = Minimist(process.argv.slice(2));
    let data;
    try {
      data = JSON.parse(argv._[0]);
    } catch (e) {
      console.error("Failed to parse arguments", e);
      exit(1);
    }
    this.yp = new Mariadb({ user: process.env.USER });
    this.data = data;
    this.pid = data.pid;
    this.recipient_id = data.recipient_id;
    this.source_list = data.source_list;
    this.socket_id = data.socket_id;
    this.uid = data.uid;
    this.transactionid = data.transactionid;
    this.nodes = [];

    let base = path.resolve(__dirname, "../../configs/configs");
    let file = path.resolve(base, `files-formats.json`);
    if (!Fs.existsSync(file)) {
      throw `Files formats description ${file} not found`;
    }

    let res = new RedisStore();
    res.init().then(() => {
      this.prepare()
        .then(() => {
          this.debug("Done! WIll stop later");
          //this.stop();
        })
        .catch((e) => {
          this.warn("Error raised:", e);
          exit(1);
        });
    });
  }

  /**
   * 
   */
  async prepare() {
    new Cache();
    await Cache.load();
    this.sender = await this.yp.await_proc("get_user", this.uid);
    this.service = "mfs.serverimport";
    let model = {
      phase: "prepare",
      progress: 0,
      transactionid: this.transactionid,
    };
    let options = {
      service: this.service,
      tag: this.service,
      message: "PREPARATION",
      transactionid: this.transactionid,
    };
    this._payload = this.payload(model, options);
    //await RedisStore.sendData(this._payload, this.socket_id);
    await this.build();
  }

  /**
   * 
   * @param {*} filename 
   * @param {*} mimetype 
   * @returns 
   */
  get_format(filename, mimetype = "application/octet-stream") {
    let extension = path.extname(filename);
    let name = filename.replace(extension, "");
    extension = extension.replace(/^\./, "").toLowerCase();
    let def = Cache.getFilecap(extension) || {};
    if (extension == "json") {
      if (/\.(skl|drumee)$/.test(name)) {
        def.category = "skeleton";
      } else if (/\.(poll|form)$/.test(name)) {
        def.category = "form";
      }
    }
    if (this.input && this.input.get(Attr.filetype)) {
      def.category = this.input.get(Attr.filetype);
    }
    let c = {
      mimetype,
      extension,
      capability: "---",
      category: Constants.OTHER,
      filename: name,
      ...def,
    };
    return c;
  }

  /**
   * 
   * @param {*} directory 
   * @param {*} parent_id 
   * @param {*} lvl 
   * @param {*} parent_path 
   * @param {*} home_dir 
   */
  async getFilesRecursively(directory, parent_id, lvl, parent_path, home_dir) {
    const filesInDirectory = Fs.readdirSync(directory);
    for (const file of filesInDirectory) {
      const absolute = path.join(directory, file);
      let node = {};
      node.id = uuidv4().substring(0, 8) + uuidv4().substring(0, 8);
      node.parent_id = parent_id;
      node.user_filename = path.parse(absolute).name;
      node.base = path.parse(absolute).base;
      node.filesize = Fs.statSync(absolute).size;
      node.extension = path.parse(absolute).ext.substring(1);
      let mycate = this.get_format(node.user_filename + "." + node.extension);
      node.category = mycate.category;

      node.mimetype = mime.lookup(absolute) || "";
      node.lvl = lvl + 1;
      node.parent_path = path.join(parent_path, "");
      node.file_path = path.join(
        parent_path,
        node.user_filename + "." + node.extension
      );
      node.source = path.join(absolute, "");

      node.destination = path.join(home_dir, node.id);
      node.destination_file = path.join(
        home_dir,
        node.id,
        "/orig." + node.extension
      );

      if (Fs.statSync(absolute).isDirectory()) {
        node.filesize = 1024;
        node.extension = "";
        node.category = "folder";
        node.mimetype = "";
        node.lvl = lvl + 1;
        node.parent_path = path.join(parent_path, "");
        node.file_path = path.join(parent_path, node.user_filename);
        this.nodes.push(node);
        await this.getFilesRecursively(
          absolute,
          node.id,
          node.lvl,
          path.join(node.parent_path, node.user_filename),
          home_dir
        );
      } else {
        this.nodes.push(node);
      }
    }
  }

  /**
   *
   * @param {*} opt
   * @returns
   */
  async send(model, message) {
    if (!this.socket_id) {
      console.error("Error: No destination to send to");
      return;
    }
    this._payload.model = { ...this._payload.model, ...model };
    if (message) {
      this._payload.options.message = message;
    } else if (model.message) {
      this._payload.options.message = model.message;
    }
    //this.debug("AAA:91", this._payload, this.socket_id);
    await RedisStore.sendData(this._payload, this.socket_id);
  }

  /**
   * 
   */
  async build() {
    let source_list = toArray(this.source_list);
    let dest_attr = await this.yp.await_proc(
      "forward_proc",
      this.recipient_id,
      "mfs_access_node",
      `'${this.uid}', '${this.pid}'`
    );
    let {import_dir} = sysEnv();
    let folderPath = import_dir || global.myDrumee.exchangesArea.importFolders;

    for (let source of source_list) {
      let node = {};
      let absolute = path.join(folderPath, source);
      let unique_file = path.parse(absolute).name;
      unique_file = await this.yp.await_proc(
        "forward_proc",
        this.recipient_id,
        "mfs_unique_filename",
        `'${dest_attr.id}', '${unique_file}', '${dest_attr.ext}'`
      );
      node.user_filename = unique_file.user_filename;
      node.id = uuidv4().substring(0, 8) + uuidv4().substring(0, 8);
      node.parent_id = dest_attr.id;
      node.base = path.parse(absolute).base;
      node.filesize = Fs.statSync(absolute).size;
      node.extension = path.parse(absolute).ext.substring(1);
      let mycate = this.get_format(node.user_filename + "." + node.extension);
      node.category = mycate.category;

      node.mimetype = mime.lookup(absolute) || "";
      node.lvl = 0;
      dest_attr.parent_path = dest_attr.parent_path || "";
      dest_attr.filename = dest_attr.filename || "";
      node.parent_path = path.join(dest_attr.parent_path, dest_attr.filename);
      node.file_path = path.join(
        dest_attr.parent_path,
        dest_attr.filename,
        node.user_filename + "." + node.ext
      );
      node.source = path.join(absolute, "");
      node.destination = path.join(dest_attr.home_dir, node.id);
      node.destination_file = path.join(
        dest_attr.home_dir,
        node.id,
        "/orig." + node.extension
      );

      if (Fs.statSync(absolute).isDirectory()) {
        node.filesize = 1024;
        node.extension = "";
        node.category = "folder";
        node.mimetype = "";
        node.file_path = path.join(
          dest_attr.parent_path,
          dest_attr.filename,
          node.user_filename
        );
        node.source = "";
        node.destination = "";
        node.destination_file = "";
        this.nodes.push(node);
        await this.getFilesRecursively(
          absolute,
          node.id,
          node.lvl,
          path.join(node.parent_path, node.user_filename),
          dest_attr.home_dir
        );
      } else {
        this.nodes.push(node);
      }
    }

    let cnt = 0;
    let prorate = 80.0 / this.nodes.length;
    let progres = 0;

    for (var node of this.nodes) {
      cnt++;
      progres = cnt * prorate;

      if (node.category != "folder") {
        shell.mkdir("-p", node.destination);
        //console.log(`source =${node.source}    destination  =${node.destination_file}  } `);
        shell.exec(`/bin/cp -rf  "${node.source}"  "${node.destination_file}"`);

        if (node.category == Attr.document && node.extension != Attr.pdf) {
          let base = path.join(dest_attr.home_dir, node.id, "info.json");
          //console.log(`base =${base}    `);
          shell.exec(`/bin/touch  '${base}' `);
          Jsonfile.writeFileSync(base, "{}");
        }
      }
      await this.send({
        phase: "progres",
        message: "PROGRES",
        progress: progres,
        transactionid: this.transactionid,
      });
    }

    await this.yp.await_proc(
      "forward_proc",
      this.recipient_id,
      "mfs_import",
      `'${stringify(this.nodes)}', '${this.uid}'`
    );
    progres = 90;

    await this.send({
      phase: "progres",
      message: "PROGRES",
      progress: progres,
      transactionid: this.transactionid,
    });

    let recipients = await this.yp.await_proc(
      "entity_sockets",
      this.recipient_id
    );
    recipients = toArray(recipients);

    let keys = { pid: Attr.nid, vhost: "vhost" };
    let service = "media.new";

    for (var node of this.nodes) {
      if (node.lvl == 0) {
        let attr = await this.yp.await_proc(
          "forward_proc",
          this.recipient_id,
          "mfs_access_node",
          `'${this.uid}', '${node.id}'`
        );
        //await RedisStore.sendData(this.payload(keys, { service: "media.new" }), recipients);
        await RedisStore.sendData(
          this.payload(attr, { keys, service }),
          recipients
        );
      }
    }

    await RedisStore.sendData(
      this.payload({}, { service: "notification.resync" }),
      recipients
    );

    progres = 100;

    await this.send({
      phase: "completed",
      message: "COMPLETED",
      progress: progres,
      transactionid: this.transactionid,
    });

    exit(0);
  }
}

new __offline_media_import();
