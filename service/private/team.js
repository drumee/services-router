// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/chat
//   TYPE  : module
// ================================  *
const { Attr } = require("@drumee/server-essentials");

const { isArray } = require("lodash");

const { Entity } = require("@drumee/server-core");

class __private_team extends Entity {
  // ========================
  // initialize
  // ========================
  constructor(...args) {
    super(...args);
    this.create = this.create.bind(this);
  }

  /**
   * 
   */
  create() {
    const self = this;
    const name = self.input.need(Attr.name);
    const specs = self.input.need(Attr.specs);
    const domain = self.input.need(Attr.domain);
    let users = self.input.need(Attr.users);

    if (!isArray(users)) {
      users = [users];
    }

    users = users.filter(function (e) {
      return e !== self.uid;
    });

    async function f() {
      let hub = await self.db.await_proc(
        "team_create_hub",
        specs,
        domain,
        self.uid
      );
      let grant_hub = `${hub.db_name}.permission_grant`;
      await self.yp.await_proc(grant_hub, "*", self.uid, 0, 63, "system", "");

      await self.db.await_proc(
        "permission_grant",
        hub.id,
        self.uid,
        0,
        63,
        "system",
        ""
      );

      let add_member = `${hub.db_name}.add_member`;
      for (let uid of users) {
        await self.yp.await_proc(add_member, uid, 7, 0);
      }

      let folders = await self.db.await_proc(
        "team_create_member_folder",
        JSON.stringify(users),
        self.uid,
        hub.id
      );

      let grant = `${hub.db_name}.permission_grant`;
      for (let folder of folders) {
        for (let uid of users) {
          if (folder.uid == uid) {
            await self.yp.await_proc(
              grant,
              folder.nid,
              uid,
              0,
              15,
              "system",
              ""
            );
          } else {
            await self.yp.await_proc(
              grant,
              folder.nid,
              uid,
              0,
              1,
              "system",
              ""
            );
          }
        }
      }
      let owner_folder = await self.db.await_proc(
        "team_create_owner_folder",
        name,
        self.uid,
        hub.id
      );
      return owner_folder;
    }
    f()
      .then(function (data) {
        self.output.list(data);
      })
      .catch(self.fallback);
  }
}

module.exports = __private_team;
