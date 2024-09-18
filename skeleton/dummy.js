// ==================================================================== *
//   Copyright Xialia.com  2011-2016                                    *
//   FILE : src/skeleton/blokc-nout-found
//   TYPE : conf component                                              *
// ==================================================================== *

const __skl_no_block = function(message) {
  let a;
  return a = {
    kind: "box",
    flow: "page",
    context: "page",
    styleOpt: {
      width: "100%",
      height: "auto",
      "background-color": "transparent",
      "min-height": "640"
    },
    userAttributes: {
      "data-justify": "center"
    },
    kids: [{
      styleOpt: {
        padding: "5px",
        width: "100%",
        height: "140px"
      },
      flow: "h",
      kind: "box",
      userAttributes: {
        "data-justify": "center"
      },
      kids: [{
          content: `${message}`,
          justify: "center",
          kind: "note",
          flow: "v",
          contentClass: "margin-auto-v",
          styleOpt: {
            width: "auto",
            height: "auto",
            padding: "10px",
            "background-color": "transparent"
          }
        }]
      }]
  };
};

module.exports = __skl_no_block;
