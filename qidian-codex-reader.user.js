// ==UserScript==
// @name         起点读书 · Codex 阅读器
// @namespace    https://www.qidian.com/
// @version      0.1.0
// @description  把起点章节页伪装成 Codex 桌面端工作界面（左侧会话列表 / 中间正文 / 底部输入框），点击段落可在右侧查看批注。
// @author       you
// @match        https://www.qidian.com/chapter/*
// @match        https://read.qidian.com/chapter/*
// @icon         https://www.qidian.com/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /* ============================== 常量 ============================== */

  const STYLE_ID = "cxq-reader-style";
  const ROOT_ID = "cxq-root";
  const BODY_LOCK = "cxq-lock";
  const SETTINGS_KEY = "cxq:settings:v2";
  const CHAPTER_RE = /\/chapter\/(\d+)\/(\d+)/;

  const prefersDark = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // 尺寸对齐 Codex 桌面端：正文 13.5px / 1.75，版心 760
  const DEFAULT_SETTINGS = {
    theme: prefersDark ? "dark" : "light",
    fontSize: 13.5,
    lineHeight: 1.75,
    width: 760,
    font: "sans",
    rail: true
  };

  const num = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

  /* ============================== 图标 ============================== */

  const ICONS = {
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
    pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
    gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    dots: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`,
    file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v5h5"/><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 9 12 14 17 9"/></svg>`,
    panel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><line x1="14.5" y1="4" x2="14.5" y2="20"/></svg>`,
    quote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1.2-5.3A8.5 8.5 0 1 1 21 11.5z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a7.5 7.5 0 1 0 11 11Z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    left: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="14 6 8 12 14 18"/></svg>`,
    right: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 6 16 12 10 18"/></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>`,
    like: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>`,
    login: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
  };

  /* ============================== 样式 ============================== */

  const CSS = `#${ROOT_ID}{
  --cx-font-ui:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --cx-radius:10px;
  --cx-rail-w:306px;
  --cx-panel-w:400px;
  --cx-read-w:760px;
  --cx-read-size:13.5px;
  --cx-read-lh:1.75;
  --cx-read-font:var(--cx-font-ui);

  position:fixed;inset:0;z-index:2147483000;
  display:flex;align-items:stretch;
  background:var(--cx-bg);color:var(--cx-text);
  font-family:var(--cx-font-ui);font-size:14px;line-height:1.55;
  -webkit-font-smoothing:antialiased;overscroll-behavior:none;
}

/* ---- Codex 深色 ---- */
#${ROOT_ID}[data-theme="dark"]{
  --cx-rail-bg:#27353b;
  --cx-rail-bg-hover:#2e3d44;
  --cx-rail-bg-active:#35454d;
  --cx-rail-text:#dedede;
  --cx-rail-text-dim:#96a0a4;
  --cx-rail-text-faint:#6c787d;
  --cx-rail-border:rgba(255,255,255,.06);
  --cx-rail-btn:rgba(255,255,255,.05);
  --cx-rail-on:#3a4a52;

  --cx-bg:#181818;
  --cx-bg-raised:#242424;
  --cx-bg-inset:#1c1c1c;
  --cx-bg-deep:#161616;
  --cx-panel-bg:#181818;
  --cx-composer-bg:#2a2a2a;

  --cx-border:rgba(255,255,255,.08);
  --cx-border-soft:rgba(255,255,255,.05);
  --cx-border-strong:rgba(255,255,255,.14);

  --cx-text:#ececec;
  --cx-text-secondary:#b9b9b9;
  --cx-text-dim:#909090;
  --cx-text-faint:#646464;

  --cx-blue:#83c3fe;
  --cx-blue-soft:rgba(131,195,254,.15);
  --cx-chip-bg:#2e2e2e;
  --cx-btn-hover:#333333;
  --cx-wash:rgba(255,255,255,.035);
  --cx-scroll-thumb:rgba(255,255,255,.13);
  --cx-send-bg:#8a8a8a;
  --cx-send-icon:#1f1f1f;
}

/* ---- Codex 浅色 ---- */
#${ROOT_ID}[data-theme="light"]{
  --cx-rail-bg:#e7edee;
  --cx-rail-bg-hover:#dde4e6;
  --cx-rail-bg-active:#d2dbdd;
  --cx-rail-text:#2c3438;
  --cx-rail-text-dim:#6e6f72;
  --cx-rail-text-faint:#97989a;
  --cx-rail-border:rgba(0,0,0,.07);
  --cx-rail-btn:rgba(0,0,0,.05);
  --cx-rail-on:#f7f9f9;

  --cx-bg:#ffffff;
  --cx-bg-raised:#f7f7f7;
  --cx-bg-inset:#fafafa;
  --cx-bg-deep:#ebebeb;
  --cx-panel-bg:#ffffff;
  --cx-composer-bg:#ffffff;

  --cx-border:rgba(0,0,0,.10);
  --cx-border-soft:rgba(0,0,0,.06);
  --cx-border-strong:rgba(0,0,0,.16);

  --cx-text:#1b1c1e;
  --cx-text-secondary:#55565a;
  --cx-text-dim:#737477;
  --cx-text-faint:#a2a3a5;

  --cx-blue:#2a98ff;
  --cx-blue-soft:rgba(42,152,255,.13);
  --cx-chip-bg:#ededed;
  --cx-btn-hover:#f0f0f0;
  --cx-wash:rgba(0,0,0,.04);
  --cx-scroll-thumb:rgba(0,0,0,.18);
  --cx-send-bg:#3c3c3c;
  --cx-send-icon:#ffffff;
}

body.${BODY_LOCK}{overflow:hidden!important;}
body.${BODY_LOCK} > *:not(#${ROOT_ID}){display:none!important;}

#${ROOT_ID} *,#${ROOT_ID} *::before,#${ROOT_ID} *::after{box-sizing:border-box;}
#${ROOT_ID} button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
#${ROOT_ID} a{color:inherit;text-decoration:none;}
#${ROOT_ID} img{display:block;max-width:100%;}
#${ROOT_ID} p,#${ROOT_ID} h1,#${ROOT_ID} h2,#${ROOT_ID} ul,#${ROOT_ID} li{margin:0;padding:0;}
#${ROOT_ID} ul{list-style:none;}
#${ROOT_ID} *::-webkit-scrollbar{width:8px;height:8px;}
#${ROOT_ID} *::-webkit-scrollbar-track{background:transparent;}
#${ROOT_ID} *::-webkit-scrollbar-thumb{background:var(--cx-scroll-thumb);border-radius:4px;}

/* ============================ 左栏 ============================ */
#${ROOT_ID} .cxq-rail{
  position:relative;
  width:var(--cx-rail-w);flex:0 0 var(--cx-rail-w);min-height:0;
  display:flex;flex-direction:column;user-select:none;
  background:var(--cx-rail-bg);color:var(--cx-rail-text);
  border-right:1px solid var(--cx-rail-border);
  transition:margin-left .18s ease;
}
#${ROOT_ID}.rail-collapsed .cxq-rail{margin-left:calc(var(--cx-rail-w) * -1);}

#${ROOT_ID} .cxq-traffic{
  height:46px;flex:none;display:flex;align-items:center;gap:8px;padding:0 14px;
}
#${ROOT_ID} .cxq-dot{
  width:12px;height:12px;border-radius:50%;flex:none;
  background:rgba(128,128,128,.32);
}
#${ROOT_ID} .cxq-dot.r{background:#ff5f57;}
#${ROOT_ID} .cxq-dot.y{background:#febc2e;}
#${ROOT_ID} .cxq-dot.g{background:#28c840;}
#${ROOT_ID} .cxq-traffic .cxq-rail-icon{margin-left:auto;}

#${ROOT_ID} .cxq-rail-icon{
  width:22px;height:22px;flex:none;display:grid;place-items:center;
  border-radius:6px;color:var(--cx-rail-text-dim);
}
#${ROOT_ID} .cxq-rail-icon svg{width:19px;height:19px;padding:2px;}
#${ROOT_ID} .cxq-rail-icon:hover{background:var(--cx-rail-bg-hover);color:var(--cx-rail-text);}

#${ROOT_ID} .cxq-rail-brand{
  display:flex;align-items:center;gap:4px;
  padding:2px 12px 10px 14px;flex:none;
}
#${ROOT_ID} .cxq-brand{
  font-size:17px;font-weight:600;letter-spacing:.2px;color:var(--cx-rail-text);
  white-space:nowrap;
}
#${ROOT_ID} .cxq-caret{width:12px;height:12px;color:var(--cx-rail-text-dim);flex:none;}
#${ROOT_ID} .cxq-caret svg{width:12px;height:12px;}
#${ROOT_ID} .cxq-brand-actions{margin-left:auto;display:flex;gap:2px;}

#${ROOT_ID} .cxq-rail-scroll{flex:1;min-height:0;overflow-y:auto;padding-bottom:8px;}
#${ROOT_ID} .cxq-rail-nav{padding:2px 8px;display:flex;flex-direction:column;gap:1px;}
#${ROOT_ID} .cxq-rail-items{padding:0 8px;display:flex;flex-direction:column;gap:1px;}

#${ROOT_ID} .cxq-rail-item{
  display:flex;align-items:center;gap:9px;width:100%;text-align:left;
  padding:5px 10px;border-radius:var(--cx-radius);
  font-size:13.5px;color:var(--cx-rail-text);cursor:pointer;
  white-space:nowrap;overflow:hidden;
}
#${ROOT_ID} .cxq-rail-item:hover{background:var(--cx-rail-bg-hover);}
#${ROOT_ID} .cxq-rail-item.active{background:var(--cx-rail-bg-active);}
#${ROOT_ID} .cxq-rail-item svg{width:16px;height:16px;flex:none;color:var(--cx-rail-text-dim);}
#${ROOT_ID} .cxq-rail-item .cxq-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#${ROOT_ID} .cxq-rail-item.cxq-static{cursor:default;color:var(--cx-rail-text-dim);}
#${ROOT_ID} .cxq-rail-item.cxq-static:hover{background:none;}

#${ROOT_ID} .cxq-rail-section{padding:18px 18px 4px;font-size:12px;color:var(--cx-rail-text-faint);}

#${ROOT_ID} .cxq-rail-sub{
  padding:4px 10px;border-radius:8px;cursor:pointer;
  display:flex;align-items:center;gap:6px;
  font-size:13px;color:var(--cx-rail-text-dim);
}
#${ROOT_ID} .cxq-rail-sub:hover{background:var(--cx-rail-bg-hover);color:var(--cx-rail-text);}
#${ROOT_ID} .cxq-rail-sub.active{background:var(--cx-rail-bg-active);color:var(--cx-rail-text);}
#${ROOT_ID} .cxq-rail-sub .cxq-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#${ROOT_ID} .cxq-rail-empty{padding:2px 10px 4px;font-size:12.5px;color:var(--cx-rail-text-faint);}

#${ROOT_ID} .cxq-rail-foot{
  flex:none;display:flex;align-items:center;gap:8px;
  padding:8px;border-top:1px solid var(--cx-rail-border);
}
#${ROOT_ID} .cxq-rail-user{
  flex:1;min-width:0;display:flex;align-items:center;gap:10px;
  padding:6px 10px;border-radius:var(--cx-radius);font-size:13.5px;
  color:var(--cx-rail-text-dim);cursor:pointer;
}
#${ROOT_ID} .cxq-rail-user:hover,#${ROOT_ID} .cxq-rail-user.on{background:var(--cx-rail-bg-hover);color:var(--cx-rail-text);}
#${ROOT_ID} .cxq-rail-user svg{width:17px;height:17px;flex:none;color:var(--cx-rail-text-dim);}

/* 隐藏式设置面板 */
#${ROOT_ID} .cxq-settings{
  position:absolute;left:8px;right:8px;bottom:52px;z-index:9;
  display:none;padding:6px;
  background:var(--cx-bg-raised);color:var(--cx-text);
  border:1px solid var(--cx-border);border-radius:12px;
  box-shadow:0 18px 44px rgba(0,0,0,.32);
}
#${ROOT_ID} .cxq-settings.open{display:block;}
#${ROOT_ID} .cxq-srow{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:5px 8px;font-size:12.5px;color:var(--cx-text-secondary);
}
#${ROOT_ID} .cxq-ssep{height:1px;background:var(--cx-border-soft);margin:5px 4px;}
#${ROOT_ID} .cxq-seg{display:inline-flex;gap:1px;padding:2px;border-radius:8px;background:var(--cx-bg-inset);}
#${ROOT_ID} .cxq-seg button{padding:2px 8px;border-radius:6px;font-size:11.5px;color:var(--cx-text-dim);}
#${ROOT_ID} .cxq-seg button.on{background:var(--cx-chip-bg);color:var(--cx-text);}
#${ROOT_ID} .cxq-step{display:inline-flex;align-items:center;gap:1px;}
#${ROOT_ID} .cxq-step button{
  width:20px;height:20px;border-radius:6px;font-size:12px;line-height:1;
  background:var(--cx-chip-bg);color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-step button:hover{color:var(--cx-text);}
#${ROOT_ID} .cxq-step span{min-width:32px;text-align:center;font-size:12px;color:var(--cx-text);font-variant-numeric:tabular-nums;}
#${ROOT_ID} .cxq-exit{
  display:flex;align-items:center;gap:6px;width:100%;
  padding:5px 8px;border-radius:6px;font-size:12.5px;color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-exit:hover{background:var(--cx-btn-hover);color:var(--cx-text);}
#${ROOT_ID} .cxq-exit svg{width:13px;height:13px;}

/* ============================ 中栏 ============================ */
#${ROOT_ID} .cxq-main{
  flex:1;min-width:0;display:flex;flex-direction:column;position:relative;
  background:var(--cx-bg);color:var(--cx-text);
}
#${ROOT_ID} .cxq-topbar{
  height:46px;flex:none;display:flex;align-items:center;gap:8px;
  padding:0 12px;border-bottom:1px solid var(--cx-border-soft);
  color:var(--cx-text-secondary);
}
#${ROOT_ID} .cxq-icon-btn{
  padding:5px;border-radius:6px;display:grid;place-items:center;
  color:var(--cx-text-dim);flex:none;
}
#${ROOT_ID} .cxq-icon-btn svg{width:16px;height:16px;}
#${ROOT_ID} .cxq-icon-btn:hover{background:var(--cx-bg-raised);color:var(--cx-text);}
#${ROOT_ID} .cxq-icon-btn.on{background:var(--cx-blue-soft);color:var(--cx-blue);}
#${ROOT_ID} .cxq-crumb{display:flex;align-items:center;gap:7px;font-size:13px;min-width:0;}
#${ROOT_ID} .cxq-crumb .cxq-proj{color:var(--cx-text);white-space:nowrap;}
#${ROOT_ID} .cxq-crumb .cxq-model{color:var(--cx-text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#${ROOT_ID} .cxq-spacer{flex:1;}
#${ROOT_ID} .cxq-prog{flex:none;height:2px;background:var(--cx-border-soft);}
#${ROOT_ID} .cxq-prog i{display:block;height:100%;width:0;background:var(--cx-blue);opacity:.55;transition:width .12s linear;}

#${ROOT_ID} .cxq-scroll{flex:1;min-height:0;overflow-y:auto;padding:28px 40px 24px;scrollbar-width:thin;}
#${ROOT_ID} .cxq-article{max-width:var(--cx-read-w);margin:0 auto;}

#${ROOT_ID} .cxq-meta{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  font-size:12.5px;color:var(--cx-text-faint);opacity:.6;padding:3px 2px;margin:0 0 12px;
}
#${ROOT_ID} .cxq-meta .cxq-dot-s{width:2px;height:2px;border-radius:50%;background:currentColor;}

#${ROOT_ID} .cxq-p{
  position:relative;padding:2px 8px;margin:0 -8px 9px;
  border-radius:8px;cursor:pointer;
  font-family:var(--cx-read-font);font-size:var(--cx-read-size);line-height:var(--cx-read-lh);
  color:var(--cx-text);text-align:justify;text-justify:inter-ideograph;
  transition:background .15s ease;
}
#${ROOT_ID} .cxq-p:hover{background:var(--cx-wash);}
#${ROOT_ID} .cxq-p.is-active{background:var(--cx-blue-soft);}
#${ROOT_ID} .cxq-p-badge{
  display:none;align-items:center;gap:2px;vertical-align:super;
  margin-left:3px;font-family:var(--cx-font-ui);font-size:10px;line-height:1;font-style:normal;
  color:var(--cx-blue);opacity:.55;white-space:nowrap;
  transition:opacity .15s;
}
#${ROOT_ID} .cxq-p-badge svg{width:9px;height:9px;}
#${ROOT_ID} .cxq-p.has-review .cxq-p-badge{display:inline-flex;}
#${ROOT_ID} .cxq-p:hover .cxq-p-badge{opacity:1;}

/* 章节卡片（伪装成 Codex 的 Open 卡片） */
#${ROOT_ID} .cxq-card{
  display:flex;align-items:center;gap:10px;margin:18px 0 4px;
  padding:10px 12px;border:1px solid var(--cx-border);border-radius:12px;
  background:var(--cx-bg-raised);cursor:pointer;transition:.15s;
}
#${ROOT_ID} .cxq-card:hover{border-color:var(--cx-border-strong);}
#${ROOT_ID} .cxq-card.disabled{opacity:.55;cursor:default;}
#${ROOT_ID} .cxq-card-ico{
  width:26px;height:26px;flex:none;border-radius:8px;display:grid;place-items:center;
  background:var(--cx-bg-inset);color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-card-ico svg{width:14px;height:14px;}
#${ROOT_ID} .cxq-card-body{flex:1;min-width:0;}
#${ROOT_ID} .cxq-card-title{font-size:13px;color:var(--cx-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#${ROOT_ID} .cxq-card-sub{font-size:11.5px;color:var(--cx-text-faint);margin-top:2px;}
#${ROOT_ID} .cxq-card-btn{
  flex:none;height:26px;padding:0 11px;border-radius:7px;
  border:1px solid var(--cx-border);background:var(--cx-bg);
  font-size:12px;color:var(--cx-text-secondary);
}
#${ROOT_ID} .cxq-card:hover .cxq-card-btn{color:var(--cx-text);border-color:var(--cx-border-strong);}

/* 底部输入框（Codex composer） */
#${ROOT_ID} .cxq-composer-wrap{flex:none;padding:8px 16px 14px;}
#${ROOT_ID} .cxq-composer{
  width:100%;max-width:600px;margin:0 auto;
  background:var(--cx-composer-bg);border:1px solid var(--cx-border);
  border-radius:16px;padding:10px 12px 8px;
}
#${ROOT_ID} .cxq-md-edit{
  position:relative;min-height:44px;max-height:180px;overflow-y:auto;outline:none;
  font-size:14px;line-height:1.65;color:var(--cx-text);
  word-break:break-word;white-space:pre-wrap;cursor:text;
}
#${ROOT_ID} .cxq-md-edit:not(.has-content)::before{
  content:attr(data-placeholder);position:absolute;left:0;top:0;
  color:var(--cx-text-faint);pointer-events:none;
}
#${ROOT_ID} .cxq-composer-bar{display:flex;align-items:center;gap:4px;margin-top:6px;}
#${ROOT_ID} .cxq-cbtn{
  display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 7px;
  border-radius:6px;font-size:12px;color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-cbtn:hover{background:var(--cx-btn-hover);color:var(--cx-text);}
#${ROOT_ID} .cxq-cbtn svg{width:13px;height:13px;}
#${ROOT_ID} .cxq-cmodel{
  margin-left:auto;display:inline-flex;align-items:center;gap:4px;
  font-size:12px;color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-cmodel svg{width:11px;height:11px;}
#${ROOT_ID} .cxq-send{
  width:26px;height:26px;flex:none;border-radius:50%;display:grid;place-items:center;
  background:var(--cx-send-bg);color:var(--cx-send-icon);margin-left:2px;
}
#${ROOT_ID} .cxq-send svg{width:14px;height:14px;}

/* ============================ 右栏（批注） ============================ */
#${ROOT_ID} .cxq-panel{
  width:0;flex:none;overflow:hidden;position:relative;
  background:var(--cx-panel-bg);border-left:1px solid transparent;
  transition:width .22s ease,border-color .22s ease;
}
#${ROOT_ID}.panel-open .cxq-panel{width:var(--cx-panel-w);border-left-color:var(--cx-border-soft);}
#${ROOT_ID} .cxq-panel-inner{width:var(--cx-panel-w);height:100%;display:flex;flex-direction:column;}
#${ROOT_ID} .cxq-panel-head{
  height:42px;flex:none;display:flex;align-items:center;gap:8px;
  padding:0 10px 0 14px;background:var(--cx-bg-deep);
  border-bottom:1px solid var(--cx-border-soft);
}
#${ROOT_ID} .cxq-panel-head svg{width:13px;height:13px;color:var(--cx-text-dim);flex:none;}
#${ROOT_ID} .cxq-panel-title{font-size:12.5px;font-weight:500;color:var(--cx-text);}
#${ROOT_ID} .cxq-panel-count{flex:1;font-size:11.5px;color:var(--cx-text-dim);}
#${ROOT_ID} .cxq-panel-scroll{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 32px;}

#${ROOT_ID} .cxq-quote{
  position:relative;margin-bottom:10px;padding:10px 12px 10px 14px;
  border-radius:8px;background:var(--cx-bg-inset);
  font-size:12.5px;line-height:1.7;color:var(--cx-text-secondary);
  display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;
}
#${ROOT_ID} .cxq-quote::before{
  content:"";position:absolute;left:0;top:10px;bottom:10px;width:2px;border-radius:2px;background:var(--cx-blue);
}

#${ROOT_ID} .cxq-cm{display:flex;gap:8px;padding:11px 0;border-bottom:1px solid var(--cx-border-soft);}
#${ROOT_ID} .cxq-cm:last-child{border-bottom:0;}
#${ROOT_ID} .cxq-cm-av{
  width:24px;height:24px;flex:0 0 24px;border-radius:50%;object-fit:cover;
  background:var(--cx-chip-bg);display:grid;place-items:center;overflow:hidden;
  font-size:11px;font-weight:600;color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-cm-body{flex:1;min-width:0;}
#${ROOT_ID} .cxq-cm-top{display:flex;align-items:center;flex-wrap:wrap;}
#${ROOT_ID} .cxq-cm-nick{font-size:12.5px;font-weight:600;color:var(--cx-text);}
#${ROOT_ID} .cxq-cm-nick:hover{color:var(--cx-blue);}
#${ROOT_ID} .cxq-cm-lv{
  margin-left:5px;padding:0 4px;border-radius:4px;font-size:10px;line-height:15px;
  background:var(--cx-chip-bg);color:var(--cx-text-dim);
}
#${ROOT_ID} .cxq-cm-floor{margin-left:6px;font-size:11px;color:var(--cx-text-faint);}
#${ROOT_ID} .cxq-cm-text{
  margin-top:3px;font-size:13px;line-height:1.65;color:var(--cx-text-secondary);
  white-space:pre-wrap;word-break:break-word;
}
#${ROOT_ID} .cxq-cm-foot{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:11px;color:var(--cx-text-faint);}
#${ROOT_ID} .cxq-cm-foot svg{width:10px;height:10px;}
#${ROOT_ID} .cxq-cm-like{display:inline-flex;align-items:center;gap:3px;}

#${ROOT_ID} .cxq-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;padding:46px 10px;font-size:12.5px;color:var(--cx-text-faint);text-align:center;
}
#${ROOT_ID} .cxq-empty svg{width:20px;height:20px;opacity:.45;}
#${ROOT_ID} .cxq-skel{
  height:11px;border-radius:6px;margin-bottom:9px;
  background:linear-gradient(90deg,var(--cx-wash),var(--cx-border),var(--cx-wash));
  background-size:200% 100%;animation:cxq-shine 1.3s linear infinite;
}
#${ROOT_ID} .cxq-skel.w60{width:60%;} #${ROOT_ID} .cxq-skel.w90{width:90%;} #${ROOT_ID} .cxq-skel.w75{width:75%;}
@keyframes cxq-shine{0%{background-position:120% 0;}100%{background-position:-20% 0;}}

#${ROOT_ID} .cxq-err{padding:26px 8px;text-align:center;font-size:12.5px;color:var(--cx-text-dim);}
#${ROOT_ID} .cxq-err button{
  margin-top:10px;height:28px;padding:0 14px;border-radius:8px;
  border:1px solid var(--cx-border);background:var(--cx-bg-raised);font-size:12px;color:var(--cx-text);
}
#${ROOT_ID} .cxq-err button:hover{background:var(--cx-btn-hover);}

#${ROOT_ID} .cxq-toast{
  position:absolute;left:50%;bottom:96px;z-index:20;
  transform:translate(-50%,12px);opacity:0;pointer-events:none;
  padding:7px 14px;border-radius:8px;border:1px solid var(--cx-border);
  background:var(--cx-bg-raised);color:var(--cx-text);font-size:12.5px;
  box-shadow:0 10px 30px rgba(0,0,0,.24);transition:opacity .2s,transform .2s;
}
#${ROOT_ID} .cxq-toast.show{opacity:1;transform:translate(-50%,0);}

/* ---------- 窄屏：批注改为抽屉 ---------- */
@media (max-width:1280px){
  #${ROOT_ID} .cxq-panel{position:absolute;top:0;right:0;height:100%;z-index:5;box-shadow:-18px 0 48px rgba(0,0,0,.26);}
}
@media (max-width:1000px){
  #${ROOT_ID} .cxq-scroll{padding:20px 22px 20px;}
  #${ROOT_ID} .cxq-panel{width:0;}
  #${ROOT_ID}.panel-open .cxq-panel{width:min(92vw,var(--cx-panel-w));}
  #${ROOT_ID} .cxq-panel-inner{width:100%;}
  #${ROOT_ID} .cxq-rail{position:absolute;top:0;left:0;bottom:0;z-index:6;box-shadow:8px 0 28px rgba(0,0,0,.28);transition:transform .18s ease;}
  #${ROOT_ID}.rail-collapsed .cxq-rail{margin-left:0;transform:translateX(-105%);}
}`;

  /* ============================== 工具 ============================== */

  const escapeHtml = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const stripTags = (s) => String(s ?? "").replace(/<[^>]*>/g, "");

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function relativeTime(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 60e3) return "刚刚";
    if (diff < 3600e3) return `${Math.floor(diff / 60e3)} 分钟前`;
    if (diff < 86400e3) return `${Math.floor(diff / 3600e3)} 小时前`;
    if (diff < 7 * 86400e3) return `${Math.floor(diff / 86400e3)} 天前`;
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  }

  function formatTime(v) {
    if (v == null || v === "") return "";
    const s = String(v);
    let d = null;
    if (/^\d{10}$/.test(s)) d = new Date(Number(s) * 1000);
    else if (/^\d{13}$/.test(s)) d = new Date(Number(s));
    else d = new Date(s.replace(/-/g, "/"));
    if (!d || Number.isNaN(d.getTime())) return s;
    return relativeTime(d);
  }

  function readCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  const csrfToken = () => readCookie("_csrfToken") || readCookie("_csrfToken_");

  // 未成功挂载时的轻提示（不阻断原页面，方便排查选择器失效）
  function debugNotice(msg) {
    console.warn("[起点 Codex 阅读器]", msg);
    if (document.getElementById("cxq-notice")) return;
    const el = document.createElement("div");
    el.id = "cxq-notice";
    el.textContent = "Codex 阅读器：" + msg;
    el.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:320px;" +
      "padding:10px 14px;border-radius:10px;background:#242424;color:#ececec;" +
      "font:12.5px/1.6 -apple-system,'PingFang SC',sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);" +
      "border:1px solid rgba(255,255,255,.1);opacity:0;transition:opacity .25s;";
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 400);
    }, 6000);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }

  /* ============================== 正文提取 ============================== */

  const MAIN_SELECTORS = [
    "#reader-content main",
    "#reader-content > div > div > main",
    "#reader-content .read-content",
    "#reader-content",
    "#chaptercontent",
    ".read-content",
    ".reader-content",
    "article"
  ];

  function pickMain() {
    for (const sel of MAIN_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && (el.innerText || "").trim().length > 250) return el;
    }
    return null;
  }

  function waitForMain(timeout = 20000) {
    return new Promise((resolve) => {
      const found = pickMain();
      if (found) return resolve(found);
      const start = Date.now();
      const timer = setInterval(() => {
        const el = pickMain();
        if (el) { clearInterval(timer); resolve(el); }
        else if (Date.now() - start > timeout) { clearInterval(timer); resolve(null); }
      }, 400);
    });
  }

  const ALLOW_EM = /^(EM|I)$/;
  const ALLOW_STRONG = /^(B|STRONG)$/;
  // 正文里混入的交互组件（段评角标、本章说按钮等）直接丢弃，避免文字被污染
  const SKIP_TAGS = /^(SCRIPT|STYLE|SVG|BUTTON|IMG|INPUT|TEXTAREA|SELECT|VIDEO|AUDIO|IFRAME|CANVAS)$/;
  const SKIP_HINT = /(comment|review|segment|praise|speak|toolbar|chapter-btn|operate)/i;

  function shouldSkip(el) {
    if (SKIP_TAGS.test(el.tagName)) return true;
    const cls = typeof el.className === "string" ? el.className : "";
    if (cls && SKIP_HINT.test(cls)) return true;
    if (el.id && SKIP_HINT.test(el.id)) return true;
    if (el.hasAttribute("data-segmentid") || el.hasAttribute("data-segment")) return true;
    return false;
  }

  function serializeInline(root) {
    let out = "";
    const walk = (node) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) out += escapeHtml(c.nodeValue);
        else if (c.nodeType === 1) {
          const tag = c.tagName;
          if (tag === "BR") out += " ";
          else if (shouldSkip(c)) return;
          else if (ALLOW_EM.test(tag)) { out += "<em>"; walk(c); out += "</em>"; }
          else if (ALLOW_STRONG.test(tag)) { out += "<strong>"; walk(c); out += "</strong>"; }
          else walk(c);
        }
      });
    };
    walk(root);
    return out.replace(/&nbsp;|\u00a0/g, " ").replace(/[ \t\r\f\v]+/g, " ").trim();
  }

  function toParagraphs(main) {
    const html = main.innerHTML || "";
    let chunks;
    if (/<br\s*\/?>\s*<br\s*\/?>/i.test(html)) {
      chunks = html.split(/<br\s*\/?>\s*<br\s*\/?>/i);
    } else {
      const ps = main.querySelectorAll("p");
      if (ps.length > 2) chunks = Array.from(ps, (p) => p.innerHTML);
      else chunks = String(main.innerText || "").split(/\n{2,}/).map((t) => escapeHtml(t));
    }
    const out = [];
    for (const chunk of chunks) {
      const tmp = document.createElement("div");
      tmp.innerHTML = chunk;
      const s = serializeInline(tmp).replace(/^[\s\u00a0\u3000]+/, "");
      if (!stripTags(s).replace(/[\s\u00a0]/g, "")) continue;
      out.push(s);
    }
    return out;
  }

  function readMeta() {
    const m = location.pathname.match(CHAPTER_RE);
    const bookId = m ? m[1] : "";
    const chapterId = m ? m[2] : "";

    let bookName = "";
    const bread = document.querySelector("#r-breadcrumbs a") || document.querySelector("#r-breadcrumbs");
    if (bread) bookName = (bread.innerText || "").trim();
    if (!bookName) {
      const t = document.title || "";
      const parts = t.split(/[_\-|]/).map((s) => s.trim()).filter(Boolean);
      bookName = parts[1] || "";
    }
    bookName = bookName.replace(/（[^）]*）|\([^)]*\)/g, "").trim();

    let title = "";
    const h1 = document.querySelector("#reader-content h1") || document.querySelector("h1");
    if (h1) title = (h1.innerText || "").trim();
    if (!title) title = (document.title || "").split("_")[0].trim();

    return { bookId, chapterId, bookName, title };
  }

  function findChapterLink(kind) {
    const kw = kind === "next" ? "下一章" : "上一章";
    const nodes = Array.from(document.querySelectorAll("a,button"));
    for (const el of nodes) {
      const text = (el.innerText || "").replace(/\s/g, "");
      if (text && text.length <= 8 && text.includes(kw)) {
        if (el.tagName === "A" && el.href) return el.href;
        const href = el.getAttribute("data-href") || el.getAttribute("data-url");
        if (href) return new URL(href, location.origin).href;
      }
    }
    return "";
  }

  function exitHref() {
    try {
      const u = new URL(location.href);
      u.searchParams.set("cxq", "off");
      return u.pathname + u.search;
    } catch {
      return location.pathname;
    }
  }

  /* ============================== 段评接口 ============================== */

  function pickList(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    const direct = [
      json.data && json.data.list,
      json.data && json.data.records,
      json.data && json.data.rows,
      json.data && json.data.data,
      json.list,
      json.records,
      json.rows
    ];
    for (const c of direct) if (Array.isArray(c)) return c;
    if (json.data && typeof json.data === "object") {
      for (const k of Object.keys(json.data)) {
        if (Array.isArray(json.data[k])) return json.data[k];
      }
    }
    return [];
  }

  function pickTotal(json) {
    const n = Number(
      (json && json.data && (json.data.total ?? json.data.count ?? json.data.totalCount)) ??
      (json && (json.total ?? json.count)) ?? 0
    );
    return Number.isFinite(n) ? n : 0;
  }

  async function qidianApi(path, params) {
    const url = new URL("/ajax/chapterReview/" + path, "https://www.qidian.com");
    url.searchParams.set("_csrfToken", csrfToken());
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString(), {
      credentials: "include",
      headers: { Accept: "application/json, text/plain, */*" }
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* 返回的不是 JSON：多半被踢到登录页 */ }
    if (!json) {
      const err = new Error("接口未返回 JSON，可能登录态失效");
      err.code = "NO_JSON";
      throw err;
    }
    if (json.code && ![0, 200, "0", "200"].includes(json.code)) {
      const err = new Error(json.msg || json.message || "接口返回异常");
      err.code = json.code;
      throw err;
    }
    return json;
  }

  /* ============================== 主流程 ============================== */

  const state = {
    settings: loadSettings(),
    meta: { bookId: "", chapterId: "", bookName: "", title: "" },
    prevUrl: "",
    nextUrl: "",
    paragraphs: [],      // 段落 HTML（已转义 + em/strong）
    segOf: [],           // 每段对应的 segmentId
    summary: new Map(),  // segmentId -> { reviewNum, isHotSegment, quoteContent }
    active: -1,
    reviewCache: new Map(),
    totalReview: 0,
    root: null,
    els: {}
  };

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));

  function applySettings() {
    const s = state.settings;
    const root = state.root;
    if (!root) return;
    root.dataset.theme = s.theme === "light" ? "light" : "dark";
    root.style.setProperty("--cx-read-size", `${s.fontSize}px`);
    root.style.setProperty("--cx-read-lh", String(s.lineHeight));
    root.style.setProperty("--cx-read-w", `${s.width}px`);
    root.style.setProperty(
      "--cx-read-font",
      s.font === "sans"
        ? `-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif`
        : `"Songti SC","Noto Serif SC","Source Han Serif SC","STSong","SimSun",serif`
    );
    root.classList.toggle("rail-collapsed", !s.rail);
    if (state.els.themeBtn) {
      state.els.themeBtn.innerHTML = s.theme === "light" ? ICONS.sun : ICONS.moon;
      state.els.themeBtn.title = s.theme === "light" ? "切换到深色" : "切换到浅色";
    }
    if (state.els.fontVal) state.els.fontVal.textContent = num(s.fontSize);
    if (state.els.lhVal) state.els.lhVal.textContent = s.lineHeight.toFixed(2);
    $$("[data-seg-group]", root).forEach((group) => {
      const key = group.dataset.segGroup;
      $$("button", group).forEach((b) => {
        b.classList.toggle("on", String(state.settings[key]) === b.dataset.val);
      });
    });
    saveSettings(s);
  }

  function toast(msg) {
    const el = state.els.toast;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------- 构建界面 ---------- */

  function shellHtml() {
    return `
<aside class="cxq-rail">
  <div class="cxq-traffic">
    <i class="cxq-dot r"></i><i class="cxq-dot y"></i><i class="cxq-dot g"></i>
    <button class="cxq-rail-icon" id="cxq-rail-hide" title="收起侧栏">${ICONS.panel}</button>
  </div>
  <div class="cxq-rail-brand">
    <span class="cxq-brand">Codex</span>
    <span class="cxq-caret">${ICONS.chevronDown}</span>
    <span class="cxq-brand-actions">
      <button class="cxq-rail-icon" id="cxq-search" title="搜索">${ICONS.search}</button>
    </span>
  </div>
  <div class="cxq-rail-scroll">
    <div class="cxq-rail-nav">
      <button class="cxq-rail-item" id="cxq-top">${ICONS.pencil}<span class="cxq-label">New chat</span></button>
      <div class="cxq-rail-item cxq-static">${ICONS.folder}<span class="cxq-label">${escapeHtml(state.meta.bookName || "workspace")}</span></div>
    </div>
    <div class="cxq-rail-section">Recents</div>
    <div class="cxq-rail-items" id="cxq-hot-list">
      <div class="cxq-rail-empty">Loading…</div>
    </div>
  </div>
  <div class="cxq-rail-foot">
    <button class="cxq-rail-user" id="cxq-settings-btn">${ICONS.gear}<span class="cxq-label">custom</span></button>
  </div>

  <div class="cxq-settings" id="cxq-settings">
    <div class="cxq-srow">
      <span>主题</span>
      <span class="cxq-seg" data-seg-group="theme">
        <button data-val="dark">深色</button><button data-val="light">浅色</button>
      </span>
    </div>
    <div class="cxq-srow">
      <span>字号</span>
      <span class="cxq-step">
        <button id="cxq-fs-dec">−</button><span id="cxq-fs-val">13.5</span><button id="cxq-fs-inc">+</button>
      </span>
    </div>
    <div class="cxq-srow">
      <span>行距</span>
      <span class="cxq-step">
        <button id="cxq-lh-dec">−</button><span id="cxq-lh-val">1.75</span><button id="cxq-lh-inc">+</button>
      </span>
    </div>
    <div class="cxq-srow">
      <span>版心</span>
      <span class="cxq-seg" data-seg-group="width">
        <button data-val="560">窄</button><button data-val="760">中</button><button data-val="920">宽</button>
      </span>
    </div>
    <div class="cxq-srow">
      <span>字体</span>
      <span class="cxq-seg" data-seg-group="font">
        <button data-val="sans">黑体</button><button data-val="serif">宋体</button>
      </span>
    </div>
    <div class="cxq-ssep"></div>
    <a class="cxq-exit" id="cxq-exit" href="${escapeHtml(exitHref())}">${ICONS.external}<span>退出伪装，回到原站</span></a>
  </div>
</aside>

<main class="cxq-main">
  <header class="cxq-topbar">
    <button class="cxq-icon-btn" id="cxq-rail-show" title="展开侧栏">${ICONS.panel}</button>
    <div class="cxq-crumb">
      <span class="cxq-proj">${escapeHtml(state.meta.title || "")}</span>
    </div>
    <span class="cxq-spacer"></span>
    <button class="cxq-icon-btn" id="cxq-more" title="更多">${ICONS.dots}</button>
    <button class="cxq-icon-btn" id="cxq-panel-btn" title="批注">${ICONS.quote}</button>
  </header>
  <div class="cxq-prog"><i id="cxq-prog-bar"></i></div>
  <div class="cxq-scroll" id="cxq-scroll">
    <article class="cxq-article">
      <div class="cxq-meta" id="cxq-meta"></div>
      <div id="cxq-body"></div>
      <div class="cxq-card${state.nextUrl ? "" : " disabled"}" id="cxq-next-card">
        <span class="cxq-card-ico">${ICONS.file}</span>
        <span class="cxq-card-body">
          <div class="cxq-card-title">${state.nextUrl ? "继续" : "本章已结束"}</div>
          <div class="cxq-card-sub">${state.nextUrl ? "下一节" : "没有更多内容"}</div>
        </span>
        <span class="cxq-card-btn">Open</span>
      </div>
    </article>
  </div>
  <div class="cxq-composer-wrap">
    <div class="cxq-composer">
      <div class="cxq-md-edit" id="cxq-input" contenteditable="true" spellcheck="false" data-placeholder="Work with Codex"></div>
      <div class="cxq-composer-bar">
        <button class="cxq-cbtn" id="cxq-plus" title="添加附件">${ICONS.plus}</button>
        <button class="cxq-cbtn" id="cxq-approve">${ICONS.check}<span>Ask for approval</span></button>
        <span class="cxq-cmodel">6.1 Sol Max${ICONS.chevronDown}</span>
        <button class="cxq-send" id="cxq-send" title="发送">${ICONS.send}</button>
      </div>
    </div>
  </div>
</main>

<aside class="cxq-panel" id="cxq-panel">
  <div class="cxq-panel-inner">
    <div class="cxq-panel-head">
      ${ICONS.file}
      <span class="cxq-panel-title">批注.md</span>
      <span class="cxq-panel-count" id="cxq-panel-count"></span>
      <button class="cxq-icon-btn" id="cxq-panel-close" title="关闭">${ICONS.close}</button>
    </div>
    <div class="cxq-panel-scroll" id="cxq-panel-scroll">
      <div class="cxq-quote" id="cxq-quote"></div>
      <div id="cxq-reviews"></div>
    </div>
  </div>
</aside>

<div class="cxq-toast" id="cxq-toast"></div>`;
  }

  function renderBody() {
    const body = state.els.body;
    const frag = document.createDocumentFragment();
    state.paragraphs.forEach((html, i) => {
      const p = document.createElement("p");
      p.className = "cxq-p";
      p.dataset.idx = String(i);
      p.innerHTML = `<span class="cxq-p-text">${html}</span>`;
      const badge = document.createElement("button");
      badge.className = "cxq-p-badge";
      badge.type = "button";
      badge.innerHTML = `${ICONS.quote}<span>0</span>`;
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        openPanel(i, { scroll: false });
      });
      p.appendChild(badge);
      p.addEventListener("click", () => {
        // 划词选中时不触发段评，避免复制文本误弹面板
        const sel = window.getSelection ? String(window.getSelection()) : "";
        if (sel.trim()) return;
        openPanel(i, { scroll: false });
      });
      frag.appendChild(p);
    });
    body.appendChild(frag);
  }

  function mount() {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = shellHtml();
    document.body.appendChild(root);
    document.body.classList.add(BODY_LOCK);
    state.root = root;

    state.els = {
      body: $("#cxq-body", root),
      scroll: $("#cxq-scroll", root),
      article: $(".cxq-article", root),
      reviews: $("#cxq-reviews", root),
      quote: $("#cxq-quote", root),
      panelCount: $("#cxq-panel-count", root),
      meta: $("#cxq-meta", root),
      hotList: $("#cxq-hot-list", root),
      toast: $("#cxq-toast", root),
      fontVal: $("#cxq-fs-val", root),
      lhVal: $("#cxq-lh-val", root),
      prog: $("#cxq-prog-bar", root),
      settings: $("#cxq-settings", root),
      settingsBtn: $("#cxq-settings-btn", root),
      input: $("#cxq-input", root)
    };

    renderBody();
    applySettings();
    renderMeta();
    bindEvents();
    updateProgress();
  }

  function renderMeta() {
    const chars = state.paragraphs.reduce((n, h) => n + stripTags(h).replace(/\s/g, "").length, 0);
    const mins = Math.max(1, Math.round(chars / 420));
    state.els.meta.innerHTML = [
      `<span>${formatTime(Date.now())}</span>`,
      `<span class="cxq-dot-s"></span>`,
      `<span>${chars.toLocaleString("en-US")} 字</span>`,
      `<span class="cxq-dot-s"></span>`,
      `<span>${mins} min read</span>`
    ].join("");
  }

  /* ---------- 事件 ---------- */

  function bindEvents() {
    const root = state.root;
    const { scroll, settings, settingsBtn } = state.els;
    const on = (sel, fn) => { const el = $(sel, root); if (el) el.addEventListener("click", fn); };

    on("#cxq-rail-hide", () => { state.settings.rail = false; applySettings(); });
    on("#cxq-rail-show", () => { state.settings.rail = true; applySettings(); });
    on("#cxq-top", () => scroll.scrollTo({ top: 0, behavior: "smooth" }));
    on("#cxq-search", () => toast("搜索暂无结果"));
    on("#cxq-more", () => toast("暂无更多操作"));

    const toggleSettings = (e) => {
      e.stopPropagation();
      const open = settings.classList.toggle("open");
      if (settingsBtn) settingsBtn.classList.toggle("on", open);
    };
    if (settingsBtn) settingsBtn.addEventListener("click", toggleSettings);
    if (settings) settings.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => {
      if (!settings || !settings.classList.contains("open")) return;
      settings.classList.remove("open");
      if (settingsBtn) settingsBtn.classList.remove("on");
    });

    const stepFont = (d) => {
      state.settings.fontSize = clamp(Math.round((state.settings.fontSize + d) * 10) / 10, 12, 30);
      applySettings();
    };
    on("#cxq-fs-dec", () => stepFont(-0.5));
    on("#cxq-fs-inc", () => stepFont(0.5));

    const stepLh = (d) => {
      state.settings.lineHeight = clamp(Math.round((state.settings.lineHeight + d) * 100) / 100, 1.4, 2.8);
      applySettings();
    };
    on("#cxq-lh-dec", () => stepLh(-0.05));
    on("#cxq-lh-inc", () => stepLh(0.05));

    $$("[data-seg-group]", root).forEach((group) => {
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-val]");
        if (!btn) return;
        const key = group.dataset.segGroup;
        const val = btn.dataset.val;
        if (key === "width") state.settings.width = Number(val);
        else if (key === "font") state.settings.font = val;
        else if (key === "theme") state.settings.theme = val;
        applySettings();
      });
    });

    // 下一章卡片（伪装成 Codex 的 Open 卡片）
    const nextCard = $("#cxq-next-card", root);
    if (nextCard) {
      nextCard.addEventListener("click", () => {
        if (!state.nextUrl) return toast("已经是最后一节");
        location.href = state.nextUrl;
      });
    }

    on("#cxq-panel-close", closePanel);
    on("#cxq-panel-btn", () => {
      if (root.classList.contains("panel-open")) return closePanel();
      const idx = nearestParagraphIndex();
      if (idx >= 0) openPanel(idx, { scroll: false });
    });

    // 假输入框：能打字、能回车清空，但不会真的发出去
    const input = state.els.input;
    if (input) {
      const sync = () => input.classList.toggle("has-content", !!input.textContent.trim());
      input.addEventListener("input", sync);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          input.textContent = "";
          sync();
        }
      });
      const send = $("#cxq-send", root);
      if (send) send.addEventListener("click", () => { input.textContent = ""; sync(); });
    }

    scroll.addEventListener("scroll", debounce(updateProgress, 60), { passive: true });
    window.addEventListener("resize", debounce(updateProgress, 120));

    document.addEventListener("keydown", onKeydown, true);
  }

  function onKeydown(e) {
    const tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    if (e.key === "Escape") {
      if (state.root.classList.contains("panel-open")) {
        closePanel();
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const url = e.key === "ArrowRight" ? state.nextUrl : state.prevUrl;
      e.preventDefault();
      e.stopPropagation();
      if (url) location.href = url;
      else toast(e.key === "ArrowRight" ? "已经是最后一章" : "已经是第一章");
    }
  }

  function updateProgress() {
    const { scroll, prog, pct } = state.els;
    if (!scroll || !prog) return;
    const max = scroll.scrollHeight - scroll.clientHeight;
    const r = max > 8 ? clamp(scroll.scrollTop / max, 0, 1) : 0;
    prog.style.width = `${(r * 100).toFixed(2)}%`;
    if (pct) pct.textContent = `${Math.round(r * 100)}%`;
  }

  function nearestParagraphIndex() {
    const { scroll } = state.els;
    const nodes = $$(".cxq-p", state.root);
    if (!nodes.length) return -1;
    const mid = scroll.scrollTop + scroll.clientHeight * 0.42;
    let best = 0;
    let bestD = Infinity;
    nodes.forEach((n, i) => {
      const d = Math.abs(n.offsetTop - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  /* ---------- 段评面板 ---------- */

  function setActiveParagraph(i) {
    $$(".cxq-p.is-active", state.root).forEach((n) => n.classList.remove("is-active"));
    const p = state.root.querySelector(`.cxq-p[data-idx="${i}"]`);
    if (p) p.classList.add("is-active");
    $$("#cxq-hot-list .cxq-rail-sub", state.root).forEach((n) => {
      n.classList.toggle("active", Number(n.dataset.idx) === i);
    });
  }

  function syncPanelBtn() {
    const btn = state.root && state.root.querySelector("#cxq-panel-btn");
    if (btn) btn.classList.toggle("on", state.root.classList.contains("panel-open"));
  }

  function closePanel() {
    state.root.classList.remove("panel-open");
    setActiveParagraph(-1);
    state.active = -1;
    syncPanelBtn();
  }

  async function openPanel(i, opts = {}) {
    if (i < 0 || i >= state.paragraphs.length) return;
    state.active = i;
    setActiveParagraph(i);
    state.root.classList.add("panel-open");
    syncPanelBtn();

    const plain = stripTags(state.paragraphs[i]).replace(/\s+/g, " ").trim();
    state.els.quote.textContent = plain.length > 180 ? plain.slice(0, 180) + "…" : plain;

    const seg = state.segOf[i];
    const info = seg ? state.summary.get(seg) : null;
    state.els.panelCount.textContent = info && info.reviewNum ? `${info.reviewNum} 条` : "";

    if (opts.scroll) {
      const p = state.root.querySelector(`.cxq-p[data-idx="${i}"]`);
      if (p) p.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    if (!seg) {
      renderEmpty("这一段暂无批注");
      return;
    }
    if (!info || !info.reviewNum) {
      // 摘要里没数据也尝试拉一次，避免摘要延迟/失败导致误判
      if (state.reviewCache.has(seg) && !state.reviewCache.get(seg).length) {
        renderEmpty("暂无批注");
        return;
      }
    }

    await loadReviews(seg);
  }

  async function loadReviews(seg) {
    const box = state.els.reviews;
    if (state.reviewCache.has(seg)) {
      const cached = state.reviewCache.get(seg);
      if (!cached.length) return renderEmpty("暂无批注");
      return renderReviews(cached);
    }

    box.innerHTML = `<div class="cxq-skel w60"></div><div class="cxq-skel w90"></div><div class="cxq-skel w75"></div><div class="cxq-skel w90"></div><div class="cxq-skel w60"></div>`;

    try {
      const json = await qidianApi("reviewList", {
        bookId: state.meta.bookId,
        chapterId: state.meta.chapterId,
        page: 1,
        pageSize: 30,
        segmentId: seg,
        type: 2
      });
      const list = pickList(json);
      state.reviewCache.set(seg, list);
      if (state.active >= 0 && state.segOf[state.active] === seg) {
        const info = state.summary.get(seg);
        const total = Math.max(pickTotal(json), list.length, (info && info.reviewNum) || 0);
        if (total) state.els.panelCount.textContent = `${total} 条`;
        if (!list.length) renderEmpty("暂无批注");
        else renderReviews(list);
      }
    } catch (err) {
      renderError(err);
    }
  }

  function renderReviews(list) {
    const box = state.els.reviews;
    box.innerHTML = list.map(reviewHtml).join("");
  }

  function reviewHtml(cm) {
    const nick = escapeHtml(cm.nickName || cm.userName || "书友");
    const uid = cm.userId || cm.user_id;
    const avatar = cm.avatar || cm.avatarUrl || "";
    // 起点 `level` 字段表示楼层（N楼），不是用户等级
    const floorNum = cm.floor != null ? cm.floor : cm.level;
    const floor = floorNum != null && /^\d+$/.test(String(floorNum)) ? `${floorNum}楼` : "";
    const userLevel = cm.userLevel || cm.levelName || cm.userLevelName || "";
    const time = formatTime(cm.createTime || cm.time || cm.createdAt);
    const ip = cm.ipAddress || cm.ip || "";
    const likes = cm.likeCount != null ? Number(cm.likeCount) : 0;
    const content = escapeHtml(cm.content || cm.text || "").replace(/\n/g, "<br>");

    const avInner = avatar
      ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
      : nick.slice(0, 1);

    return `<div class="cxq-cm">
  <div class="cxq-cm-av">${avInner}</div>
  <div class="cxq-cm-body">
    <div class="cxq-cm-top">
      ${uid ? `<a class="cxq-cm-nick" href="//my.qidian.com/user/${escapeHtml(uid)}/" target="_blank" rel="noopener">${nick}</a>` : `<span class="cxq-cm-nick">${nick}</span>`}
      ${userLevel ? `<span class="cxq-cm-lv">${escapeHtml(userLevel)}</span>` : ""}
      ${floor ? `<span class="cxq-cm-floor">${escapeHtml(floor)}</span>` : ""}
    </div>
    <div class="cxq-cm-text">${content}</div>
    <div class="cxq-cm-foot">
      ${time ? `<span>${escapeHtml(time)}</span>` : ""}
      ${ip ? `<span>IP 属地 ${escapeHtml(ip)}</span>` : ""}
      ${likes ? `<span class="cxq-cm-like">${ICONS.like}${likes}</span>` : ""}
    </div>
  </div>
</div>`;
  }

  function renderEmpty(text) {
    state.els.reviews.innerHTML = `<div class="cxq-empty">${ICONS.quote}<span>${escapeHtml(text)}</span></div>`;
  }

  function renderError(err) {
    const needLogin = err && (err.code === "NO_JSON" || err.code === 401 || err.code === 1001);
    state.els.reviews.innerHTML = `<div class="cxq-err">
      <div>${needLogin ? "登录后可见批注" : "批注加载失败"}</div>
      <div style="margin-top:6px;opacity:.65;font-size:11.5px">${escapeHtml((err && err.message) || "")}</div>
      ${needLogin
        ? `<a href="https://passport.qidian.com/" target="_blank" rel="noopener"><button>去登录</button></a>`
        : `<button id="cxq-retry">重试</button>`}
    </div>`;
    const retry = $("#cxq-retry", state.els.reviews);
    if (retry) {
      retry.addEventListener("click", () => {
        const seg = state.active >= 0 ? state.segOf[state.active] : 0;
        state.reviewCache.delete(seg);
        if (seg) loadReviews(seg);
      });
    }
  }

  /* ---------- 段评摘要 ---------- */

  function applySummary(list) {
    const items = list
      .map((it) => ({
        seg: Number(it.segmentId ?? it.segment_id ?? 0),
        reviewNum: Number(it.reviewNum ?? it.reviewCount ?? it.count ?? 0) || 0,
        isHot: !!(it.isHotSegment || it.hot),
        quote: it.quoteContent || ""
      }))
      .filter((it) => it.seg > 0);

    state.summary.clear();
    items.forEach((it) => state.summary.set(it.seg, it));

    // 判断 segmentId 是 1-based 还是 0-based：优先用 quoteContent 精确投票
    const n = state.paragraphs.length;
    const norm = (t) => stripTags(t).replace(/[\s\u00a0，。！？、；：“”‘’"'（）()《》…—·]/g, "");
    const paraKeys = state.paragraphs.map((h) => norm(h));
    const votes = new Map();
    items.forEach((it) => {
      if (!it.quote) return;
      const key = norm(it.quote);
      if (key.length < 6) return;
      const head = key.slice(0, 18);
      const idx = paraKeys.findIndex((pk) => pk && (pk.startsWith(head) || key.startsWith(pk.slice(0, 18))));
      if (idx >= 0) votes.set(idx - it.seg, (votes.get(idx - it.seg) || 0) + 1);
    });

    let bestOffset = 1;
    const scoreOf = (off) => {
      let score = 0;
      for (let i = 0; i < n; i++) {
        const it = state.summary.get(i + off);
        if (it && it.reviewNum > 0) score += Math.min(it.reviewNum, 3) + 1;
      }
      return score;
    };
    let bestVote = -1;
    votes.forEach((v, off) => {
      if ((off === 0 || off === 1) && v > bestVote) { bestVote = v; bestOffset = off; }
    });
    if (bestVote <= 0) {
      // 平票时默认 1-based（起点正文段落编号从 1 开始）
      if (scoreOf(0) > scoreOf(1)) bestOffset = 0;
    }

    state.segOf = state.paragraphs.map((_, i) => i + bestOffset);
    state.totalReview = items.reduce((a, b) => a + b.reviewNum, 0);

    // 回填角标
    $$(".cxq-p", state.root).forEach((p, i) => {
      const it = state.summary.get(state.segOf[i]);
      const badge = $(".cxq-p-badge", p);
      const numEl = badge && badge.querySelector("span");
      const cnt = it ? it.reviewNum : 0;
      if (numEl) numEl.textContent = cnt > 999 ? "999+" : String(cnt);
      p.classList.toggle("has-review", cnt > 0);
      p.classList.toggle("is-hot", !!(it && it.isHot));
      p.dataset.seg = String(state.segOf[i]);
    });

    renderMeta();
    renderHot();
  }

  // 左栏 Recents：用有批注的段落伪装成“最近会话”，点击即跳转并打开批注
  function renderHot() {
    const list = state.paragraphs
      .map((html, i) => ({ i, cnt: (state.summary.get(state.segOf[i]) || {}).reviewNum || 0 }))
      .filter((x) => x.cnt > 0)
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 9);

    if (!list.length) {
      state.els.hotList.innerHTML = `<div class="cxq-rail-empty">No recent chats</div>`;
      return;
    }
    state.els.hotList.innerHTML = list
      .map(({ i }) => {
        const snippet = stripTags(state.paragraphs[i]).replace(/\s+/g, " ").slice(0, 24);
        return `<div class="cxq-rail-sub" data-idx="${i}">
          <span class="cxq-label">${escapeHtml(snippet)}</span>
        </div>`;
      })
      .join("");
    $$(".cxq-rail-sub", state.els.hotList).forEach((el) => {
      el.addEventListener("click", () => openPanel(Number(el.dataset.idx), { scroll: true }));
    });
    if (state.active >= 0) setActiveParagraph(state.active);
  }

  async function loadSummary() {
    try {
      const json = await qidianApi("reviewSummary", {
        bookId: state.meta.bookId,
        chapterId: state.meta.chapterId
      });
      applySummary(pickList(json));
    } catch (err) {
      state.els.hotList.innerHTML = `<div class="cxq-rail-empty">No recent chats</div>`;
      console.warn("[Codex Reader] 批注摘要加载失败：", err && err.message);
      // 仍保留按段序号猜测的 segmentId，保证点击可尝试拉取
      state.segOf = state.paragraphs.map((_, i) => i + 1);
    }
  }

  /* ============================== 启动 ============================== */

  async function boot() {
    if (document.getElementById(ROOT_ID)) return;

    const main = await waitForMain(20000);
    if (!main) {
      debugNotice("未找到正文容器（#reader-content main），已保持原页面");
      return;
    }

    state.meta = readMeta();

    let paragraphs = toParagraphs(main);
    // 标题若被包进正文容器，去掉重复的首段
    if (paragraphs.length > 1 && state.meta.title) {
      const first = stripTags(paragraphs[0]).replace(/\s+/g, "");
      const t = state.meta.title.replace(/\s+/g, "");
      if (first && (first === t || (first.length > 4 && t.includes(first)))) paragraphs = paragraphs.slice(1);
    }

    const textLen = paragraphs.reduce((n, h) => n + stripTags(h).length, 0);
    if (paragraphs.length < 2 || textLen < 200) {
      debugNotice("没读到正文，可能未登录/未订阅本章，已保持原页面");
      return;
    }

    if (!state.meta.bookId || !state.meta.chapterId) {
      debugNotice("无法解析书籍/章节 ID，已保持原页面");
      return;
    }
    state.paragraphs = paragraphs;
    state.segOf = paragraphs.map((_, i) => i + 1);
    state.prevUrl = findChapterLink("prev");
    state.nextUrl = findChapterLink("next");

    mount();
    document.title = `${state.meta.title}${state.meta.bookName ? " - " + state.meta.bookName : ""}`;

    if (state.settings.rail === false) state.root.classList.add("rail-collapsed");
    if (window.innerWidth < 1000 && state.settings.rail) {
      state.root.classList.add("rail-collapsed");
    }

    loadSummary();
  }

  if (CHAPTER_RE.test(location.pathname) && !/[?&]cxq=off/.test(location.search)) {
    boot();
  }

  window.__CXQ__ = state;
})();
