"use strict";

const loader = {
  script(_fileName) {
    let script = document.createElement("script");
    script.setAttribute(
      "src",
      info.extension.folder +
        `/resources/scripts/${_fileName}.js` +
        "?" +
        info.extension.version +
        "&built=" +
        new Date().getTime()
    );
    script.setAttribute("type", "text/javascript");
    document.body.appendChild(script);
  },

  html(_fileName, cb) {
    jQuery.ajax({
      url:
        info.extension.folder +
        `/resources/html/${_fileName}.html` +
        "?" +
        info.extension.version +
        "&built=" +
        new Date().getTime(),
      dataType: "html",
      success: (html) => {
        if (cb) cb(html);
      },
    });
  },

  css(_file) {
    let link = document.createElement("link");
    link.setAttribute(
      "href",
      info.extension.folder +
        "/resources/css/" +
        _file +
        ".css" +
        "?" +
        info.extension.version +
        "&built=" +
        new Date().getTime()
    );
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "stylesheet");
    document.head.appendChild(link);
  },
};
