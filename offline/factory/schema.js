// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");
const { isEmpty } = require("lodash");
const { existsSync, mkdirSync, rmSync } = require("fs");
const { exec } = require("shelljs");
const { ID_NOBODY } = require("@drumee/server-essentials/lex/constants");
const { check_safety } = require("@drumee/server-core").MfsTools;
const { resolve } = require("path");
const { Mariadb, Logger, sysEnv } = require("@drumee/server-essentials");


class __schema extends Logger {
  constructor(...args) {
    super(...args);
    this.initialize = this.initialize.bind(this);
    this.create_media_root = this.create_media_root.bind(this);
    this.create_vfs_root = this.create_vfs_root.bind(this);
    this.create_entity = this.create_entity.bind(this);
    this.delete_entity = this.delete_entity.bind(this);
    this.load_sql = this.load_sql.bind(this);
  }

  /**
   * 
   * @param {*} opt 
   */
  async initialize(opt) {
    this.yp = this.get("yp") || new Mariadb();
    this.schemas_dir = this.get("schemas");
    console.log(`CREATING ENTITY SCHEMAS `);
    if (isEmpty(this.get(Attr.type))) {
      throw "attribute type must bet set";
    }
  }


  /**
   * 
   * @returns 
   */
  async create_media_root() {
    let args = {
      owner_id: ID_NOBODY,
      filename: "",
      pid: "0",
      category: "root",
      ext: "root",
      mimetype: "special",
      filesize: 0,
      showResults: 1
    };
    let results = { isOutput: 1 };
    let root = await this.db.await_proc("mfs_create_node", args, {}, results);
    let sql = `UPDATE entity SET home_id='${root.id}' WHERE db_name='${this.entity.db_name}'`;
    await this.yp.await_query(sql);
    return root;
  }

  /**
   * 
   * @returns 
   */
  async create_vfs_root() {
    const { system_user, system_group } = sysEnv();
    const { home_dir, db_name } = this.entity;
    console.log(
      `----- CREATING ROOT for ${system_user}:${system_group} at ${home_dir}-------------\n`
    );
    this.db = new Mariadb({ name: db_name, user: process.env.USER });

    try {
      let dir = resolve(home_dir, "__storage__");
      mkdirSync(dir, { recursive: true });
      let cmd = `chown -R ${system_user}:${system_group} ${home_dir}`;
      let res = exec(cmd, { silent: true });
      if (res == null || res.code !== 0) {
        console.log(`FAILED TO RUN **${cmd}**`, res.stderr);
        return false;
      }
    } catch (e) {
      console.error(`Failed to create mfs storage ${home_dir}`);
      return false;
    }
    let r = await this.create_media_root();
    if (isEmpty(r) || !existsSync(r.home_dir)) {
      return false;
    }
    return true;
  }

  // ========================
  // create_entity
  // ========================
  async create_entity() {
    const type = this.get(Attr.type);
    console.log(`CREATING ENTITY IDENT WITH TYPE =${type}`);
    if (!["hub", "drumate"].includes(type)) {
      console.error(`${type} IS NOT UNSUPPORTED. Please, use [drumate|hub]`);
      return;
    }
    this.entity = await this.yp.await_proc("entity_create", type);
    let res = false;
    if (isEmpty(this.entity)) {
      await this.delete_entity("FAILED CREATE ENTITY");
    } else {
      res = await this.load_sql();
      if (!res) return;
      res = await this.create_vfs_root();
    }
    const { id, db_name, home_id } = this.entity;
    let sql = `UPDATE entity SET settings=JSON_SET(settings, "$.pool_state", "clean") WHERE id='${id}'`;
    await this.yp.await_query(sql);
    console.log(`DONE id=${id}, db_name=${db_name}`);
    return res;
  }

  // ========================
  //
  // ========================
  async delete_entity(reason) {
    const ident = this.get(Attr.ident);
    if (isEmpty(this.entity)) {
      console.error(`NOTHING TO DELETE`);
      return;
    }
    if (this.entity.id) {
      console.error(
        `DELETING ENTITY ID = ${this.entity.id} due to [${reason}]`
      );
      let node = await this.yp.await_proc("entity_delete", this.entity.id);
      check_safety(node.home_dir);
      console.log(`CLEANING UP ENTITY home_dir = ${node.home_dir}`);
      rmSync(node.home_dir, { recursive: true, force: true });
      throw `roll back on ${ident}`;
    }
  }
  //db.query options, copy_file

  // ========================
  // load_sql
  // Creates a database.
  // ========================
  async load_sql() {
    const { db_host } = this.entity;
    const { db_name } = this.entity;
    const type = this.get(Attr.type);

    const script =
      this.get("script") || resolve(__dirname, "template", `${type}.sql`);
    console.log(`Loading ${script} INTO ${db_name}...`);
    const cmd = `/usr/bin/mysql ${db_name} < ${script}`;

    //console.log(`${cmd}`);
    const res = exec(cmd, { silent: true });
    if (res == null || res.code !== 0) {
      console.error(`FAILED TO RUN **${cmd}**`, res.stderr);
      return false;
    }

    return true;
  }
}

module.exports = __schema;
