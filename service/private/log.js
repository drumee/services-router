// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/yp
//   TYPE  : module
// ================================  *
const { Attr,Events } = require("@drumee/server-essentials");

const { DENIED } = Events;
const { isEmpty, last } = require("lodash");
const { join } = require("path");
const { readFile } = require("fs");

/** ================================= */
const yp = require("../yp");
class __private_log extends yp {
  constructor(...args) {
    super(...args);
    this.special_access = this.special_access.bind(this);
    this.read = this.read.bind(this);
  }

  /**
   * 
   * @returns 
   */
  special_access() {
    return this.yp.call_proc(
      "get_visitor",
      this.uid,
      function () {
        const data = this.get_row(arguments);
        if (parseInt(data.remit) < 2) {
          this.notice("Improper remit");
          this.trigger(DENIED);
          return;
        }
        return this._done();
      }.bind(this)
    );
  }

  /**
   * 
   */
  read() {
    const debug = join(
      process.env.log_dir,
      process.env.instance_name,
      "debug.log"
    );
    const page = ~~this.input.use(Attr.page, 1);
    let res = [];
    readFile(debug, (err, data) => {
      if (err) throw err;
      const array = data.toString().split("\n");
      const start = page * 20;
      const end = (page + 1) * 20;
      while (isEmpty(last(array))) {
        array.pop();
      }
      let obj;
      var i = start;
      //console.log(`p=${page} s=${start}, e=${end}`)
      for (let line of array.reverse()) {
        if (i < end) {
          obj = this.parseJSON(line);
          // if(obj.module !== this.constructor.name){
          res.push(obj);
          i++;
          // }
        }
      }
      this.output.data(res);
    });
  }
}

module.exports = __private_log;
