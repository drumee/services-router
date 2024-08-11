// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2015                                    *
//   FILE : src/drumee/lex/type/designer
//   MANDATORY: Type.s defintions for LETC parser and designer
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *


const a = {

  analytics       : 'analytics',
  bit             : {
    list          : 'designer_bit_list',
    radio         : 'designer_bit_radio'
  },

  banner          : 'designer_banner',
  box             : 'designer_box',
  button          : {
    anchor        : 'designer_button_anchor',
    blank         : 'designer_button_blank',
    broadcast     : 'designer_button_broadcast',
    nested        : 'designer_button_nested',
    rotate        : 'designer_button_rotate',
    toggle        : 'designer_button_toggle',
    trigger       : 'designer_button_trigger'
  },


  card            : 'designer_card',
  chart           : {
    line          : 'designer_chart_line',
    pie           : 'designer_chart_pie'
  },

  composite       : {
    box           : 'designer_composite_box',
    pulldown      : 'designer_composite_pulldown',
    visitor       : 'designer_composite_visitor',
    tmp           : 'designer_composite'
  },

  container       : 'designer_container',

  checkbox        : 'designer_checkbox',

  document        : 'designer_document',
  dropMenu        : 'designer_dropMenu',
  drumThreads     : 'designer_drumThreads',

  entry           : {
    available     : 'designer_entry_available',
    blank         : 'designer_entry_blank',
    hidden        : 'designer_entry_hidden',
    lookup        : 'designer_entry_lookup',
    password      : 'designer_entry_password',
    search        : 'designer_entry_search',
    text          : 'designer_entry_text',
    textarea      : 'designer_entry_textarea'
  },

  film            : 'designer:film',
  form            : 'designer:form',

  gallery         : {
    layer         : 'designer_gallery_layer',
    slide         : 'designer_gallery_slide',
    slider        : 'designer_gallery_slider'
  },

  helper          : {
    file          : 'designer_helper_file',
    media         : 'designer_helper_media',
    video         : 'designer_helper_video',
    widget        : 'designer_helper_widget'
  },
  hub             : {
    area          : 'designer_hub_area',
    item          : 'designer_hub_item',
    panel         : 'designer_hub_panel'
  },
  hull            : 'designer_hull',

  iframe          : 'designer_iframe',

  image           : {
    box           : 'designer_image_box',
    cropped       : 'designer_image_cropped',
    kropper       : 'designer_image_kropper',
    player        : 'designer_image_player',
    raw           : 'designer_image_raw',
    slider        : 'designer_image_slider',
    svg           : 'designer_image_svg',
    viewer        : 'designer_image_viewer'
  },

  include         : 'designer_include',

  layout          : {
    item          : 'designer_layout_item',
    list          : 'designer_layout_list'
  },
  jumper          : 'designer_jumper',
  listMenu        : 'designer_listMenu',
  list            : {
    composite     : 'designer_list_composite',
    note          : 'designer_list_note',
    scroll        : 'designer_list_scroll',
    text          : 'designer_list_text'
  },
  login           : 'designer_login',
  lookup          : 'designer_lookup',

  media           : {
    audio         : 'designer_media_audio',
    folder        : 'designer_media_folder',
    item          : 'designer_media_item',
    thread        : 'designer_media_threada',
    ui            : 'designer_media_ui'
  },
  menu            : 'designer_menu',
  modal           : 'designer_modal',
  msgbox          : 'designer_msgbox',

  note            : 'designer_note',

  profile         : 'designer_profile',
  progresse       : 'designer_progresse',
  progresse       : 'designer_progresse',
  progress_bar    : 'designer_progress_bar',
  pulldown        : {
    _             : 'designer_pulldown',
    menu          : 'designer_pulldown_menu',
    select        : 'designer_pulldown_select'
  },

  qna             : 'designer_qna',

  rss             : 'designer_rss',

  search          : 'designer_search',
  slide           : 'designer_slide',
  slideBarre      : 'designer_slideBarre',
  slider          : {
    drumee        : {
      _           : 'designer_slider_drumee',
      layer       : 'designer_slider_drumee_layer',
      slide       : 'designer_slider_drumee_slide'
    },
    kreatura      : {
      _           : 'designer_slider_kreatura',
      layer       : 'designer_slider_kreatura_layer',
      slide       : 'designer_slider_kreatura_slide'
    },
    vegas      : {
      _           : 'designer_slider_vegas',
      layer       : 'designer_slider_vegas_layer',
      slide       : 'designer_slider_vegas_slide'
    }
  },

  slurper         : 'designer_slurper',

  svg             : 'designer_svg',

  template        : 'designer_template',
  text            : 'designer_text',
  trigger         : 'designer_trigger',

  twit            : {
    thread        : 'designer_twit_thread'
  },
  twitter         : {
    feed          : 'designer_twitter_feed'
  },

  uploader        : 'designer_uploader',
  use             : {
    page          : 'designer_use_page',
    slider        : 'designer_use_slider'
  },

  video           : {
    background    : 'designer_video_background',
    box           : 'designer_video_box',
    comment       : 'designer_video_comment',
    jwplayer      : 'designer_video_jwplayer',
    player        : 'designer_video_player',
    thread        : 'designer_video_thread'
  },

  wrapper         : "designer_wrapper"
};

module.exports = a;
