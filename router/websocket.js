// ================================  *
//   Copyright Xialia.com  2013-2020 *
//   FILE  :
//   TYPE  : module
// ================================  *

const PING = "ping";
const SERVICE = "service";
const { Constants, sysEnv, Events,
  Logger, toArray, RedisStore, Cache
} = require("@drumee/server-essentials");

const {
  MESSAGE,
  CLOSE,
  ROUTER_READY,
} = Events;
const { isFunction, isEmpty, isString } = require("lodash");
const { Data, Input } = require("@drumee/server-core");
const { join } = require("path");
const { readFileSync } = require("jsonfile");
const { verbosity } = readFileSync("/etc/drumee/conf.d/myDrumee.json");
const WATCHDOG_TIMER = 15000;

const { ui_base, main_domain, instance_mode,
  instance_name, log_level, endpoint } = sysEnv();

/**  verbosity level = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4,
  SILLY: 5
}
*/

global.verbosity = verbosity || log_level || 1;


class __websocket_router extends Logger {

  constructor(...args) {
    super(...args);
    this.updateConnectionsState = this.updateConnectionsState.bind(this);
  }
  /**
   * 
   * @param {*} opt 
   */
  initialize(opt) {
    this.yp = opt.yp;
    this.instance = opt.instance;
    const app_file = join(ui_base, instance_mode, instance_name, "app", "index.json");
    this.app = readFileSync(app_file);
    this.connections = new Map();
    this.users = new Map();
    this.timers = new Map();
    this.initRedis();
  }

  /**
   *
   */
  async initRedis() {
    let res = new RedisStore();
    await res.init();
    let channel = RedisStore.getLiveUpdateChannel();
    const subscriber = await RedisStore.getSubscribe();
    subscriber.subscribe(channel, this.routeDownStream.bind(this));
    global.websocketRouter = this;

    setTimeout(() => {
      this.trigger(ROUTER_READY);
      this.connectionsWatchdog();
      this.debug("WEBSOCKET SERVER READY");
    }, 1000);
  }

  /* ------------------------------ */
  async sendToSocket(data) {
    this.warn("sendToSocket has been deprecated!");
  }

  /* ------------------------------ */
  send(socket, data) {
    this.sanitize(data);
    const msg = JSON.stringify(data);
    socket.send(msg);
    this.timers.set(socket.id, new Date().getTime());
  }

  /* ------------------------------ */
  sendToId(socket_id, payload) {
    let socket = this.connections.get(socket_id);
    if (!socket) {
      return false;
    }
    if (!payload.service) payload.service = "live.update";
    this.sanitize(payload);
    const msg = JSON.stringify(payload);
    socket.send(msg);
    return true;
  }

  /**
   *
   * @param {*} socket_id
   * @returns
   */
  async broadcastStatus(id) {
    let s = this.users.get(id);
    if (!s) return;
    let sender = {};
    if (isFunction(s.toJSON)) {
      sender = s.toJSON();
    } else {
      sender = s;
    }
    if (!sender || !sender.user_id) {
      return;
    }
    let rows = await this.yp.await_proc("drumate_online_state", sender.user_id);
    rows = toArray(rows);
    let payload = {
      options: {
        service: "user.connection_status",
        keys: ["user_id"],
      },
    };
    for (let row of rows) {
      payload.socket_id = row.id;
      payload.model = { user_id: row.my_id, status: row.my_state };
      await RedisStore.sendData(payload, row.id);
    }
  }

  /**
   * 
   */
  clearSocket(socket) {
    setTimeout(() => {
      this.users.delete(socket.id);
      this.connections.delete(socket.id);
      this.timers.delete(socket.id);
      this.silly(
        `${new Date()}: Peer ${socket.id} (${socket.remoteAddress
        }) disconnected.`
      );
    }, 2000);
  }

  /**
   *
   * @param {*} socket
   * @param {*} reasonCode
   * @param {*} description
   */
  async close(socket, reasonCode, description) {
    this.silly("DELETING", reasonCode, description, socket.id);
    await this.yp.call_proc("socket_free", socket.id);
    await this.broadcastStatus(socket.id);
    this.clearSocket(socket);
  }

  /**
   *
   * @param {*} sender
   */
  async notifyUserStatus(sender, state = null) {
    const { socket_id } = sender;
    if (state !== null) {
      await this.yp.await_proc("socket_set_state", socket_id, state);
    }
    this.users.set(socket_id, sender);
    await this.broadcastStatus(socket_id);
  }

  /* ------------------------------ */
  exception(socket, msg) {
    this.warn(msg);
    let error = {
      error: "Unknown error",
    };
    if (msg.error) {
      error = msg;
    } else {
      error = {
        error: msg,
      };
    }
    this.send(socket, { status: "failed", ...error });
  }

  /* ------------------------------ */
  getConnection(id) {
    if (isEmpty(id)) {
      this.silly(`Require socket id`);
      return;
    }
    return this.connections.get(id);
  }

  /* ------------------------------ */
  releaseConnection(id, code, reason) {
    if (isEmpty(id)) {
      this.silly(`Require socket id`);
      return;
    }
    let c = this.connections.get(id);
    if (c) c.close(code, reason);
    this.connections.delete(id);
  }

  /* ------------------------------ */
  showConnections() {
    this.debug("Connections========", this.connections.keys());
  }

  /* ------------------------------ */
  protocol(opt, g = 1) {
    let p = "";
    if (opt.httpRequest) {
      p = opt.httpRequest.headers["sec-websocket-protocol"] || "";
    } else if (opt.protocol) {
      p = opt.protocol;
    }
    let protocol = p;
    let [group, room_id, hub_id] = p.split(/[ ,-_]+/);
    if (!group) group = p;
    return { protocol, group, room_id, hub_id };
  }

  /**
   *
   * @param {*} data
   */
  sid() {
    return this.session().id;
  }

  /**
   *
   * @param {*} socket
   * @param {*} message
   */
  async routeUpstream(socket, message) {
    const data = new Data(message);
    data.socket_id = socket.id;
    let args = data.data() || {};
    let method = data.methodName();
    switch (method) {
      case "hello":
        this.send(socket, {
          service: data.service(),
          data: {
            ...args,
            revision: this.app,
            socket_id: socket.id,
          },
        });
        break;
      case "bind":
        this.chekcSockekBinding(socket);
        break;
      case "ping":
        this.debug("AAA:398 -- PING ***", args);
        switch (args.type) {
          case "showConnections":
            this.showConnections();
            break;
          case "checkConnection":
            let ok = 0;
            if (this.connections.get(socket.id)) {
              ok = await this.yp.await_func("is_socket_active", socket.id);
            }
            this.ping(socket, { ok });
            this.debug("AAA:398 -- PING *** OK ", args.type, ok);
            break;
          case "publishOnlineStatus":
            // this.silly("AAAA:305 publishOnlineStatus", sender);
            await this.yp.await_proc("socket_set_state", socket.id, 1);
            await this.broadcastStatus(socket.id);
            break;
          case "publishOfflineStatus":
            //this.silly("AAAA:311 publishOfflineStatus", sender);
            await this.yp.await_proc("socket_set_state", socket.id, 0);
            await this.broadcastStatus(socket.id);
            break;
          case "debug":
            if (args.verbose) {
              global.verbosity = args.verbose;
            }
            RedisStore.sendData(args);
            break;
          default:
            this.ping(socket, args);
        }
        break;
    }
  }

  /**
   *
   * @param {*} request
   * @param {*} cookies
   * @param {*} socket
   * @returns
   */
  async handshake(socket) {
    this.send(socket, {
      service: "sys.handshake",
      data: {
        error:
          "There is no cookie provded. Wait getting one before retrying.",
      },
    });
  }

  /**
   * Create a relationship between socket_id and session id (guest_sid or regsid)
   * @param {*} socket
   * @param {*} auth
   * @returns
   */
  async bindSocket(socket, auth) {
    let sid = auth.id;
    let socket_id = socket.id;
    let args = {
      id: socket_id,
      sid,
      token: auth.otak,
      endpoint
    }
    const extUsers = [
      Cache.getSysConf("guest_id"), Cache.getSysConf("nobody_id")
    ]
    //this.debug("AAAA:3339", {args, auth})
    let data = await this.yp.await_proc("socket_bind", args);
    if (data && !data.failed) {
      sid = data.session_id || sid;
      this.connections.set(socket_id, socket);
      this.notifyUserStatus(data, 1);
      let user = await this.yp.await_proc("cookie_retrieve_user", sid);
      if (extUsers.includes(user.id) && auth.regsid) {
        user = await this.yp.await_proc("cookie_retrieve_user", auth.regsid);
      }
      if (!user || !user.id) {
        await this.handshake(socket);
      }
      await this.yp.await_proc("cookie_touch", { socket_id, sid, uid: user.id });
      user = this.sanitize(user);
      data = {
        hash: this.app.hash,
        socket_id,
        main_domain,
        user,
      };
      this.send(socket, { service: "sys.hello", data });
      return data;
    }
    return data;
  }

  /**
   *
   * @param {*} request
   * @param {*} cookies
   * @param {*} socket
   * @returns
   */
  async chekcSockekBinding(socket) {
    let s = await this.yp.await_proc("socket_get", socket.id);
    if (s && s.socket_id) {
      let user = await this.yp.await_proc("get_user_from_socket", s.socket_id);
      if (!user || !user.uid) {
        return;
      }
      this.connections.set(s.socket_id, socket);
      this.notifyUserStatus(user, 1);
      this.send(socket, {
        service: "sys.socket_bound",
        data: user,
      });
    }
  }

  /* ------------------------------ */
  async check_user(request, socket, auth, protocol) {
    let data = {};
    switch (protocol) {
      case SERVICE:
        if (auth.type == "api") {
          return { publicApi: 1 };
        }
        if (auth.anonymous) {
          return auth;
        }
        data = await this.bindSocket(socket, auth);
        if (data.failed) {
          await this.handshake(socket);
          return auth;
        }
        return data;
      default:
        this.warn("UNSUPPORTED PROTOCOL WITH REQUEST ==>", request);
        throw `Protocol ${protocol} is not suppoted!`;
    }
  }

  /**
   *
   * @param {*} socket
   * @param {*} message
   * @param {*} sender
   */
  async routeDownStream(args) {
    const { source, dest, payload } = JSON.parse(args);
    if (!payload) {
      this.warn("EEE:514 -- REQUIRE CONTENT", payload);
      return;
    }
    if (isString(dest)) {
      this.sendToId(dest, payload);
      return;
    }

    let socket_id;
    let recipients = toArray(dest);
    for (var r of recipients) {
      if (!r) continue;
      if (isString(r)) {
        this.sendToId(r, payload);
      } else {
        socket_id = r.socket_id || r.id;
        if (socket_id && isString(socket_id)) {
          this.sendToId(socket_id, payload);
        }
      }
    }
  }

  /**
   *
   * @param {*} get_hub
   */
  async get_hub(hub_id) {
    let hub = await this.yp.await_proc("get_hub", hub_id);
    if (isEmpty(hub)) {
      throw `Hub found hub id=${hub_id}`;
    }
    return hub;
  }

  /**
   *
   * @param {*} request
   */
  async handle_room(o) {
    this.debug(`WEBSOCKET ROOOM HAS BEEN MOVE INTO service (REST)`);
  }

  /**
   *
   * @param {*} request
   * @param {*} p
   */
  async check_connection(request, protocol) {
    let socket = {};
    let msg;
    switch (protocol) {
      case SERVICE:
      case PING:
        socket = await request.accept(protocol, request.origin);
        let headers = null;
        try {
          headers = request.httpRequest.headers;
        } catch (e) {
          this.warn(`Protocol ${protocol} requires httpRequest.headers!`);
        }
        break;

      default:
        this.warn(`Protocole ${protocol} is not supported!`);
    }
    socket.protocol = protocol;
    socket.id = request.key;
    return socket;
  }

  /**
   *
   * @param {*} data
   */
  authorization(request) {
    const input = new Input({ request, sourceName: "websocket" });
    let auth = input.authorization();
    return auth;
  }

  /**
   *
   * @param {*} request
   */
  async create_connection(request) {
    const self = this;
    const { protocol, group } = this.protocol(request);

    let socket = await this.check_connection(request, protocol);
    if (!socket || !socket.id) {
      this.debug(`Invalid socket`, socket);
      request.reject();
      return;
    }

    let auth = await this.authorization(request);
    //this.debug(` authorization`, {auth});
    if (!auth.id) {
      this.debug(`Invalid authorization`, auth);
      request.reject();
      return;
    }


    let user = await this.check_user(request, socket, auth, protocol);
    if (isEmpty(user)) {
      this.debug(`Invalid user`, user);
      request.reject();
      return;
    }

    if (user.publicApi || user.anonymous) return; // Nothing to do when publicApi

    let sender = user.sender || {};
    socket.on(MESSAGE, (message) => {
      self
        .routeUpstream(socket, message, sender, request)
        .then()
        .catch((e) => {
          this.warn(`Message handler caught error`, e);
        });
    });
    socket.once(CLOSE, (reasonCode, description) => {
      this.silly("AAAA:653 connection closed");
      this.close(socket, reasonCode, description, request.key);
    });
  }

  /**
   *
   * @param {*} socket
   */
  ping(socket, data) {
    let msg = {
      service: "sys.ping",
      data,
    };
    this.send(socket, msg);
  }

  /**
   * 
   */
  async updateConnectionsState() {
    let ids = [];
    this.connections.forEach(async (socket, id) => {
      if (!socket.connected) {
        this.silly("AAA:708 Releasing disconnected socket", id);
        await this.close(socket, 9999, "Unreachable");
        return;
      }
      let lastseen = this.timers.get(id);
      const timestamp = new Date().getTime();
      ids.push(id);
      if (lastseen && (timestamp - lastseen) < WATCHDOG_TIMER / 2) {
        this.silly(`Socket ${id} is recent. Skipping`);
        return;
      }
      let msg = {
        service: "sys.keepalive",
        data: { timestamp },
      };
      this.send(socket, msg);
    });
    await this.yp.await_proc("socket_refresh", this.endpointAddress, ids);
  }
  /**
   *
   */
  connectionsWatchdog() {
    if (this.watchdogTimer) return;
    this.watchdogTimer = setInterval(this.updateConnectionsState, WATCHDOG_TIMER);
  }
}

const __singleton = function (opt) {
  return {
    Router: new __websocket_router(opt),
  };
};
module.exports = __singleton;
