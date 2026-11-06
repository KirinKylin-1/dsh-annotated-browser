# Changelog

## 1.0.0

First release under the package name **dsh-annotated-browser** (the project was
developed as `dsh-browser-annotate`). It provides the `browser` tab type with an
annotation layer on top of a same-origin, host-rendered page.

## 1.1.5

- The tab title mirrors the stock browser: globe icon plus the page's own title.
- If another plugin already owns the `browser` kind, the takeover backs off
  instead of throwing: the separate 标注浏览器 tab stays available and a warning
  is logged.

## 1.1.3

- Each browser tab remembers its own page (per tab, not per Session), so a
  reload or remount restores that tab while a brand-new tab still starts blank.

## 1.1.2

- A fresh browser tab is a blank browser tab again (a start surface with an
  empty address bar), instead of restoring the last URL the Session visited.
- Links that ask for a new window open a new browser tab of the same kind.
- `takeover` (default `true`) provides the `browser` type directly, so pages
  open straight into the annotatable view; `false` keeps the stock browser and
  the 标注 hand-off button, which now appears only on an active browser tab.

## 1.0.4

- The entry moves from a floating overlay into the stock browser tab's own
  context menu — the documented `sidebar.right.tab.menu.item` seat — so it is
  part of the browser's UI, never covers the page, and survives sidebar updates.

## 1.0.3

- Adds a 「标注」 button to the stock built-in browser pane (top-right): one
  click opens the current page in the annotated view. The stock browser is not
  replaced and does not navigate until the button is pressed.

## 1.0.2

- Ships its own `annotate-browser` tab type instead of shadowing the built-in
  `browser`: the stock browser, its shortcuts, “open in system browser”, its
  history and other plugins that open `browser` tabs are untouched.
- Back/forward history inside the panel and an “open in system browser” button.
- Fixes the page proxy failing after a reinstall (`debug` ESM interop) by
  loading puppeteer-core from its CommonJS build.
- Pages on this same server (including `localhost` / `127.0.0.1` aliases on the
  same port) load directly and stay annotatable; unreachable URLs fall back to
  a read-only direct load instead of a dead error page.

## 1.0.0

- Standalone package: ships its own host half with a Chromium-backed page proxy
  (`/api/annotated-browser/proxy`); no dependency on another plugin.
- Takes over the built-in `browser` tab type; the 浏览器 guide entry, shortcut
  and in-chat links all open it.
- Element picking and rectangle selection; the rectangle lists every leaf
  element inside it in document order.
- Continuous picking: adding a note returns to picking; only 退出标注 / `Esc`
  stops. Marks persist per Session until cleared or sent.
- Crosshair and disabled text selection only while annotating.
