#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
const { exit } = require('process');
const Jsonfile = require('jsonfile');
const Path = require('path');
const Fs = require("fs");
const SEPARATOR = /[ ,.:;?!\/\-\_\$\&\'\"\\|\@=+\t\n\r\f\)\(\[\]\’\`]+/;
const tesseract = require("node-tesseract-ocr");
const { remove_item } = require('@drumee/server-core').MfsTools;
const {Mariadb, Attr, Offline} = require('@drumee/server-essentials');

class __seo_indexer extends Offline {


  // ========================
  // initialize
  // ========================
  initialize() {
    const argv = Minimist(process.argv.slice(2));
    let node;
    try {
      node = JSON.parse(argv._[0]);
      //console.log(node);
    } catch (e) {
      console.error("Failed to parse arguments", e);
      exit(1);
    }
    let db_name = node.actual_db || node.db_name;
    this.db = new Mariadb({ name: db_name });
    this.node = node;
    // Logger.debug(`START`);
    this.syslog(`START INDEXING ${node.filename}`);
    if (![Attr.document, Attr.image].includes(node.filetype)) {
      this.syslog('Unsupported file type', node.filetype);
      process.exit(1);
    } else {
      this.parse(node).then().catch((e) => {
        this.stop(e);
      });
    }

  }


  /**
   * 
   * @param {*} a 
   */
  stop(a) {
    if (!a) {
      this.syslog('INDEXING DONE', this.node.filename);
    } else {
      this.syslog('STOP INDEXING DUE TO ERROR', a);
    }
    super.stop(a);
    process.exit();
  }
  /**
   * 
   */
  fromImage(src, index) {
    if (!Fs.existsSync(src)) {
      this.syslog(`Source file not found *${src}*`);
    }
    const config = { lang: "eng", oem: 1, psm: 11 } //see docs to config
    tesseract
      .recognize(src, config)
      .then((text) => {
        console.log("Result:", text);
        Fs.writeFileSync(index, text, 'utf8');
      }).catch((e) => {
        this.syslog(`Failed to convert *${src}* ${e.toString()}`);
      })
  }

  /**
   * 
   */
  fromPdf(src, index) {
    if (Fs.existsSync(src)) {
      let cmd = `/usr/bin/pdftotext ${src} ${index}`;
      this.syslog(`RUN CMD = ${cmd}`);
      this.exec(cmd);
    } else {
      this.stop(`Could not find source file ${src}`);
    }
  }

  /**
   * 
   * @param {*} file 
   */
  async parse(node) {
    const mfs_dir = Path.resolve(node.mfs_root, node.id);
    let index = Path.join(mfs_dir, `index.txt`);
    let src = Path.resolve(mfs_dir, `orig.${node.extension}`);
    let attr = await this.db.await_proc('mfs_access_node', node.uid, node.id);
    switch (node.extension) {
      case 'pdf':
        if (node.file && Fs.existsSync(node.file)) {

          //pdfinfo
          /*
            var pdf = PDF(node.file);
            pdf.info(function(err, meta){
              if (err) throw err;
              console.log('pdf info', meta.pdf_version);
            })
              if (meta.pdf_version >= 1.4) {
                cmd = `/usr/bin/pdftotext ${node.file} ${index}`;
                this.exec(cmd);
              }
          */

          var input = mfs_dir + '/orig.pdf';
          pdf2img.setOptions({
            type: 'jpg',
            size: 1024,
            density: 600,
            outputdir: mfs_dir + Path.sep + 'jpgout',
            outputname: null,
            page: null
          });

          pdf2img.convert(input, function (err, info) {
            if (err) console.log(err)
            else console.log(info);
          });

          node.file = mfs_dir + Path.sep + 'jpgout' + Path.sep + 'orig_1.jpg';
          const config = { lang: "eng", oem: 1, psm: 11 } //see docs to config
          tesseract
            .recognize(node.file, config)
            .then((text) => {
              console.log("Result:", text);
              Fs.writeFileSync(index, text, 'utf8');
            })
        }
        break;
      case 'html':
      case 'csv':
      case 'json':
      case 'log':
        this.fromPdf(src, index);
        break;
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
      case 'doc':
      case 'docx':
        src = Path.resolve(mfs_dir, `preview.pdf`);
        if (Fs.existsSync(src)) {
          this.fromPdf(src, index);
        } else {
          let cmd = Path.resolve('.', 'to-pdf.js');
          let args = {
            node,
            uid: this.uid,
            noSocket: 1
          };
          Shell.exec(`${cmd} '${JSON.stringify(args)}'`);
          this.syslog(`Converting to pdf with\n ${cmd} '${JSON.stringify(args)}'`);
          //Spawn(cmd, [JSON.stringify(args)]);
        }
        break;
      //OCR
      case 'png':
      case 'jpg':
        this.fromImage(src, index);
        break;
      default:
        this.stop(`Unsupported file extension (${node.extension})`);
        return;
    }

    if (!Fs.existsSync(index)) {
      this.stop(`file not found ${index}`);
      return;
    }

    let doc = Fs.readFileSync(index, 'utf8');
    let newwords = doc.toLowerCase();
    let words = newwords.split(SEPARATOR).filter((e) => {
      if (!e) return false;
      if (e.length <= 2) return false;
      return (/\w/.test(e));
    });
    //let lexicon = sw.fr;
    //if (node.lang && sw[node.lang]) lexicon = sw[node.lang];
    //let words = sw.removeStopwords(oldwords, sw.fr);
    //console.log("GOT WORDS", attr);
    let data = [];
    words.map((w) => {
      data.push({ word: w, hub_id: node.hub_id, nid: node.id });
    });
    if (attr.file_path != null) {
      let p = attr.file_path.split(/\/+/);
      p.map((w) => {
        data.push({ word: w, hub_id: node.hub_id, nid: node.id });
      });
    }
    await this.db.await_proc("seo_index", JSON.stringify(data));
    await this.db.await_proc("seo_register", node.hub_id, node.id, JSON.stringify(attr));
    let info = Path.join(mfs_dir, `info.json`);
    let json = Jsonfile.readFileSync(info);
    json.index = new Date().getTime();
    Jsonfile.writeFileSync(info, json);
    remove_item(index, 1);
    this.stop();
  }
}

new __seo_indexer();
module.exports = __seo_indexer;
