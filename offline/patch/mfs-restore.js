#!/usr/bin/env node
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const Stringify = require('json-stringify');
const _ = require('lodash');
const fs = require('fs');
const Path = require('path');
const Minimist  = require('minimist');
const argv = Minimist(process.argv.slice(2));
const {Offline, Cache, Mariadb} = require('@drumee/server-essentials');
const yp   = new Mariadb({ user: process.env.USER, verbose : 0});

class __scann extends Offline {
  // ========================
  // initialize
  // 
  // ========================
  constructor(...args) {
    super(...args);
  }

  initialize(opt) {
    const self = this;
    new Cache({ lang: 'en' });
    this.yp = new Mariadb({ user: process.env.USER });
    this.uid = argv.uid;
    this.pid = argv.pid;

    console.log(`SCANNING CONTENT FOR USER ${argv.uid} `, argv.pid);
    if (_.isEmpty(this.uid) || _.isEmpty(this.pid)) {
      console.log("USAGE : --uid=uid_or_ident --pid=parent_pid");
      process.exit(1);
    }
    let f = async() => {
      console.log("Scanning vfs wise....");
      await Cache.load(yp);
      await this.mfs_dump(argv.uid);
    }
    f().then(yp.end).catch(self.error);
  }

  // ========================
  // Scann from vfs content
  // ========================
  async mfs_dump(uid) {
    const entities = [];
    const files = [];
    // folders.push(Path.resolve(this.data_dir, 'mfs', 'user', uid, '__storage__'));
    let user = await yp.await_proc("get_user", uid); 
    console.log("READING FOR .... ", uid);
    if(_.isEmpty(user)) throw `User database not found : ${uid}`;

    let dir = `/data/mfs/user/${user.id}/__storage__`;
    if (!fs.existsSync(dir)) { 
      throw `User data dir not found : ${dir}`;
    }
    fs.readdirSync(dir).forEach(function (nid) {
      entities.push(nid);

      // console.log("FOUND.... ", nid);
      // if(/(dont)|(safety)|(remove)/.test(id)){
      //   console.log("SKIP.... ", id);
      // }else{
      //   entities.push({dir, id});
      // }
    });
    let top_node = await yp.await_proc(`${user.db_name}.mfs_node_attr`, this.pid);
    if(_.isEmpty(top_node)) throw `Parent node not found ${uid} is `;
    for(let nid of entities){
      let file = await yp.await_proc(`${user.db_name}.mfs_node_attr`, nid); 
      if(file.file_path){
        // let f = file.file_path.split('/');
        // f.pop();
        // f = _.filter(f);
        // let p = Stringify(f);
        // let fpath=f.join('/');
        let fpath = file.file_path.replace(/__trash__\/UX/g, '');
        let f = fpath.split('/');
        f.pop();
        f = _.filter(f);
        let p = Stringify(f);
        if(!fpath) continue;
        fpath=f.join('/');
        fpath = Path.join('/', `${fpath}.folder`);
        let dest = await yp.await_query(
          `SELECT id FROM ${user.db_name}.media WHERE file_path="${fpath}"`);
        //console.log("", nid, file.file_path, dest.id, fpath, p);
        if(_.isEmpty(dest)){
          dest = await yp.await_proc(`${user.db_name}.mfs_make_dir`, this.pid, p, 1);

        }
        if(dest.id !== file.parent_id && nid && dest.id){
          console.log("MOIBG", nid, dest.file_path, dest.id);
          await yp.await_proc(`${user.db_name}.mfs_move`, nid, dest.id);
        }

      //  if(dest.id !== file.parent_id && !/^\/__trash__/.test(fpath)){
      //     //var h = file.file_path.replace(/__trash__\/UX/g, '');
      //     console.log("", nid, file.file_path, dest.id, fpath);
      //   }
        // if(_.isEmpty(dest)){
        //   dest = await yp.await_proc(`${user.db_name}.mfs_make_dir`, this.pid, p, 1);
        // }
        // // console.log("FOUND.... ", file.filetype, nid,f[0]);
        // if(f[0]=='UX'){
        //   if(dest.id !== file.parent_id){
        //     console.log("FOUND.... ", fpath, file.filetype, nid, '-->' , dest.id, file.parent_id);
        //     await yp.await_proc(`${user.db_name}.mfs_move`, nid, dest.id);
        //   }else{
        //     console.log("FOUND.... SAME PARENT", nid, file.parent_id);
        //   }
        // }else{
        //   console.log("SKIPPING.... ", nid, file.file_path);
        // }
        // await yp.await_proc(`${user.db_name}.mfs_make_dir`, this.pid, p, 1);
        //await yp.await_proc("mfs_make_dir", this.pid, '["a","b"]', 1);

        // if(/^(\/UX\/)/.test(f[0])){
        //   console.log("FOUND.... ", nid, p);  
        // }
        // f=f.join('/')
        // let dest = Path.join(this.output, f);
      }
    }
    console.log("DONE !!! ");

  }

  error(e) {
    console.log("ERROR.... ", e);
    process.exit(1);
  }

}

new __scann();
