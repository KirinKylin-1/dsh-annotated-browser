# dsh-annotated-browser

**Annotate a real web page, then send the notes straight into the conversation.** Pick an element, or drag a region when the thing you mean is several nodes; write what should change; press send. The model receives the selector, the visible text and the rectangle — not a screenshot it has to guess at.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.1%2B-4d6bfe)](https://www.npmjs.com/package/@deepseek-ai/dsh)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)

**English** · [中文](README.zh.md)

</div>

---

## What it solves

Saying "change *this* bit" about a real web page needs two things: **seeing the page**, and **naming the part you mean**. This plugin exists for those two things.

**More pages load properly.** Some sites declare through `X-Frame-Options` or a CSP `frame-ancestors` that they must not be embedded. Those declarations apply to pages framed directly from the remote URL, and this plugin does not take that route: it renders the page in headless Chromium on the host and serves the executed HTML from the DSH origin, so embedding restrictions do not come into play and the page displays normally.

**The page becomes readable.** Because the rendered result is served from the DSH origin, the panel and the page are **same-origin** — the precondition for annotation. Same-origin access to the DOM is what makes these possible:

- click an element and get its **selector** (`#id`, `data-testid`, or a CSS path walked up through its ancestors);
- drag a region and get **every element inside it**, not just the outermost node;
- record the visible text, the element's position, and your note together;
- keep picking without stopping, then send everything as **one message in the order you picked it**.

**It respects what you already have installed.** With `takeover: false` the plugin does not replace the `browser` tab type: shortcuts, "open in system browser", history, and every other plugin that opens `browser` tabs keep behaving exactly as before. It *adds* a separate annotated tab and a hand-off button in the tab strip.

**A whole page in one turn.** Adding a note leaves you in picking mode, so you can keep going until you press Esc. Notes collect into one list and go out as a single message — a page-wide review costs one turn instead of a dozen.

**No detour when it is already same-origin.** A page served by this DSH itself (another plugin's page, say) is framed directly: cookies intact, no extra Chromium pass.

**Honest when it cannot work.** If an address is only reachable from your own machine (a port mapped locally, for example), the panel falls back to **load directly (read-only)**: the page still shows, and it says plainly that annotation is unavailable instead of leaving you with a blank frame to puzzle over.

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
