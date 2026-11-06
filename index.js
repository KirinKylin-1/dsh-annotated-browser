/**
 * dsh-annotated-browser — host half.
 *
 * Serves the sidebar browser's page proxy: renders one URL with the host's own
 * headless Chromium and returns the executed HTML from this server's origin, so
 * the client can frame it same-origin and read its DOM for annotation. The
 * upstream page's own X-Frame-Options / CSP therefore never applies, because
 * the frame is no longer loading the remote site directly.
 *
 * Everything this file needs is in the package: `puppeteer-core` is a normal
 * dependency, and the browser binary is auto-detected (or configured with
 * `browserExecutable` on the plugin's profile row).
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

export const name = 'dsh-annotated-browser'
export const inject = ['webServer']

/** Route the client frames. Served under /api so the host's own auth applies. */
export const PROXY_PATH = '/api/annotated-browser/proxy'
export const CONFIG_PATH = '/api/annotated-browser/config'

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

const DEFAULTS = {
  /** Absolute path to a Chromium-based browser; empty = auto-detect. */
  browserExecutable: '',
  /** Optional HTTP proxy for the rendered page, e.g. http://127.0.0.1:7890 */
  proxyServer: '',
  /** Page load budget in milliseconds. */
  timeoutMs: 30000,
  /**
   * Provide the `browser` tab type itself (default) so pages open straight into
   * the annotatable view. Set false to keep the stock browser and use the 标注
   * hand-off button in its tab strip instead.
   */
  takeover: true,
  /**
   * Refuse requests whose peer is not loopback. On by default: the route
   * renders arbitrary URLs, so exposing it to a LAN would hand every peer a
   * server-side fetcher. A same-host reverse proxy still connects over 127.0.0.1
   * and keeps working; a directly LAN-exposed DSH needs this set to false.
   */
  allowRemote: false,
}

function isLoopbackRequest(req) {
  const address = req.socket?.remoteAddress
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

/** First executable among the environment, explicit config and common paths. */
export function detectExecutable(configured = '') {
  if (configured && existsSync(configured)) return configured
  for (const key of ['DSH_ANNOTATE_CHROME', 'CHROME_PATH', 'PUPPETEER_EXECUTABLE_PATH']) {
    const value = process.env[key]
    if (value && existsSync(value)) return value
  }
  for (const path of CANDIDATES) {
    if (existsSync(path)) return path
  }
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try {
      const found = execSync(`which ${bin}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
      if (found && existsSync(found)) return found
    } catch {}
  }
  return ''
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || value === '') return ''
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return parsed.toString()
  } catch (error) {
    return ''
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char])
}

/** Error page a user can read inside the panel, instead of a blank frame. */
function errorPage(message) {
  return `<!doctype html><meta charset="utf-8"><title>页面渲染失败</title>
<body style="font:14px/1.7 system-ui,sans-serif;padding:32px;color:#1f2328;background:#fff">
<h3 style="margin:0 0 8px">页面渲染失败</h3>
<p style="margin:0 0 12px;color:#57606a">${escapeHtml(message)}</p>
<p style="margin:0;color:#57606a">如果提示找不到浏览器：装一个 Chrome/Chromium，或在 profile patch 里给
<code>dsh-annotated-browser</code> 配置 <code>browserExecutable</code> 指向其绝对路径。</p>
</body>`
}

/**
 * Put the page on this origin: a `<base>` so relative assets resolve against
 * the real site, and a click trap so links navigate the panel instead of the
 * frame. Message contract is `{source:'dsh-browser', kind:'navigate'|'open', url}`.
 */
function rewrite(html, finalUrl) {
  let baseUrl = finalUrl
  try {
    const parsed = new URL(finalUrl)
    baseUrl = parsed.origin + parsed.pathname.replace(/[^/]*$/, '')
  } catch (error) {}
  const head = `<base href="${baseUrl}"><script>(function(){
    var open = window.open;
    window.open = function (target) {
      if (target && target !== '' && target !== 'about:blank') {
        window.parent.postMessage({ source: 'dsh-browser', kind: 'open', url: String(target) }, '*');
        return null;
      }
      return open.apply(this, arguments);
    };
    document.addEventListener('click', function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!anchor || !anchor.href || !/^https?:/i.test(anchor.href)) return;
      event.preventDefault();
      var kind = (anchor.target || '').toLowerCase() === '_blank' ? 'open' : 'navigate';
      window.parent.postMessage({ source: 'dsh-browser', kind: kind, url: anchor.href }, '*');
    }, true);
  })();</script>`
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (match) => match + head)
  return head + html
}

function sendJson(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': payload.length,
  })
  res.end(payload)
}

export function apply(ctx, config = {}) {
  let current = { ...DEFAULTS }
  const readConfig = () => {
    const source = config && typeof config === 'object' ? config : {}
    for (const key of Object.keys(DEFAULTS)) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') current[key] = source[key]
    }
    return current
  }
  readConfig()

  let browser = null
  let browserKey = ''
  let launching = null

  const closeBrowser = async () => {
    const current_ = browser
    browser = null
    browserKey = ''
    launching = null
    if (current_) await current_.close().catch(() => {})
  }

  const getBrowser = async () => {
    const options = readConfig()
    const executable = options.browserExecutable || detectExecutable()
    if (!executable) {
      throw new Error('找不到 Chrome/Chromium；装一个，或配置 browserExecutable')
    }
    const key = executable + '|' + options.proxyServer
    if (browser && browserKey === key) return browser
    if (launching) {
      await launching.catch(() => {})
      if (browser && browserKey === key) return browser
    }
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
    if (options.proxyServer) args.push('--proxy-server=' + options.proxyServer)
    // Load the CommonJS build: its `debug` interop is stable whatever loader
    // the host process started with, unlike the ESM build's default import.
    const require_ = createRequire(import.meta.url)
    let puppeteer
    try {
      puppeteer = require_('puppeteer-core')
    } catch (error) {
      puppeteer = (await import('puppeteer-core')).default
    }
    launching = puppeteer
      .launch({ executablePath: executable, headless: true, args, timeout: 30000 })
      .then((instance) => {
        browser = instance
        browserKey = key
        return instance
      })
      .finally(() => { launching = null })
    return launching
  }

  const render = async (target) => {
    const options = readConfig()
    const instance = await getBrowser()
    const page = await instance.newPage()
    try {
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
      await page.goto(target, { waitUntil: 'networkidle2', timeout: options.timeoutMs })
      const html = await page.content()
      return { html, finalUrl: page.url() }
    } finally {
      await page.close().catch(() => {})
    }
  }

  ctx.effect(() => {
    const configDisposer = ctx.webServer.register({
      kind: 'exact',
      path: CONFIG_PATH,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { ok: false, error: 'config only supports GET requests' })
          return
        }
        const options = readConfig()
        sendJson(res, 200, { ok: true, value: { takeover: options.takeover !== false } })
      },
    })
    const disposer = ctx.webServer.register({
      kind: 'exact',
      path: PROXY_PATH,
      handler: async (req, res) => {
        try {
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, error: 'proxy only supports GET requests' })
            return
          }
          const options = readConfig()
          if (!options.allowRemote && !isLoopbackRequest(req)) {
            sendJson(res, 403, {
              ok: false,
              error: 'proxy accepts loopback requests only; set allowRemote: true on the dsh-annotated-browser row to lift this',
            })
            return
          }
          const requestUrl = new URL(req.url ?? '/', 'http://localhost')
          const target = normalizeUrl(requestUrl.searchParams.get('url') ?? '')
          if (!target) {
            sendJson(res, 400, { ok: false, error: 'url must be an absolute http(s) URL' })
            return
          }
          let rendered
          try {
            rendered = await render(target)
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            const body = Buffer.from(errorPage(message), 'utf8')
            res.writeHead(502, {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'no-store',
              'content-length': body.length,
            })
            res.end(body)
            return
          }
          const body = Buffer.from(rewrite(rendered.html, rendered.finalUrl), 'utf8')
          res.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store',
            'content-length': body.length,
          })
          res.end(body)
        } catch (error) {
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
          else res.end()
        }
      },
    })
    return () => {
      disposer()
      configDisposer()
      closeBrowser()
    }
  }, 'dsh-annotated-browser: proxy route')
}
