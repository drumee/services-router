
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const Path      = require('path');
const _         = require('lodash');
const Backbone  = require('backbone');
const fs        = require('fs');
const Shell     = require('shelljs');
const Readline  = require('readline-sync');
const Jsonfile  = require('jsonfile');

const MODULE_BASE  = __dirname.replace("offline/db", "");
const Db           = require(MODULE_BASE + '/core/db/db');


class __patch extends Backbone.Model {
// ========================
// initialize
// 
// ========================
  initialize(opt) {
    this.yp    = new Db({user:process.env.USER});
    // @_pass = @yp.config().password
    this._error = [];
    const filename = Path.resolve(MODULE_BASE, 'dataset', 'offline', 'samples.json');
    this.samples = Jsonfile.readFileSync(filename);
    this._types  = ['hub', 'drumate', 'common', 'patch', 'yp'];
    this._scope  = ['check', '', 'common', 'patch', 'yp'];
    return this._usage  = `Usage : \n \
--source=${this._types.join('|')}/filename[.sql] \n \
--check=drumate|hub|common \n \
--target=common|drumate|hub|yp|'list of db name'\n`;
  }
      
// ========================
  exec(db_name, source, sp, ap) {
    const cmd = `/usr/bin/mysql --database ${db_name} < ${source}`;
    console.log(`[${sp.toFixed(2)}, ${ap.toFixed(2)}] ${source} --> ${db_name} \r`);
    //process.stdout.write("#{source} --> #{db_name} \r")
    //console.log "#{cmd} \r"
    const res = Shell.exec(cmd, {silent:true});
    if (res.code !== 0) {
      console.log(`${db_name} : `, res.stderr); 
      return process.exit(1);
    }
  }

// ========================
  prepare(arg) {
    const source = this.get('source');
    let si = 0;
    for (let s of source) {
      var ap;
      let ai = 0; 
      const sp = (100*si)/source.length;
      if (_.isArray(arg)) {
        for (let a of arg) {
          ap = (100*ai)/arg.length;
          this.exec(a.db_name, s, sp, ap); 
          ai++;
        } 
      } else if (_.isString(arg)) {
        this.exec(arg, s, sp, ap); 
      } else { 
        console.warn("Unexpected argument type", arg);
      }
      si++;
    } 
    //console.log "Done !"
    return this.yp.end();
  }

// ========================
  start() {
    this._error = [];
    // if _.isArray @_target
    //   rows = []
    //   for t in @_target
    //     rows.push {db_name:t}
    //   @prepare rows
    //   return
    const self = this;
    switch (this._target) {
      case 'both': case 'common': 
        return this.yp.query("select db_name from entity where type IN ('drumate', 'hub')", function(e, d, f){
          if (e != null) {
            throw e; 
          }
          return self.prepare(d);
        }); 

      case 'hub': case 'drumate':
        return this.yp.query(`select db_name from entity where type='${this._target}'`, function(e, d, f){
          if (e != null) {
            throw e; 
          }
          return self.prepare(d);
        });

      case 'yp': case 'yellow_page':
        var rows = [{db_name:'yp'}];
        return this.prepare(rows);

      case 'mailserver':
        rows = [{db_name:'mailserver'}];
        return this.prepare(rows);

      default:
        var list = this._target.split(/( |,)+/);
        rows = [];
        for (let t of list) {
          rows.push({db_name:t});
        }
        return this.prepare(rows);
    }
  }

        //@_abort "Invalid target. Must be one of:\n" + @_target.join()

// ========================
  _abort(e) {
    const msg = e || this._usage;
    throw msg;
    return c;
  }

// ========================
  _check_sanity(source) {
    this._error = [];
    if (_.isEmpty(source)) {
      this._abort(this._usage);
    }

    if (!source.match(/\.sql$/i)) {
      source = source + ".sql";
    }

    if (source.match(/^\//)) {
      if (!fs.existsSync(source)) {
        this._abort(`Specified fource file ${source} was not found`);
      }
    }

    return source; 
  }

// ========================
  _select_script(argv){
    let file, filename;
    if (argv.scan) {
      filename=argv.source.replace('*', '');
    } else {
      filename = this._check_sanity(argv.source);
    }
    const target = argv.target || argv.check;
    switch (target) {
      case 'common': case 'both':
        if (argv.scan) {
          filename = '';
        }
        file = Path.resolve(this._schemas_path, 'common', 'procedures', filename);
        break;

      case 'yp': case 'yellow_page':
        if (argv.scan) {
          filename = '';
        }
        file = Path.resolve(this._schemas_path, 'yellow_page', 'procedures', filename);
        break;

      case 'hub': case 'drumate':
        if (argv.scan) {
          filename = '';
        }
        file = Path.resolve(this._schemas_path, target, 'procedures', filename);
        break;

      default: 
        file = Path.resolve(this._schemas_path, filename);
    }

    let dir = Path.dirname(file);
    let source = [file];
    if (argv.scan) { 
      try { 
        if (fs.lstatSync(file).isDirectory()) {
          dir = file;
        }
      } catch (error) {}
      source = [];
      console.log(`[SCANING FROM]...... ${dir}`);
      fs.readdirSync(dir).forEach(function(file){
        if (file.match(/\.sql$/)) {
          console.log("Adding source script.... ", file);
          return source.push(Path.resolve(dir, file));
        }
      });
      this.set({ 
        dir});
    } else {
      if (!fs.existsSync(file)) {
        console.log(`\nFile available from ${dir}:`);
        fs.readdirSync(dir).forEach(file => console.log("  ", file));
        this._abort(`Could not resolve source file ${file}`);
      }
    }

    return this.set({ 
      source,
      target
    });
  }
    //console.log "Using script :\n", source.join('\n')

// ========================
  _select_targets(argv){
    const res = [];
    const {
      target
    } = argv;
    if (argv.check) {
      const s = this.samples[process.env.USER] || {};
      if (['drumate', 'hub', 'common'].includes(argv.check)) {
        if (s[argv.check]) {
          return s[argv.check];
        }
        this._abort("No sample db for checking ", s); 
      }
      this._abort();
    }
    return target;
  }

// ========================
  parse(argv){
    if (argv.schemas != null) {
      this._schemas_path = argv.schemas;
    } else {
      this._schemas_path = process.env.SCHEMAS_PATH;
    }
    console.log(`Using schemas from ${this._schemas_path} `);
    if (_.isEmpty(this._schemas_path)) {
      throw "schemas_path must bet specified";
    }

    this._select_script(argv);
    return this._target = this._select_targets(argv);
  }
}
module.exports = __patch;

// ========================
const start = function(){
  let e, msg, target;
  const p = new __patch();
  const argv  = require('minimist')(process.argv.slice(2));

  if (argv.source.match(/\*$/)) {
    argv.scan = 1;
  }

  try { 
    p.parse(argv);

  } catch (error) { 
    e = error;
    console.log(e); //.join('\n')
    process.exit(1);
  }

  if (_.isArray(p._target)) {
    target = p._target.join(' ');
  } else { 
    target = p._target;
  }
  const s = p.get('source');

  if (argv.scan) {
    msg = `ALL FILES FROM [${p.get('dir')}]`;
  } else { 
    msg = `[${s[0]}]`;
  }
  msg = `\n \
This shall apply ${msg} on [${target}]`;

  console.log(msg); 
  const res = Readline.question("Are you sure ? [Y/N]");

  if (!(['yes', 'Y', 'oui', 'O'].includes(res))) {
    console.log("\n..... Patch aborted !\n");
    process.exit(1);
  }
  
  try { 
    return p.start();

  } catch (error1) { 
    e = error1;
    return console.log("ERROR RAISED", e);
  }
};

start();