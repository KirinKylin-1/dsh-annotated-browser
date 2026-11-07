# Changelog

## 1.2.1

- Ship two real screenshots (`assets/screenshot-1.png` Chinese UI,
  `assets/screenshot-2.png` English UI) declared in `screenshots.json`, so
  storefronts can show what the panel actually looks like.

## 1.2.0

- **The panel speaks English and Chinese.** Every string in the UI now goes
  through the host locale service, so the panel follows **Settings → General**
  and switches live, without a reload. Dictionaries live in `i18n.js`
  (58 keys × `zh`/`en`, placeholder-checked); `npm run build:i18n` compiles them
  into `client.js` because the client module loader resolves only its module
  table, never a relative file path. `npm run check:i18n` fails the build when
  the two drift apart.
- `locale/en.json` and `locale/zh.json` give the plugin its own title and
  description in the plugin page, in both languages.
- README split into a real English entry and a real Chinese entry, each opening
  with what this plugin does differently rather than what it contains.
- `dsh.manifestVersion: 1` declared; `@deepseek-ai/dsh-client-locale` added to
  the client `inject` list.

## 1.1.5

- The tab title mirrors the stock browser: globe icon plus the page's own title.
- If another plugin already owns the `browser` kind, the takeover backs off
  instead of throwing: the separate annotated tab stays available and a warning
  is logged.

## 1.1.3

- Each browser tab remembers its own page (per tab, not per Session), so a
  reload or remount restores that tab while a brand-new tab still starts blank.

## 1.0.0

First release under the package name **dsh-annotated-browser** (the project was
developed as `dsh-browser-annotate`). It provides the `browser` tab type with an
annotation layer on top of a same-origin, host-rendered page.
