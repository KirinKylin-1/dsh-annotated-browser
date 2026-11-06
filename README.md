# dsh-annotated-browser

Annotation for the DSH (DeepSeek Harness) sidebar browser. Pick an element or drag a region on the page, write what should change, and send the batch into the current conversation — selectors, visible text and rectangles included.

Installed, the stock built-in browser gains one row in its tab context menu — **在此页面标注** — which opens the current page in this plugin's annotated view (rendered through the proxy so it can be read and picked). It is contributed through the documented `sidebar.right.tab.menu.item` seat: nothing is drawn over the page, nothing is replaced, and a sidebar update does not remove it.

This plugin also adds its **own** tab type — **标注浏览器** — and leaves the stock `browser` tab alone: its shortcuts, “open in system browser”, its history and every other plugin that opens `browser` tabs keep working exactly as before. Nothing here registers a service or replaces a provider, so it neither depends on another plugin nor changes the browser's own features.

## Why it needs a proxy

A stock sidebar browser frames the remote URL directly. Two consequences:

- sites that send `X-Frame-Options` / CSP render blank;
- the frame is cross-origin, so the GUI cannot read its DOM — annotation is impossible.

The host half of this package renders the page with headless Chromium and serves the executed HTML from the DSH origin. The frame is then same-origin (annotation works) and framing restrictions never apply.

Pages that already live on the same server (another plugin's page, for example) skip the proxy and are framed directly — same-origin already, and their cookies stay intact. If the proxy cannot reach a URL (a host-mapped port, say), the panel offers **直接加载（只读）**: the raw URL in the frame, viewable but not annotatable.

The plugin provides the `browser` tab type, so the 浏览器 entry opens the annotatable view directly. A brand-new tab is a blank browser tab; each tab remembers its own page across a reload, and links that ask for a new window open a new browser tab.

## Install

```sh
dsh plugin --profile web add dsh-annotated-browser
# or from a checkout
dsh plugin --profile web add file:/path/to/dsh-annotated-browser
```

Restart `dsh web` once (the host half must load), then refresh the GUI.

**Requirement:** a Chromium-based browser on the host. It is auto-detected (`google-chrome`, `chromium`, `msedge`, common macOS / Windows paths, or `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH`). If detection fails, set the path:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml (or the profile's own patch file)
- id: dsh-annotated-browser
  config:
    browserExecutable: /usr/bin/google-chrome
```

## Use

1. Right sidebar → **浏览器** → enter a URL.
2. Toolbar **标注** (or `Esc` to leave): click an element, or drag a rectangle when several unrelated elements are meant.
3. Write the note → **加入列表**. Picking continues automatically; leaving the mode is the only stop.
4. **发送到会话** posts one message with every mark, in the order you made them.

Collected marks persist per Session in `localStorage` until **清空** or a successful send.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `browserExecutable` | auto | absolute path to Chrome/Chromium |
| `proxyServer` | empty | HTTP proxy for the rendered page, e.g. `http://127.0.0.1:7890` |
| `timeoutMs` | `30000` | page load budget |
| `allowRemote` | `false` | accept proxy requests from non-loopback peers (only for a directly LAN-exposed DSH) |
| `takeover` | `true` | provide the `browser` tab type itself, so pages open straight into the annotatable view; set `false` to keep the stock browser and use the 标注 hand-off button instead |

## Limits

- Pages are rendered by headless Chromium and re-served; login state and heavy interactive apps may behave differently from a real browser.
- The proxied page is served from the DSH origin. Treat it as trusted-ish content: only browse sites you would open in the GUI itself.
- Session cookies for authenticated sites are not shared with your own browser.

## License

MIT
