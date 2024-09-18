#!/usr/bin/env node
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const _ = require('lodash');
const fs = require('fs');
const shell = require('shelljs');
const {Mariadb, Cache, Offline, toArray} = require('@drumee/server-essentials');
const Path = require('path');

class __scan extends Offline{
  // ========================
  // initialize
  // 
  // ========================
  constructor(...args) {
    super(...args);
  }

  initialize(opt) {
    const self = this;
    this.yp = new Mariadb({ user: process.env.USER });
    this.data_dir = process.env.DRUMEE_DATA_DIR;
    console.log(`CREATING ENTITY SCHEMAS FROM ${this.data_dir} `, opt);
    if (_.isEmpty(this.data_dir)) {
      throw "DRUMEE_DATA_DIR must bet set. Consider issuing shell invocation `source /etc/drumee/drumee.sh`";
    }
    //this.scan_entities_wise();
    //let entities = this.scan_entities_wise();
    //console.log("éentities", entities);
    let f = async() => {
      console.log("Scanning vfs wise....");
      await Cache.load(this.yp);
      let entities = await this.scan_entities_wise();
      let hubs = await this.clean_orphaned_entities(entities);
      let files = await this.scan_hubs_wise(hubs);
      let nodes = await this.clean_orphaned_nodes(files);
      console.log("ZZZZZZZZZ", nodes);
      return nodes;
    }
    f().then(yp.end).catch(self.error);
    // this.sync_hub_wise()
  }

  // ========================
  // Scann from vfs content
  // ========================
  async scan_entities_wise() {
    const entities = [];
    const folders = [];
    folders.push(Path.resolve(this.data_dir, 'mfs', 'community'));
    folders.push(Path.resolve(this.data_dir, 'mfs', 'drumate'));
    folders.push(Path.resolve(this.data_dir, 'mfs', 'hub'));
    folders.push(Path.resolve(this.data_dir, 'mfs', 'site'));
    folders.push(Path.resolve(this.data_dir, 'mfs', 'user'));
    for (var dir of folders) {
      fs.readdirSync(dir).forEach(function (id) {
        if(/(dont)|(safety)|(remove)/.test(id)){
          console.log("SKIP.... ", id);
        }else{
          entities.push({dir, id});
        }
      });
    }
    return entities;
  }

  // ========================
  // remove content whitout entity record
  // ========================
  async clean_orphaned_entities(entities) {
    let hubs = [];
    for(let e of entities){
      let entity = await yp.await_proc("get_entity", e.id);
      if(_.isEmpty(entity)){
        let src = `${e.dir}/${e.id}`;
        let dest = src.replace('/mfs/', '/mfs.zombies/');
        //console.log(`REMOVING ORPHANED ENTITY = ${src} -> ${dest}`);
        let p = dest.split('/');
        p.pop();
        dest = p.join('/');
        if (!fs.existsSync(dest)) { 
          shell.mkdir('-p', dest);
        }
        try {
          //console.log(`mv ${src} ${dest}`);
          console.log(`REMOVING ORPHANED ENTITY = ${src} -> ${dest}`);
          shell.mv(src, dest);
        }
        catch (err) {
          console.error(`FAILED TO CLEAN = ${src} -> ${dest}`);
          continue;
        }
      }else{
        hubs.push(entity);
      }
    }
    return hubs;
  }

  // ========================
  // remove content whitout entity record
  // ========================
  async scan_hubs_wise(hubs) {
    let vfiles = [];
    hubs = toArray(hubs);
    for (let hub of hubs) {
      let dir;
      try{
        dir = Path.resolve(hub.home_dir, '__storage__');
        fs.readdirSync(dir).forEach(function (id) {
          if(/(dont)|(safety)|(remove)/.test(id)){
            console.log("SKIP.... ", id);
          }else{
            vfiles.push({id, db_name:hub.db_name, dir});
          }
        });
        //console.log("QQQQQQQQQQQQQQ.... ", dir);
      }catch(e){
        continue;
      }
    }
    return vfiles;
  }

  // ========================
  // remove content whitout entity record
  // ========================
  async clean_orphaned_nodes(nodes) {
    let s = [];
    for(let n of nodes){
      let sql = `SELECT id FROM ${n.db_name}.media WHERE id='${n.id}'`;
      let node = await yp.await_query(sql);
      if(_.isEmpty(node)){
        let src = `${n.dir}/${n.id}`;
        let dest = src.replace('/mfs/', '/mfs.zombies/');
        let p = dest.split('/');
        p.pop();
        dest = p.join('/');
        console.log(`KDIR ${dest}`);
        if (!fs.existsSync(dest)) { 
          shell.mkdir('-p', dest);
        }
        try {
          console.log(`mv ${src} ${dest}`);
          // console.log(`REMOVING ORPHANED ENTITY = ${src} -> ${dest}`);
          shell.mv(src, dest);
        }
        catch (err) {
          console.error(`FAILED TO CLEAN = ${src} -> ${dest}`);
          continue;
        }
      }
    }
    return s;
  }

  error(e) {
    console.log("ERROR.... ", e);
  }

}

new __scan();

