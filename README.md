# dsh-annotated-browser

**Annotate a real web page, then send the notes straight into the conversation.** Pick an element, or drag a region when the thing you mean is several nodes; write what should change; press send. The model receives the selector, the visible text and the rectangle — not a screenshot it has to guess at.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.1%2B-4d6bfe)](https://www.npmjs.com/package/@deepseek-ai/dsh)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)

**English** · [中文](README.zh.md)

</div>

---

## What makes it different

Most "browser in a sidebar" plugins frame the remote page and stop there. That has two consequences nobody wants: sites that send `X-Frame-Options` or a CSP `frame-ancestors` render **blank**, and the frame stays **cross-origin**, so the GUI can never read its DOM — which makes annotation impossible.

This plugin renders the page in headless Chromium on the host and serves the executed HTML from the DSH origin. The frame is then same-origin, so:

| | Stock sidebar browser | This plugin |
|---|---|---|
| Sites with `X-Frame-Options` / CSP | blank | **load** |
| Read the page DOM from the GUI | impossible (cross-origin) | **allowed (same-origin)** |
| Click an element and get its selector | — | **yes** |
| Drag a region, get every element inside | — | **yes** |
| Notes go into the conversation | — | **one message, in selection order** |

Three more things that are deliberate rather than incidental:

- **The built-in browser keeps working.** With `takeover: false` this plugin never replaces the `browser` tab type. Its shortcuts, "open in system browser", its history, and every other plugin that opens `browser` tabs behave exactly as before; this plugin only *adds* a separate annotated tab and a small hand-off button in the tab strip.
- **Picking stays on.** Adding a note does not drop you out of annotation mode — you keep clicking until you press Esc. Notes are collected in one list and sent as a single message, so a page-wide review costs one turn, not twelve.
- **Same-origin pages skip the proxy.** A page already served by this DSH (another plugin's page, say) is framed directly — cookies intact, no Chromium round-trip. If the proxy cannot reach a URL at all (a port mapped only on your machine), the panel falls back to **load directly (read-only)**: viewable, honestly labelled as not annotatable, instead of dead-ending on a blank frame.

## What it looks like

1. Right sidebar → **Browser** → type a URL.
2. Toolbar → **Annotate** (Esc leaves it): click an element, or hold and drag to frame a region.
3. Write the note → **Add to list**. Picking continues automatically.
4. **Send to conversation** posts every note as one message, in the order you made them.

The collected list survives a reload: it is persisted per Session in `localStorage` until you clear it or send it.

## Install

From the registry (once published):

```sh
dsh plugin --profile web add dsh-annotated-browser
```

From this repository — no npm account needed:

```sh
# straight from git
dsh plugin --profile web add github:KirinKylin-1/dsh-annotated-browser

# or from the release tarball
dsh plugin --profile web add https://github.com/KirinKylin-1/dsh-annotated-browser/releases/download/v1.0.0/dsh-annotated-browser-1.0.0.tgz
```

Then restart `dsh web` once (the host half has to load) and refresh the GUI.

**Requirement:** a Chromium-based browser on the host machine — Chrome, Chromium or Edge all work. It is auto-detected (common Windows / macOS / Linux paths, or `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH`). If detection fails, point at it explicitly:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: dsh-annotated-browser
  config:
    browserExecutable: /usr/bin/google-chrome
```

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `browserExecutable` | auto-detect | absolute path to Chrome/Chromium |
| `proxyServer` | empty | HTTP proxy used to render the page, e.g. `http://127.0.0.1:7890` |
| `timeoutMs` | `30000` | page-load budget in milliseconds |
| `allowRemote` | `false` | accept proxy requests from non-loopback peers (only for a DSH exposed directly on a LAN) |
| `takeover` | `true` | provide the `browser` tab type itself, so pages open straight into the annotatable view; `false` keeps the stock browser and adds the hand-off button instead |

## Languages

The panel follows the GUI language (**Settings → General**), switching live with no reload. English and Chinese ship in the box; every string lives in `i18n.js`, so another language is one dictionary away.

## Limits

- Pages are rendered by headless Chromium and re-served. Login state and heavy interactive apps can behave differently from a real browser.
- The proxied page is served from the DSH origin. Treat it as trusted-ish content: only browse sites you would open in the GUI itself.
- Cookies from your own browser are not shared with the rendered page.

## License

MIT
