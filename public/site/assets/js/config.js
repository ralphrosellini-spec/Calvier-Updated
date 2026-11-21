(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.config = factory());
})(this, (function () { 'use strict';

  if (typeof window !== 'undefined') {
    window._ = window._ || {};
    if (!window._.merge) {
      window._.merge = function (target) {
        target = target || {};
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          if (source && typeof source === 'object') {
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                  target[key] = window._.merge(target[key] || {}, source[key]);
                } else {
                  target[key] = source[key];
                }
              }
            }
          }
        }
        return target;
      };
    }
  }

  const configQueryMap={"navbar-vertical-collapsed":"phoenixIsNavbarVerticalCollapsed","color-scheme":"phoenixTheme","navigation-type":"phoenixNavbarPosition","vertical-navbar-appearance":"phoenixNavbarVerticalStyle","horizontal-navbar-shape":"phoenixNavbarTopShape","horizontal-navbar-appearance":"phoenixNavbarTopStyle"},initialConfig={phoenixIsNavbarVerticalCollapsed:!1,phoenixTheme:"light",phoenixNavbarTopStyle:"default",phoenixNavbarVerticalStyle:"default",phoenixNavbarPosition:"vertical",phoenixNavbarTopShape:"default",phoenixIsRTL:!1,phoenixSupportChat:!0},CONFIG={...initialConfig},setConfig=(e,a=!0)=>{Object.keys(e).forEach((t=>{CONFIG[t]=e[t],a&&localStorage.setItem(t,e[t]);}));},resetConfig=()=>{Object.keys(initialConfig).forEach((e=>{CONFIG[e]=initialConfig[e],localStorage.setItem(e,initialConfig[e]);}));},urlSearchParams=new URLSearchParams(window.location.search),params=Object.fromEntries(urlSearchParams.entries());Object.keys(params).length>0&&Object.keys(params).includes("theme-control")&&(resetConfig(),Object.keys(params).forEach((e=>{configQueryMap[e]&&localStorage.setItem(configQueryMap[e],params[e]);}))),Object.keys(CONFIG).forEach((e=>{if(null===localStorage.getItem(e))localStorage.setItem(e,CONFIG[e]);else try{setConfig({[e]:JSON.parse(localStorage.getItem(e))});}catch{setConfig({[e]:localStorage.getItem(e)});}})),JSON.parse(localStorage.getItem("phoenixIsNavbarVerticalCollapsed"))&&document.documentElement.classList.add("navbar-vertical-collapsed"),"dark"===localStorage.getItem("phoenixTheme")?document.documentElement.setAttribute("data-bs-theme","dark"):"auto"===localStorage.getItem("phoenixTheme")&&document.documentElement.setAttribute("data-bs-theme",window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),"horizontal"===localStorage.getItem("phoenixNavbarPosition")&&document.documentElement.setAttribute("data-navigation-type","horizontal"),"combo"===localStorage.getItem("phoenixNavbarPosition")&&document.documentElement.setAttribute("data-navigation-type","combo");var config = {config:CONFIG,reset:resetConfig,set:setConfig};

  // Explicitly assign to window so Next.js/Turbopack always has window.config available
  // regardless of how the IIFE `this` context is resolved at module execution time.
  if (typeof window !== 'undefined') {
    if (window.config && window.config.config) {
      window.config.config = Object.assign(window.config.config, CONFIG);
      window.config.reset = resetConfig;
      window.config.set = setConfig;
    } else {
      window.config = config;
    }
  }

  return config;

}));
//# sourceMappingURL=config.js.map
