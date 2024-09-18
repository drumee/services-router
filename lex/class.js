// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2014                                         *
//   FILE : src/drumee/lex/class
//   MANDATORY: constants used to avoid the same string everywhere      *
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *


const a = {
  absolute      : 'absolute',
  active        : 'active',

  align         : {
    left        : 'align-left',
    right       : 'align-right',
    mid_right   : 'xia-right',
    center      : 'align-center',
    justify     : 'align-justify',
    left_middle : "align-left-middle",
    right_middle: "align-right-middle"
  },
  cursor        : {
    pointer     : 'cursor-pointer'
  },
  bg            : {
    white       : 'bg-white',
    grey        : 'bg-grey'
  },
  button        : {
    blank       : "widget button-blank",
    blank_h     : "widget button-blank margin-auto-h",
    blank_v     : "widget button-blank margin-auto-v",
    trigger_h   : "widget button-trigger margin-auto-h",
    trigger_v   : "widget button-trigger margin-auto-v"
  },
  box_shadow    : 'box-shadow',
  box           : {
    digit       : 'box-digit',
    image       : 'box-image',
    shadow      : 'box-shadow'
  },

  full          : 'full',
  full_height   : 'full-height',
  full_width    : 'full-width',
  fill_up       : 'fill-up',
  flowH         : 'flow-h',
  flowV         : 'flow-v',
  footer        : {
    inside      : 'footer-inside',
    outside     : 'footer-outside',
    fixed       : 'footer-fixed'
  },
  flow          : {
    root        : 'flow-root',
    horizontal  : 'flow-h',
    vertical    : 'flow-v',
    x           : 'flow-h',
    y           : 'flow-v',
    H           : 'flow-h full-width',
    V           : 'flow-v full-width',
    fullH       : 'flow-h full-width',
    fullV       : 'flow-v full-width'
  },

  flexgrid      : 'flexgrid-1',
  flexgrid2     : 'flexgrid-2',
  formBody      : 'form-body',

  fx            : {
    item        : 'flow-h padding-5 fx-item',
    menu        : 'fx-menu',
    slide       : 'fx-slide'
  },

  hidden        : 'hidden',
  margin        : {
    base        : 'margin-5',
    auto        : 'margin-auto',
    auto_v      : 'margin-auto-v',
    auto_h      : 'margin-auto-h',
    left        : {
      px5       : 'margin-left-5',
      px10      : 'margin-left-10'
    }
  },

  media         : {
    browser     : 'media-browser',
    gallery     : 'gallery',
    thumb       : 'media-thumb'
  },

  menu          : {
    nested      : 'nested-item',
    item        : 'xia-menu-item',
    context     : 'context-menu',
    right       : 'context-menu'
  },

  modal         : "xia-modal-root transition-all",

  node          : 'node',
  no_view       : 'no-view',
  widget        : 'widget',
  helper        : 'helper',

  padding       : {
    none        : 'no-padding',
    base        : 'padding-5',
    px5         : 'padding-5',
    px10        : 'padding-10',
    px20        : 'padding-20'
  },

  section       : "section padding-10",
  scroll        : {
    _           : "scroll",
    x           : "scroll-x",
    y           : "scroll-y"
  },

  slide         : {
    background  : "ls-bg",
    item        : "ls-slide",
    layer       : "ls-l",
    link        : "ls-link",
    thumbnail   : "ls-tn"
  },

  space         : {
    header      : "space-header"
  },

  spinner       : {
    center      : 'fill-up xia-center'
  },

//  transition    :
//    all         : 'transition-all'
//    bg          : 'transition-bg'
//    border      : 'transition-border'
//    fade        : 'transition-fade'
//    left        : 'transition-left'
//    margin      : 'transition-margin'
//    top         : 'transition-top'
//    fadeLeft    : 'transition-fade-left'
  tooltip       : 'tooltip-fixed',
  topic         : {
    header      : "topic-header",
    label       : "topic-label"
  },
  url           : {
    x           : 'flow-horizontal xia-left url',
    y           : 'flow-vertical xia-left url'
  },

  white_box     : 'bg-white box-shadow',
  wrapper       : 'wrapper'
};

a.menu.v = `${a.full} ${a.flow.y}`;
a.menu.h = `${a.box_shadow} ${a.bg.white} ${a.flow.x}`;
a.popup  = `${a.absolute} prompt ${a.bg.white} ${a.box_shadow} ${a.padding.px20}`;
a.designer =
  {contextmenu : `${a.absolute} ${a.box_shadow}`};



const b = {

  admin          : {
    permission   : {
      check_box  : 'padding-5 check-box xia-left'
    }
  },

  fullWidth      : 'full',

  redLine        : 'red-line',

  button         : {
    menuItem     : 'btn-transparent padding-5 font-size-25',
    commander    : 'light-blue xia-btn xia-center padding-5 font-size-15',
    menu: {
      media      : 'btn-transparent padding-5 font-size-25',
      layout     : 'btn-transparent padding-5 font-size-20'
    }
  }
};

module.exports = {
  _class : a,
  _style : b
};
