
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/chat
//   TYPE  : module
// ================================  *

const { Attr } = require("@drumee/server-essentials");

const { stringify } = JSON;
const { after, isArray, isEmpty } = require('lodash');

/** ======================================== */
const { Entity } = require('@drumee/server-core');
class __private_agenda extends Entity {



  // ========================
  // initialize
  // ========================
  constructor(...args) {
    super(...args);
    this.list_calendar = this.list_calendar.bind(this);
    this.add_calendar = this.add_calendar.bind(this);
    this.select_calendar = this.select_calendar.bind(this);
    this.modify_calendar = this.modify_calendar.bind(this);
    this.delete_calendar = this.delete_calendar.bind(this);
    this.show_agenda = this.show_agenda.bind(this);
    this.add_agenda = this.add_agenda.bind(this);
    this.modify_agenda = this.modify_agenda.bind(this);
    this.remove_agenda = this.remove_agenda.bind(this);
  }


  //========================
  //
  //========================
  list_calendar() {
    return this.db.call_proc('show_calendar', null, this.output.data);
  }


  //========================
  //
  //========================
  add_calendar() {
    const name = this.input.need(Attr.name);
    const color = this.input.need(Attr.color);
    let is_default = this.input.use(Attr.is_default, 1);

    if (is_default > 0) {
      is_default = 1;
    }

    const fn_chk_calendar = () => {
      return this.db.call_proc('chk_name_calendar', name, null, function (calendar) {
        if (Object.keys(calendar).length != 0) {
          this.exception.user("CALENDAR_ALREADY_EXISTS");
          return;
        }
        return cnt_add();
      }.bind(this));
    };

    const fn_add = () => {
      return this.db.call_proc('add_calendar', name, color, this.uid, is_default, 0, this.output.data);
    };

    const cnt_calendar = after(1, fn_chk_calendar);
    var cnt_add = after(1, fn_add);
    return cnt_calendar();
  }


  //========================
  //
  //========================
  select_calendar() {
    let calendar_id = this.input.use(Attr.calendar_id);
    const stime = this.input.need(Attr.stime);
    const etime = this.input.need(Attr.etime);

    let ln_calendar = 1;
    if (calendar_id != null) {
      if (!isArray(calendar_id)) {
        calendar_id = [calendar_id];
      }
      ln_calendar = calendar_id.length;
    }

    const fn_chk_calendar = () => {
      if (calendar_id != null) {
        return calendar_id.map((id) =>
          this.db.call_proc('show_calendar', id, function (data) {
            if ((Object.keys(data).length == 0)) {
              this.exception.user("CALENDAR_NOT_FOUND");
              return;
            } else {
              return cnt_modify();
            }
          }.bind(this)));
      } else {
        return cnt_modify();
      }
    };


    const fn_modify = () => {
      if (calendar_id != null) {
        calendar_id = stringify(calendar_id);
        return this.db.call_proc('select_calendar', calendar_id, () => {
          return this.db.call_proc('list_agenda', stime, etime, this.output.data);
        });
      } else {
        return this.db.call_proc('select_calendar', null, () => {
          return this.db.call_proc('list_agenda', stime, etime, this.output.data);
        });
      }
    };


    const cnt_calendar = after(1, fn_chk_calendar);
    var cnt_modify = after(ln_calendar, fn_modify);
    return cnt_calendar();
  }



  //========================
  //
  //========================

  modify_calendar() {
    const calendar_id = this.input.need(Attr.calendar_id);
    const name = this.input.need(Attr.name);
    const color = this.input.need(Attr.color);
    let is_selected = this.input.need(Attr.is_selected);
    let is_default = this.input.use(Attr.is_default, 0);


    if (is_default > 0) {
      is_default = 1;
    }

    if (is_selected > 0) {
      is_selected = 1;
    }

    const fn_chk_calendar = () => {
      this.db.call_proc('show_calendar', calendar_id, function (calendar) {
        if ((Object.keys(calendar).length == 0)) {
          this.exception.user("CALENDAR_NOT_EXISTS");
          return;
        } else {
          if (calendar.owner_id !== this.uid) {
            this.exception.user("OTHER'S_CALENDAR");
            return;
          }
        }
        return cnt_calendar_default();
      }.bind(this));
    };


    const fn_chk_calendar_default = () => {
      return this.db.call_proc('chk_default_calendar', is_default, calendar_id, function (calendar) {
        if (Object.keys(calendar).length != 0) {
          this.exception.user("DEFAULT_CALENDAR");
          return;
        }
        return cnt_calendar_name();
      }.bind(this));
    };


    const fn_chk_calendar_name = () => {
      return this.db.call_proc('chk_name_calendar', name, calendar_id, function (calendar) {
        if (Object.keys(calendar).length != 0) {
          this.exception.user("CALENDAR_NAME_ALREADY_EXISTS");
          return;
        }
        return cnt_modify();
      }.bind(this));
    };

    const fn_modify = () => {
      return this.db.call_proc('modify_calendar', calendar_id, name, color, this.uid, is_selected, is_default, () => {
        return this.db.call_proc('show_calendar', calendar_id, this.output.data);
      });
    };

    const cnt_calendar = after(1, fn_chk_calendar);
    var cnt_calendar_default = after(1, fn_chk_calendar_default);
    var cnt_calendar_name = after(1, fn_chk_calendar_name);
    var cnt_modify = after(1, fn_modify);
    return cnt_calendar();
  }

  //========================
  //
  //========================

  delete_calendar() {
    const calendar_id = this.input.need(Attr.calendar_id);

    const fn_chk_calendar = () => {
      return this.db.call_proc('show_calendar', calendar_id, function (calendar) {
        if ((Object.keys(calendar).length == 0)) {
          this.exception.user("CALENDAR_NOT_EXISTS");
          return;
        } else {
          if (calendar.owner_id !== this.uid) {
            this.exception.user("OTHER'S_CALENDAR");
            return;
          }
          if (calendar.is_default === '1') {
            this.exception.user("DEFAULT_CALENDAR");
            return;
          }
        }
        return cnt_delete();
      }.bind(this));
    };

    const fn_delete = () => {
      return this.db.call_proc('delete_calendar', calendar_id, this.uid, this.output.data);
    };

    const cnt_calendar = after(1, fn_chk_calendar);
    var cnt_delete = after(1, fn_delete);
    return cnt_calendar();
  }

  //========================
  //
  //========================
  show_agenda() {
    const agenda_id = this.input.need(Attr.agenda_id);
    let agenda = {};

    const fn_shw = () => {
      return this.output.data(agenda);
    };

    const cnt_shw = after(2, fn_shw);

    this.db.call_proc('show_detail_agenda', agenda_id, function (data) {
      if (Object.keys(data).length != 0) {
        agenda = data;
        agenda.member = [];
      } else {
        this.exception.user("AGENDA_NOT_EXISTS");
        return;
      }

      return cnt_shw();
    }.bind(this));

    this.db.call_proc('show_detail_map_agenda', agenda_id, function (map) {
      if (!isArray(map) && !isEmpty(map)) map = [map];
      if (map.length > 0) {
        agenda.member = map;
      }
      return cnt_shw();
    }.bind(this));
  }


  //========================
  //
  //========================

  add_agenda() {
    const name = this.input.use(Attr.name);
    const stime = this.input.need(Attr.stime);
    let etime = this.input.use(Attr.etime);
    const place = this.input.use(Attr.place);
    const calendar_id = this.input.use(Attr.calendar_id);
    let contact_id = this.input.use(Attr.contact_id);

    let ln_contact = 1;

    if (contact_id != null) {
      if (!isArray(contact_id)) {
        contact_id = [contact_id];
      }
      ln_contact = contact_id.length;
    }

    if ((etime == null)) {
      etime = 0;
    }

    const fn_chk_calendar = () => {
      if (calendar_id != null) {
        return this.db.call_proc('show_calendar', calendar_id, function (calendar) {
          if ((Object.keys(calendar).length == 0)) {
            this.exception.user("CALENDAR_NOT_EXISTS");
            return;
          }
          return cnt_contact();
        }.bind(this));
      } else {
        return cnt_contact();
      }
    };

    const fn_chk_contact = () => {
      if (contact_id != null) {
        return (() => {
          const result = [];
          for (let id of contact_id) {
            this.debug("contact_id FOPIANTH", ln_contact, id);
            result.push(this.db.call_proc('my_contact_get', id, null, function (data) {
              if ((Object.keys(data).length == 0)) {
                this.exception.user("CONTACT_NOT_FOUND");
                return;
              } else {
                return cnt_add();
              }
            }.bind(this)));
          }
          return result;
        })();
      } else {
        return cnt_add();
      }
    };

    const fn_add = () => {
      if (contact_id != null) {
        contact_id = stringify(contact_id);
      }
      return this.db.call_proc('add_agenda', name, place, contact_id, stime, etime, this.uid, calendar_id, this.output.data);
    };


    const cnt_calendar = after(1, fn_chk_calendar);
    var cnt_contact = after(1, fn_chk_contact);
    var cnt_add = after(ln_contact, fn_add);
    return cnt_calendar();
  }


  //========================
  //
  //========================

  modify_agenda() {
    const agenda_id = this.input.need(Attr.agenda_id);
    const name = this.input.use(Attr.name);
    const stime = this.input.need(Attr.stime);
    let etime = this.input.use(Attr.etime);
    const place = this.input.use(Attr.place);
    const calendar_id = this.input.use(Attr.calendar_id);
    let contact_id = this.input.use(Attr.contact_id);

    let ln_contact = 1;

    if (contact_id != null) {
      if (!isArray(contact_id)) {
        contact_id = [contact_id];
      }
      ln_contact = contact_id.length;
    }

    if ((etime == null)) {
      etime = 0;
    }

    const fn_chk_agenda = () => {
      return this.db.call_proc('show_detail_agenda', agenda_id, function (agenda) {
        if ((agenda == null)) {
          this.exception.user("AGENDA_NOT_EXISTS");
          return;
        }
        return cnt_calendar();
      }.bind(this));
    };



    const fn_chk_calendar = () => {
      if (calendar_id != null) {
        return this.db.call_proc('show_calendar', calendar_id, function (calendar) {
          if ((Object.keys(calendar).length == 0)) {
            this.exception.user("CALENDAR_NOT_EXISTS");
            return;
          }
          return cnt_contact();
        }.bind(this));
      } else {
        return cnt_contact();
      }
    };

    const fn_chk_contact = () => {
      if (contact_id != null) {
        return contact_id.map((id) =>
          this.db.call_proc('my_contact_get', id, null, function (data) {
            if ((Object.keys(data).length == 0)) {
              this.exception.user("CONTACT_NOT_FOUND");
              return;
            } else {
              return cnt_modify();
            }
          }.bind(this)));
      } else {
        return cnt_modify();
      }
    };

    const fn_modify = () => {
      if (contact_id != null) {
        contact_id = stringify(contact_id);
      }
      return this.db.call_proc('modify_agenda', agenda_id, name, place, contact_id, stime, etime, this.uid, calendar_id, this.output.data);
    };

    const cnt_agenda = after(1, fn_chk_agenda);
    var cnt_calendar = after(1, fn_chk_calendar);
    var cnt_contact = after(1, fn_chk_contact);
    var cnt_modify = after(ln_contact, fn_modify);
    return cnt_agenda();
  }



  //========================
  //
  //========================

  remove_agenda() {
    const agenda_id = this.input.need(Attr.agenda_id);

    const fn_chk_agenda = () => {
      return this.db.call_proc('show_detail_agenda', agenda_id, function (agenda) {
        if ((Object.keys(agenda).length == 0)) {
          this.exception.user("AGENDA_NOT_EXISTS");
          return;
        }
        return cnt_delete();
      }.bind(this));
    };

    const fn_delete = () => {
      if (contact_id != null) {
        var contact_id = stringify(contact_id);
      }
      return this.db.call_proc('remove_agenda', agenda_id, this.output.data);
    };



    const cnt_agenda = after(1, fn_chk_agenda);
    var cnt_delete = after(1, fn_delete);
    return cnt_agenda();
  }
}

//========================
//
//========================




module.exports = __private_agenda;
