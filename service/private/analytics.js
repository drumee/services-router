// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/yp
//   TYPE  : module
// ================================  *
const { Attr, Constants, sysEnv } = require("@drumee/server-essentials");
const { main_domain } = sysEnv();
const { DENIED } = Constants;

const { isArray } = require("lodash");
const { join } = require("path");

/** ========================================= */
const Locale = require("../locale");
class __private_analytics extends Locale {
  /**
   * Platform privilege required
   */
  special_access() {
    this.yp.call_proc(
      "get_visitor",
      this.uid,
      function (data) {
        if (parseInt(data.remit) < 2) {
          this.debug("IMPROper remit");
          this.trigger(DENIED);
          return;
        }
        this._done();
      }.bind(this)
    );
  }

  /**
   * 
   */
  async users() {
    let users_count = function (s, e) {
      let condition = `
        email not like "%drumee%" and status='active' and email not like "%xialia%" 
        and ctime >= ${s} and ctime <= ${e}
      `;
      return `
        WITH data AS (SELECT FROM_UNIXTIME(ctime, '%y-%m-%d') day, 
        count(*) as drumates FROM drumate INNER JOIN entity USING(id) WHERE ${condition}
        GROUP BY day ORDER BY day ASC) 
        SELECT day AS date, sum(drumates) over (order by day) AS users FROM data
      `;
    };

    let ts = await this.yp.await_query("select unix_timestamp() as now");
    let END = ts.now; //week = 60*60*24*7 / 2628000 = month
    let START = END - 60 * 60 * 24 * 365 * 2;
    var rows = await this.yp.await_query(users_count(START, END));
    this.output.list(rows);
  }

  /**
   *
   */
  async transfer(local_use = 0) {
    let hub = await this.yp.await_proc(
      "get_hub",
      `transfer.${main_domain}`
    );
    let vars = this.input.get(Attr.vars) || {};
    let size = await this.yp.await_proc(
      `${hub.db_name}.analytic_transfer_size`,
      vars.params
    );
    let sender = await this.yp.await_proc(
      `${hub.db_name}.analytic_transfer_sender`,
      vars.params
    );
    let download = await this.yp.await_proc(
      `${hub.db_name}.analytic_transfer_dl`,
      vars.params
    );
    let data = { size, sender, download };
    if (vars.output == Attr.file) {
      let format = this.parseDate();
      await this.writeXlsxFile(size, format, vars);
      return;
    }
    if (local_use) return data;
    this.output.data(data);
  }

  /**
   *
   */
  async hub_stats() {
    let vars = this.input.get(Attr.vars) || {};
    let usage = await this.yp.await_proc(`analytic_hub_usage`, vars.params);
    let users = await this.yp.await_proc(`analytic_hub_users`, vars.params);
    this.output.data({ usage, users });
  }

  /**
   *
   */
  async drumates() {
    let total = await this.yp.await_proc(`analytic_drumates`, {});
    let hub = await this.yp.await_proc(`analytic_hub_users`, {});
    this.output.data({ total, hub });
  }

  /**
   *
   */
  parseDate() {
    const Moment = require("moment");
    let { start, end } = this.input.need("date");
    let format = "YY-MM-DD";
    let d1 = `${start.yy}-${start.mm}-${start.dd}`;
    let xd1 = Moment(d1, format).unix();
    let d2;
    let time_format = "%y-%m-%d";
    if (!end) {
      d2 = Moment(xd1 + 86400, "X").format(format);
    } else {
      d2 = `${end.yy}-${end.mm}-${end.dd}`;
    }
    let xd2 = Moment(d2, format).unix();
    let type = Attr.day;
    if (xd2 - xd1 <= 86400) {
      d1 = `${Moment(xd1, "X").format(format)} 00`;
      d2 = `${Moment(xd1 + 86400, "X").format(format)} 00`;
      time_format = `${time_format} %H`;
      type = Attr.hour;
    } else {
      d1 = `${Moment(xd1, "X").format(format)}`;
      d2 = `${Moment(xd2, "X").format(format)}`;
      time_format = `${time_format}`;
    }
    return {
      start: d1,
      end: d2,
      type,
      time_format,
    };
  }

  /**
   *
   * @param {*} data
   */
  async writeXlsxFile(data, format, vars = {}) {
    //this.debug(`AAA:138`, data.length);
    //let format = this.parseDate();
    let title = vars.title || "Drumee Analytics";
    let view = this.input.need(Attr.view);
    if (format.type == Attr.day) {
      delete view.hour;
    } else {
      delete view.day;
    }
    let node = await this.db.await_proc(
      "mfs_access_node",
      this.uid,
      this.input.need(Attr.nid)
    );
    const xl = require("excel4node");
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet(title);
    let i = 0;
    let Media = require("../media");
    let media = new Media({ session: this.session });
    media.mfs_root = node.mfs_root;
    let filename = join(
      process.env.DRUMEE_TMP_DIR,
      `${this.randomString()}.xlsx`
    );
    // Create a reusable style
    var label_style = wb.createStyle({
      font: {
        color: "#FF0800",
      },
    });
    var data_style = wb.createStyle({
      font: {
        color: "#5508FF",
      },
      //numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
    // var date_style = wb.createStyle({
    //   font: {
    //     color: '#9908FF',
    //   },
    //   numberFormat: 'yy-mm-dd'
    // });
    if (data.length) {
      for (var key in view) {
        i++;
        this.debug(`170: ROW=${key}`, filename, i);
        let j = 1;
        ws.cell(i, j).string(view[key]).style(label_style);
        for (var line of data) {
          let value = 0;
          j++;
          value = line[key];
          //this.debug('AAA:102', line, typeof (value), value);
          switch (typeof value) {
            case "string":
              ws.cell(i, j).string(value).style(data_style);
              break;
            case "number":
              ws.cell(i, j).number(value).style(data_style);
              break;
            default:
              ws.cell(i, j).number(0).style(data_style);
              break;
          }
        }
      }
    } else {
      ws.cell(1, 1).string("No data was found").style(label_style);
    }
    ws.column(1).setWidth(25);
    const Moment = require("moment");
    wb.write(filename, async () => {
      let fn = Moment(Moment.now() / 1000, "X").format("YYYY-MM-DD hh:mm");
      await media.store(node.pid, filename, `${fn}.xlsx`, (item) => {
        this.output.data(item);
      });
    });
  }

  /**
   *
   */
  async extract_transfer() {
    let vars = this.input.get(Attr.vars) || {};
    this.debug("AAA:198", vars);
    let host = vars.host;
    let hub;
    if (host) {
      hub = await this.yp.await_proc("get_hub", host);
    }
    let procedure = vars.type || "analytic_transfer_average";
    if (hub && hub.db_name) {
      procedure = `${hub.db_name}.${procedure}`;
    }
    let format = this.parseDate();
    if (vars.params && isArray(vars.params.domains)) {
      if (!vars.params.domains.includes(main_domain)) {
        vars.params.domains.push(main_domain);
      }
    }
    let data = await this.yp.await_proc(procedure, {
      ...vars.params,
      ...format,
    });
    await this.writeXlsxFile(data, format, vars);
  }

  async visits() {
    let vars = this.input.get(Attr.vars) || {};
    let data = await this.yp.await_proc(`analytic_visit`, vars);
    this.output.data(data);
  }

  async origin_visits() {
    let vars = this.input.get(Attr.vars) || {};
    let data = await this.yp.await_proc(`analytic_origin_visit`, vars);
    this.output.data(data);
  }

  async tracking_button() {
    let vars = this.input.get(Attr.vars) || {};
    let data = await this.yp.await_proc(`analytic_tracking_button`, vars);
    this.output.data(data);
  }
}

module.exports = __private_analytics;
