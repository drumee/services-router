#!/usr/bin/env node
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const _ = require('lodash');
const fs = require('fs');
const shell = require('shelljs');
const Db = require('@drumee/server-essentials/mariadb');
const Path = require('path');
const yp   = new Db({ user: process.env.USER, verbose : 0});
const Minimist  = require('minimist');
const argv = Minimist(process.argv.slice(2));
const {Offline, Cache, Mariadb} = require('@drumee/server-essentials');

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
    this.cache = new Cache({ lang: 'en' });
    this.yp = new Mariadb({ user: process.env.USER });
    this.uid = argv.uid;
    this.output = argv.output;

    console.log(`SCANNING CONTENT FOR USER ${argv.uid} `, this.output);
    if (_.isEmpty(this.uid) || _.isEmpty(this.output)) {
      console.log("USAGE : --uid=uid_or_ident --output=/path/to/restore");
      process.exit(1);
    }
    if (!fs.existsSync(this.output)) { 
      shell.mkdir('-p', this.output);
    }
    let f = async() => {
      console.log("Scanning vfs wise....");
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
    let user = await yp.await_proc("get_entity", uid); 
    console.log("READING FOR .... ", user, this.uid);
    if(_.isEmpty(user)) throw `User database not found : ${uid}`;

    let dir = Path.resolve(user.home_dir, '__storage__');
    if (!fs.existsSync(dir)) { 
      throw `User data dir not found : ${dir}`;
    }
    fs.readdirSync(dir).forEach(function (nid) {
      entities.push(nid);

      //console.log("FOUND.... ", nid);
      // if(/(dont)|(safety)|(remove)/.test(id)){
      //   console.log("SKIP.... ", id);
      // }else{
      //   entities.push({dir, id});
      // }
    });
    for(let nid of entities){
      let file = await yp.await_proc(`${user.db_name}.mfs_node_attr`, nid); 
      if(file.file_path){
        let f = file.file_path.split('/');
        let ext = f.pop()
        f=f.join('/')
        let dest = Path.join(this.output, f);
        if(!fs.existsSync(dest)){
          shell.mkdir('-p', dest);
        }
        // console.log("ZZZZZZZZZZZZ.... ", `${dir}/${file.id}/orig.${file.extension}`);
        let orig = Path.join(dir, `${file.id}/orig.null`);
        if(fs.existsSync(orig)){
          let dest =  Path.join(dir, `${file.id}/orig.${file.extension}`)
          if(orig !== dest){
            console.log("AAA", orig, '-->', dest);
            shell.mv(orig, dest);
          }
          // orig = Path.join(dir, `${file.id}/orig.null`);
          // let orig = Path.join(dir, `${file.id}/orig.${file.extension}`);
        };
        // if(fs.existsSync(orig)){
        //   // console.log("ZZZZZZZZZZZZ.... ", this.output, `${file.filename}.${file.extension}`);
        //   let output = Path.join(this.output, `${file.filename}.${file.extension}`);
        //   console.log("FOUND.... ", orig, '--->', output);  
        //   shell.cp(orig, output);
        // }else{
        //   console.log("NOT FOUND.... ", orig); 
        // }
        //let output = Path.join(this.output, file.filename, '.', file.extension);
        //console.log("FOUND.... ", file.file_path);  
      }
    }

  }

  error(e) {
    console.log("ERROR.... ", e);
  }

}

new __scann();
