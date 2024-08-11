
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/lib/socket
//   TYPE  : module
// ================================  *

const { isArray, isEmpty } = require('lodash');
const { toArray, Logger, Attr, Events } = require('@drumee/server-essentials');
const { WORKER_READY } = Events;
const { User, Data } = require('@drumee/server-core');

class __websocket extends Logger { //Db #Entity


  constructor(...args) {
    super(...args);
    this.echo = this.echo.bind(this);
    this.sendTo = this.sendTo.bind(this);
    this.forward = this.forward.bind(this);
  }

  /**
   * 
   * @param {*} router 
   * @param {*} connection 
   * @param {*} args 
   * @param {*} origin 
   * @returns 
   */
  initialize(router, connection, args, origin) {
    const self = this;
    self.router = router;
    self.connection = connection;
    self.yp = router.yp;
    self.data = args.isData ? args : new Data(args);
    const sender = origin.sender || origin;
    self.forward_socket = origin.key || self.data.get('socket_id');
    self.user = new User(sender);
    if (sender && sender.profile) {
      const f = () => { self.trigger(WORKER_READY) }
      setTimeout(f, 30)
      return;
    }
    const sender_id = self.user.get(Attr.uid) || self.data.get(Attr.ident);
    self.yp.call_proc('get_visitor', sender_id, function (user) {
      self.user = new User(user);
      self.trigger(WORKER_READY);
    });
  }

  /**
   * 
   * @returns 
   */
  proc(name) {
    return `${this.user.get(Attr.db_name)}.${name}`;
  }

  /**
   * 
   * @returns 
   */
  makeMessage() {
    const args = Array.prototype.slice.call(arguments);
    return JSON.stringify(args);
  }

  /**
   * 
   * @returns 
   */
  echo(args) {
    let output = {
      service: args.service || this.__service,
      recipient: this.user.uid(),
      data: args.data || args
    }

    if (args.error) {
      output = args;
      output.service = this.__service;
    }
    let msg = JSON.stringify(output);
    this.connection.send(msg);
    self.userdb.end();
  }

  /**
   * 
   * @returns 
   */
  sanitize(data) {
    let clean_data = [];
    if (isArray(data)) {
      for (let item of data) {
        clean_data.push(super.sanitize(item));
      }
    } else {
      clean_data = super.sanitize(data);
    }
    return clean_data;
  }

  /**
   * 
   * @returns 
   */
  forward() {
    const self = this;
    const recipient = self.data.recipient();
    const socket_id = self.forward_socket;
    if (isEmpty(socket_id)) {
      self.debug(`UNDEFINED SOCKET ID `, socket_id, self.data);
      return;
    }
    let c = self.router.getConnection(socket_id);
    const args = self.data.rawdata;
    args.uid = self.user.uid();
    args.ident = self.user.ident();
    args.sender = self.user.get(Attr.fullname);
    args.firstname = self.user.get(Attr.firstname);
    args.lastname = self.user.get(Attr.lastname);
    const output = {
      service: args.service || self.__service,
      recipient: recipient,
      sender: {
        id: args.uid,
        ident: args.ident,
        name: args.sender,
        serial: 111423,
        firstname: args.firstname,
        lastname: args.lastname,
      },
      data: args.data || args
    }
    c = self.router.getConnection(socket_id);
    if (c) {
      this.sanitize(output.data);
      c.send(JSON.stringify(output))
    } else {
      self.silly(`PEER NOT FOUND  ==> **${socket_id}**`, self.router.showConnections());
    }
  }

  /**
   * 
   * @returns 
   */
  sendTo(recipient, args) {
    if (isEmpty(recipient)) {
      recipient = this.data.get('recipient');
    }
    if (isEmpty(args)) {
      args = this.data.rawdata;
    }
    const self = this;
    args.uid = self.user.uid();
    args.ident = self.user.ident();
    args.sender = self.user.get(Attr.fullname);
    args.firstname = self.user.get(Attr.firstname);
    args.lastname = self.user.get(Attr.lastname);
    const output = {
      service: args.service || self.__service,
      recipient: recipient,
      sender: {
        id: args.uid,
        ident: args.ident,
        firstname: args.firstname,
        lastname: args.lastname,
        name: args.sender
      },
      data: args.data || args
    }
    this.sanitize(output.data);
    self.debug("SENDING (SANITIZED) TO", recipient, args, output);
    let msg = JSON.stringify(output);
    async function f() {
      const sockets = await self.yp.await_proc('socket_user_connections', recipient);
      if (isEmpty(sockets)) {
        self.debug(`NO PEER IS ON LINE`);
        return [];
      }
      return toArray(sockets);
    }
    f().then(function (sockets) {
      self.debug("SENDING TO SOCKETS", sockets);
      let c;
      z
      for (let s of sockets) {
        c = self.router.getConnection(s.connection_id);
        if (c) {
          c.send(msg)
        } else {
          self.debug(`NOT A LOCAL PERRE FORWARDING ==> **${e.connection_id}**`);
        }
      }
    }).catch(self.fallback);
  }
}


module.exports = __websocket;
