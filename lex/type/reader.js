// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2015                                    *
//   FILE : src/drumee/lex/type/reader
//   MANDATORY: Types defintions for LETC parser and designer
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *


const a = {
  accordion        : 'accordion',
  album            : 'album',
  analytics        : 'analytics',

  bit              : {
    list           : 'bit_list',
    radio          : 'bit_radio'
  },
  blog             : 'blog',
  box              : {
    _              : 'box',
    reader         : 'box:reader',
    designer       : 'box:designer'
  },
  button           : {
    anchor         : 'button_anchor',
    blank          : 'button_blank',
    broadcast      : 'button_broadcast',
    nested         : 'button_nested',
    rotate         : 'button_rotate',
    toggle         : 'button_toggle',
    trigger        : 'button_trigger'
  },

  card             : 'card',
  catalog          : 'catalog',
  channel          : 'channel',  // TV Channel
  chart            : {
    line           : 'chart:line',
    pie            : 'chart:pie'
  },
  checkbox         : 'checkbox',
  colorPicker      : 'colorPicker',
  composite        : {
    box            : 'composite_box',
    pulldown       : 'composite_pulldown',
    site           : 'composite_site',
    visitor        : 'composite_visitor',
    tmp            : 'composite'
  },
  comment          : {
    panel          : 'comment:panel',
    panel          : 'comment:thread'
  },

  container        : 'container',

  kropper           : 'kropper',
  cvibes            : 'cvibes',

  document          : 'document',
  dropMenu          : 'dropMenu',
  drumThreads       : 'drumThreads',

  entry             : {
    available       : 'entry_available',
    blank           : 'entry_blank',
    hidden          : 'entry_hidden',
    lookup          : 'entry_lookup',
    password        : 'entry_password',
    search          : 'entry_search',
    text            : 'entry_text',
    textarea        : 'entry_textarea'
  },
  film              : 'film',
  form              : 'form',
  forum             : 'forum',    // Same as blog ?

  helper            : {
    document        : 'helper_document',
    file            : 'helper_file',
    image           : 'helper_image',
    media           : 'helper_media',
    video           : 'helper_video',
    widget          : 'helper_widget'
  },
  hull              : 'hull',

  image             : {
    box             : 'image_box',
    cropper         : 'image_cropper',
    raw             : 'image_raw',
    reader          : 'image_reader',
    svg             : 'image_svg'
  },

  hub               : {
    area            : 'hub_area',
    item            : 'hub_item',
    panel           : 'hub_panel'
  },

  iframe            : 'iframe',
  include           : 'include',

  jumper            : 'jumper',

  layer             : {
    _               : 'layer',
    any             : 'layer_any',
    background      : 'layer_background',
    container       : 'layer_container',
    image           : 'layer_image',
    include         : 'layer_include',
    link            : 'layer_link',
    text            : 'layer_text',
    thumbnail       : 'layer_thumbnail',
    video           : 'layer_video'
  },
  layout            : {
    item            : 'layout_item',
    list            : 'layout_list'
  },
  listMenu          : 'listMenu',
  list              : {
    composite       : 'list_composite',
    note            : 'list_note',
    scroll          : 'list_scroll',
    text            : 'list_text'
  },
  login             : 'login',
  lookup            : 'lookup',

  map               : {
    leaflet         : 'map_leaflet'
  },

  media             : {
    audio           : 'media_image',
    document        : 'media_document',
    folder          : 'media_folder',
    image           : 'media_image',
    thread          : 'media_thread',
    ui              : 'media_ui',
    video           : 'media_video'
  },

  menu              : 'menu',
  modal             : 'modal',
  msgbox            : 'msgbox',

  note              : 'note',

  popup             : 'popup',
  progress          : 'progress',
  progress_bar      : 'progress_bar',
  profile           : 'profile',
  picture           : 'picture',
  pulldown          : {
    _               : 'pulldown',
    menu            : 'pulldown_menu',
    select          : 'pulldown_select'
  },

  qna               : 'qna',

  rss               : 'rss',

  search            : 'search',
  slide             : {
    _               : 'slide',  // Backward compatibility
    background      : 'slide_background',
    layer           : 'slide_layer',
    link            : 'slide_link',
    text            : 'slide_image',
    thumbnail       : 'slide_thumbnail'
  },
  slideBarre        : 'slideBarre',
  slider            : {
    _               : 'slider',
    vegas           : {
      _             : 'slider_vegas',
      layer         : 'slider_vegas_layer',
      slide         : 'slider_vegas_slide'
    },
    drumee          : {
      _             : 'slider_drumee',
      layer         : 'slider_drumee_layer',
      slide         : 'slider_drumee_slide'
    },
    kreatura        : {
      _             : 'slider_kreatura',
      layer         : 'slider_kreatura_layer',
      slide         : 'slider_kreatura_slide'
    }
  },

  slideshow         : 'slideshow',
  slurper           : 'slurper',

  spinner           : {
    jump            : "spinner_jump",
    lines           : "spinner_lines"
  },

  style            : {
    file            : 'style_file',
    item            : 'style_item',
    list            : 'style_list'
  },

  svg               : 'svg',

  text              : 'text',
  trigger           : 'trigger',
  twitter           : {
    feed            : 'twitter:feed'
  },

  uploader          : 'uploader',
  userClass         : 'userClass',
  utils: {
    wrapper       : "utils:wrapper",
    msgbox        : "utils:msgbox"
  },

  video             : {
    background      : 'video_background',
    box             : 'video_box',
    comment         : 'video_comment',
    jwplayer        : 'video_jwplayer',
    player          : 'video_player',
    thread          : 'video_thread'
  },

  template          : 'template',
  webrtc            : "webrtc",
  wrapper           : "wrapper"
};

module.exports = a;
