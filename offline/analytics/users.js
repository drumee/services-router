#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
//const argv      = Minimist(process.argv.slice(2));
const {Mariadb, Logger} = require('@drumee/server-essentials');

class __analytics_users extends Logger {



  // ========================
  // initialize
  // ========================
  initialize() {
    this.yp = new Mariadb({user: process.env.USER });
    this.go();
    const argv = Minimist(process.argv.slice(2));
  }

  async go(){

    let users_count = function(s, e){
      let condition = `email not like "%drumee%" and status='active' and email not like "%xialia%" and ctime > ${s} and ctime < ${e}`;
      return `select count(*) as c from drumate inner join entity using(id) where ${condition}`;
    }

    let ts = await this.yp.await_query('select unix_timestamp() as now');
    let end = ts.now; //week = 60*60*24*7 / 2628000 = month
    let res;
    let time;
    let ptime;
    var nUsers = [];
    var date = [];
      for (let start = 1552296684; start < end; start = start + 2628000) {
        time = new Date(start * 1000);
        ptime = time.getDate()+ "/" +(time.getMonth()+1)+ "/" +time.getFullYear();
        res = await this.yp.await_query(users_count(start, end));
        this.debug(ptime ,'-->', res);

        nUsers.push(res.c);
        date.push(ptime);

      }
      nUsers.reverse();
      var total = [date, nUsers];
      this.debug(total);
  }
  
}

        //abs = date (start)
        //ord = users (res)

new __analytics_users();
module.exports = __analytics_users;
