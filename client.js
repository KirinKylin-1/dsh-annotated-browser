/**
 * dsh-annotated-browser — client half.
 *
 * Takes over the built-in sidebar browser kind (`browser`) with an extension
 * registration and renders the page through the host's same-origin proxy
 * (`/api/annotated-browser/proxy`, served by this package's own host half). The
 * proxy renders with headless Chromium, so sites that refuse framing still
 * load, and because the result is same-origin the panel can read the page DOM.
 *
 * Works in both surfaces: the Web GUI and the Desktop shell both run this web
 * client, and the proxy route lives on whichever host is running.
 *
 * Annotation:
 *  - click an element, or drag a rectangle when the elements you mean are not
 *    one DOM node (the rectangle records the area plus what sits inside it);
 *  - picking stays on after a note is added — only the exit button or Esc
 *    leaves the mode;
 *  - the collected list is persisted per Session in localStorage, so closing
 *    the tab or reloading the page keeps it until Clear.
 *
 * Every user-visible string comes from i18n.js through `t()`; the panel
 * follows the GUI language (Settings → General) with no reload.
 */
window.__ModuleLoader__.load({
  id: 'dsh-annotated-browser',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    /* Strings come from i18n.js, compiled into the block below by
     * `npm run build:i18n` — the client module loader resolves only its module
     * table and a revision-hashed chunk set, never a relative source file, so
     * the dictionaries have to travel inside this bundle. Edit i18n.js, then run
     * the build; never edit the generated block. */
    /* >>> generated from i18n.js — do not edit by hand >>> */
    const NS = "dsh-annotated-browser"
    const DICTIONARIES = {
      zh: {
      "tab.browser": "浏览器",
      "tab.annotate": "标注浏览器",
      "guide.browser.title": "浏览器",
      "guide.browser.desc": "带标注的浏览器：点元素或框选区域写备注，直接发进对话",
      "guide.annotate.title": "标注浏览器",
      "guide.annotate.desc": "带标注的浏览器：点元素/框选区域写备注，直接发进对话",
      "strip.button": "标注",
      "strip.buttonTitle": "在当前页面标注（打开标注视图）",
      "toolbar.back": "后退",
      "toolbar.forward": "前进",
      "toolbar.reload": "刷新",
      "toolbar.addressPlaceholder": "输入网址后回车",
      "toolbar.open": "打开",
      "toolbar.openExternal": "在系统浏览器中打开（交给浏览器处理，不影响本面板）",
      "toolbar.annotate": "标注",
      "toolbar.annotateStop": "退出标注",
      "toolbar.annotateTitle": "标注：点元素，或拖拽框选区域",
      "toolbar.annotateStopTitle": "退出标注（Esc）",
      "toolbar.annotateDisabled": "跨域直接加载的页面无法标注",
      "toolbar.markCount": "{count} 条",
      "toolbar.clear": "清空",
      "empty.title": "浏览器",
      "empty.body": "在上方地址栏输入网址开始浏览；点「标注」可对页面元素或区域写备注。",
      "annotate.hint": "点元素标注，或按住鼠标拖出区域 · Esc 退出",
      "annotate.noteElement": "这个元素要怎么改？",
      "annotate.noteRegion": "这块区域要怎么改？",
      "annotate.add": "加入列表",
      "annotate.cancel": "取消",
      "annotate.drop": "退出标注",
      "annotate.region": "区域 {width}×{height}@({x},{y})",
      "annotate.regionElements": " · 覆盖 {count} 个元素",
      "annotate.noted": "已加入第 {order} 条，可以继续点选（Esc 或「退出标注」结束）",
      "marks.pending": "{count} 条待发送",
      "marks.send": "发送到会话",
      "marks.delete": "删除",
      "marks.regionMeta": "区域 {width}×{height}",
      "marks.regionElements": " · 框内 {count} 个元素",
      "marks.sent": "已发送 {count} 条到当前会话",
      "proxy.unreachable": "服务端打不开这个地址（它可能只在你这台机器上可访问，例如宿主机映射的端口）。",
      "proxy.dismiss": "关闭提示",
      "proxy.loadDirect": "直接加载（只读）",
      "proxy.directNotice": "代理访问不到该地址，已改为直接加载：跨域页面无法标注，仅供查看",
      "proxy.unavailable": "页面代理不可用：请确认插件 host 半已加载，且本机装有 Chrome/Chromium（或在插件配置里指定 browserExecutable）",
      "error.crossOrigin": "无法访问页面 DOM（跨域），标注不可用",
      "error.sendFailed": "发送失败：{reason}",
      "error.noSessions": "会话服务不可用",
      "error.sessionClosed": "当前会话已关闭",
      "error.notSent": "消息未能发送",
      "error.noSessionService": "sessions 服务不可用",
      "message.header": "【内置浏览器批注】{count} 处 · {pageId}",
      "message.page": "页面：{url}",
      "message.region": "{index}. 区域 {size} @ ({x},{y}){inside}",
      "message.regionInside": "（框内 {count} 个元素）",
      "message.elementLine": "   - {selector}{text}",
      "message.more": "   - …另有 {count} 个元素未列出",
      "message.element": "{index}. {target}{text}",
      "message.position": "   位置：{size} @ ({x},{y})",
      "message.note": "   备注：{comment}",
    },
      en: {
      "tab.browser": "Browser",
      "tab.annotate": "Annotated browser",
      "guide.browser.title": "Browser",
      "guide.browser.desc": "Browser with annotation: pick an element or drag a region, write the note, send it into the conversation",
      "guide.annotate.title": "Annotated browser",
      "guide.annotate.desc": "Browser with annotation: pick an element or drag a region, write the note, send it into the conversation",
      "strip.button": "Annotate",
      "strip.buttonTitle": "Annotate this page (open the annotated view)",
      "toolbar.back": "Back",
      "toolbar.forward": "Forward",
      "toolbar.reload": "Reload",
      "toolbar.addressPlaceholder": "Enter a URL and press Enter",
      "toolbar.open": "Open",
      "toolbar.openExternal": "Open in the system browser (hands off to the browser, this panel is unaffected)",
      "toolbar.annotate": "Annotate",
      "toolbar.annotateStop": "Exit annotation",
      "toolbar.annotateTitle": "Annotate: click an element, or drag to frame a region",
      "toolbar.annotateStopTitle": "Exit annotation (Esc)",
      "toolbar.annotateDisabled": "A cross-origin page loaded directly cannot be annotated",
      "toolbar.markCount": "{count} notes",
      "toolbar.clear": "Clear",
      "empty.title": "Browser",
      "empty.body": "Enter a URL in the address bar above to start browsing; click Annotate to leave a note on an element or a region.",
      "annotate.hint": "Click an element to annotate, or drag to frame a region · Esc to exit",
      "annotate.noteElement": "What should change about this element?",
      "annotate.noteRegion": "What should change in this region?",
      "annotate.add": "Add to list",
      "annotate.cancel": "Cancel",
      "annotate.drop": "Exit annotation",
      "annotate.region": "Region {width}×{height}@({x},{y})",
      "annotate.regionElements": " · covers {count} elements",
      "annotate.noted": "Added as note {order}; keep picking (Esc or Exit annotation to stop)",
      "marks.pending": "{count} notes pending",
      "marks.send": "Send to conversation",
      "marks.delete": "Delete",
      "marks.regionMeta": "Region {width}×{height}",
      "marks.regionElements": " · {count} elements inside",
      "marks.sent": "Sent {count} notes to the current conversation",
      "proxy.unreachable": "The server cannot reach this address (it may only be reachable from your machine, such as a host-mapped port).",
      "proxy.dismiss": "Dismiss",
      "proxy.loadDirect": "Load directly (read-only)",
      "proxy.directNotice": "The proxy cannot reach this address, so it was loaded directly: a cross-origin page cannot be annotated, viewing only",
      "proxy.unavailable": "Page proxy unavailable: check that the plugin host half is loaded and that Chrome/Chromium is installed on this machine (or set browserExecutable in the plugin config)",
      "error.crossOrigin": "Cannot read the page DOM (cross-origin), annotation unavailable",
      "error.sendFailed": "Send failed: {reason}",
      "error.noSessions": "Session service unavailable",
      "error.sessionClosed": "This conversation is closed",
      "error.notSent": "The message was not sent",
      "error.noSessionService": "sessions service unavailable",
      "message.header": "[Built-in browser notes] {count} notes · {pageId}",
      "message.page": "Page: {url}",
      "message.region": "{index}. Region {size} @ ({x},{y}){inside}",
      "message.regionInside": " ({count} elements inside)",
      "message.elementLine": "   - {selector}{text}",
      "message.more": "   - …{count} more elements not listed",
      "message.element": "{index}. {target}{text}",
      "message.position": "   Position: {size} @ ({x},{y})",
      "message.note": "   Note: {comment}",
    },
    }
    /* <<< generated from i18n.js <<< */

    /* ----------------------------------------------------------------- i18n */

    /**
     * The panel is drawn from React and from one plain DOM button, so the
     * translation function has to work in both. `locale.bind(NS)` returns a
     * `t` that reads the live dictionary on every call, and the React half
     * subscribes through the LocaleFace pair so a language switch re-renders
     * without a reload.
     *
     * Until `ctx.locale` is in hand (or when this plugin runs on a host
     * without the locale service) `t` reads the same dictionaries directly,
     * defaulting to the browser's language. That keeps every string in one
     * place whether or not the service exists.
     */
    let localeService = null
    let boundT = null

    function detectLanguage() {
      const preferred = typeof navigator !== 'undefined'
        ? String((navigator.languages && navigator.languages[0]) || navigator.language || 'en')
        : 'en'
      const base = preferred.toLowerCase().split('-')[0]
      return Object.prototype.hasOwnProperty.call(DICTIONARIES, base) ? base : 'en'
    }

    function interpolate(template, params) {
      if (!params) return template
      return String(template).replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
      )
    }

    /** Standalone lookup: used before the service exists and by the DOM button. */
    function standaloneT(key, params) {
      const language = detectLanguage()
      const dict = DICTIONARIES[language] || DICTIONARIES.en
      const template = dict[key] !== undefined ? dict[key] : DICTIONARIES.en[key]
      if (template === undefined) return key
      return interpolate(template, params)
    }

    /** Translate through the host locale service when present. */
    function t(key, params) {
      if (boundT) return boundT(key, params)
      return standaloneT(key, params)
    }

    /**
     * Re-render on a language switch. The locale snapshot reference is stable
     * between changes and changes on every dictionary registration, which is
     * exactly the semantics `useSyncExternalStore` asks for.
     */
    function useLocaleRevision() {
      if (!localeService || typeof localeService.subscribe !== 'function' || typeof localeService.getSnapshot !== 'function') {
        return 0
      }
      return React.useSyncExternalStore(
        (listener) => localeService.subscribe(listener),
        () => localeService.getSnapshot().revision,
        () => localeService.getSnapshot().revision,
      )
    }

    const ID = 'dsh-annotated-browser'
    const KIND = 'annotate-browser'
    const PROXY = '/api/annotated-browser/proxy'
    const HL_CLASS = '__dsh_ann_hover'
    const STYLE_TAG_ID = '__dsh_ann_style'
    const BOX_TAG_ID = '__dsh_ann_box'
    const STORE_PREFIX = 'dsh.annotated-browser.v1.'

    /* ------------------------------------------------------------------ utils */

    function normalizeUrl(raw) {
      const value = String(raw || '').trim()
      if (value === '') return ''
      if (/^https?:\/\//i.test(value)) return value
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(value)) return 'http://' + value
      if (/^[\w.-]+(:\d+)?(\/|$)/.test(value) && !/\s/.test(value) && !/\.(com|cn|net|org|io|dev|app)\b/i.test(value))
        return 'http://' + value
      return 'https://' + value
    }

    function cssEscape(value) {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value)
      return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&')
    }

    function selectorOf(element) {
      if (!element || element.nodeType !== 1) return ''
      try {
        if (element.id) return '#' + cssEscape(element.id)
        const testId = element.getAttribute('data-testid') || element.getAttribute('data-test-id')
        if (testId) return '[data-testid="' + String(testId).replace(/"/g, '\\"') + '"]'
        const parts = []
        let node = element
        let depth = 0
        while (node && node.nodeType === 1 && depth < 8) {
          let part = node.tagName.toLowerCase()
          const classes = String(node.getAttribute('class') || '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
          if (classes.length) part += classes.map((name) => '.' + cssEscape(name)).join('')
          const parent = node.parentElement
          if (parent) {
            const same = Array.prototype.filter.call(parent.children, (child) => child.tagName === node.tagName)
            if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')'
          }
          parts.unshift(part)
          if (node.tagName === 'HTML') break
          node = parent
          depth += 1
        }
        return parts.join(' > ')
      } catch (error) {
        return ''
      }
    }

    function describe(element) {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      const text = visibleText(element).slice(0, 160)
      return {
        kind: 'element',
        selector: selectorOf(element),
        tag: String(element.tagName || '').toLowerCase(),
        text,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        html: String(element.outerHTML || '').slice(0, 400),
      }
    }

    const SKIP_TAGS = new Set(['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'TEMPLATE'])

    /** Visible text only — innerText skips <script> bodies, textContent does not. */
    function visibleText(element) {
      try {
        return String(element.innerText || '').replace(/\s+/g, ' ').trim()
      } catch (error) {
        return ''
      }
    }

    /**
     * What sits under a dragged rectangle.
     *
     * Enumerates the whole page in document order and keeps the leaf elements
     * that sit (almost) entirely inside the rectangle, so the note names every
     * element the user framed — not a grid sample and not the outer #head /
     * #s_main containers, whose textContent also carries inline <script> code.
     */
    function describeRegion(doc, box) {
      const left = Math.min(box.x1, box.x2)
      const top = Math.min(box.y1, box.y2)
      const width = Math.abs(box.x2 - box.x1)
      const height = Math.abs(box.y2 - box.y1)
      const right = left + width
      const bottom = top + height
      const hits = []
      const seenText = new Set()
      let total = 0
      const nodes = doc.body ? doc.body.querySelectorAll('*') : []
      for (const element of nodes) {
        if (SKIP_TAGS.has(element.tagName)) continue
        if (element.children.length > 0) continue
        let rect
        try { rect = element.getBoundingClientRect() } catch (error) { continue }
        if (!rect || rect.width < 4 || rect.height < 4) continue
        const overlapX = Math.min(rect.right, right) - Math.max(rect.left, left)
        const overlapY = Math.min(rect.bottom, bottom) - Math.max(rect.top, top)
        if (overlapX <= 0 || overlapY <= 0) continue
        const covered = (overlapX * overlapY) / Math.max(1, rect.width * rect.height)
        if (covered < 0.6) continue
        const text = visibleText(element)
        if (text === '' || text.length > 120) continue
        if (/^[\d\s.,%-]+$/.test(text)) continue
        if (seenText.has(text)) continue
        seenText.add(text)
        total += 1
        if (hits.length >= 20) continue
        hits.push({
          selector: selectorOf(element),
          tag: String(element.tagName || '').toLowerCase(),
          text,
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        })
      }
      const joined = hits.map((hit) => hit.text).join(' / ').slice(0, 240)
      return {
        kind: 'region',
        selector: '',
        tag: 'region',
        text: joined,
        elements: hits,
        total,
        rect: { x: Math.round(left), y: Math.round(top), width: Math.round(width), height: Math.round(height) },
      }
    }

    function loadMarks(sessionId) {
      try {
        const raw = window.localStorage.getItem(STORE_PREFIX + String(sessionId))
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        return []
      }
    }

    function pageKey(sessionId, tabId) {
      return STORE_PREFIX + 'page.' + String(sessionId) + '.' + String(tabId)
    }

    function loadPage(sessionId, tabId) {
      try {
        return normalizeUrl(window.localStorage.getItem(pageKey(sessionId, tabId)) || '')
      } catch (error) {
        return ''
      }
    }

    function savePage(sessionId, tabId, url) {
      try {
        if (url) window.localStorage.setItem(pageKey(sessionId, tabId), url)
        else window.localStorage.removeItem(pageKey(sessionId, tabId))
      } catch (error) {}
    }

    function saveMarks(sessionId, marks) {
      try {
        window.localStorage.setItem(STORE_PREFIX + String(sessionId), JSON.stringify(marks))
      } catch (error) {}
    }

    function installStyles() {
      if (document.getElementById('__dsh_ann_css')) return () => {}
      const style = document.createElement('style')
      style.id = '__dsh_ann_css'
      style.textContent = `
        .__dsh_ann_root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsh-bg,#fff);color:var(--dsh-fg,#1f2328);font-size:13px}
        .__dsh_ann_bar{display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid var(--dsh-border,#d8dee4);flex:0 0 auto;flex-wrap:wrap}
        .__dsh_ann_btn{border:1px solid var(--dsh-border,#d8dee4);background:transparent;color:inherit;border-radius:6px;min-width:26px;height:26px;padding:0 8px;cursor:pointer;font-size:12px;line-height:1}
        .__dsh_ann_btn:hover{background:rgba(0,0,0,.06)}
        .__dsh_ann_btn:disabled{opacity:.4;cursor:default}
        .__dsh_ann_btn[data-active="true"]{background:rgba(47,129,247,.14);border-color:#2f81f7;color:#2f81f7}
        .__dsh_ann_addr{flex:1 1 auto;min-width:60px;height:26px;border:1px solid var(--dsh-border,#d8dee4);border-radius:6px;padding:0 8px;background:transparent;color:inherit;font-size:12px}
        .__dsh_ann_frame{flex:1 1 auto;min-height:0;position:relative;background:#fff}
        .__dsh_ann_frame iframe{width:100%;height:100%;border:0;display:block;background:#fff}
        .__dsh_ann_hint{position:absolute;left:8px;top:8px;z-index:5;background:rgba(29,33,36,.9);color:#fff;border-radius:6px;padding:4px 8px;font-size:12px;pointer-events:none}
        .__dsh_ann_card{position:absolute;left:8px;right:8px;bottom:8px;z-index:6;background:var(--dsh-bg,#fff);border:1px solid #2f81f7;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:8px}
        .__dsh_ann_card textarea{width:100%;box-sizing:border-box;font-size:12px;font-family:inherit;color:inherit;background:transparent;border:1px solid var(--dsh-border,#d8dee4);border-radius:6px;padding:6px;min-height:54px;resize:vertical;margin-top:6px}
        .__dsh_ann_target{font-size:12px;color:#57606a;margin-bottom:6px;word-break:break-all}
        .__dsh_ann_target code{color:#2f81f7}
        .__dsh_ann_actions{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}
        .__dsh_ann_primary{background:#2f81f7;border-color:#2f81f7;color:#fff}
        .__dsh_ann_marks{flex:0 0 auto;border-top:1px solid var(--dsh-border,#d8dee4);max-height:34%;overflow:auto;padding:6px 8px}
        .__dsh_ann_mark{display:flex;gap:6px;padding:4px 0;border-bottom:1px dashed rgba(0,0,0,.08);font-size:12px}
        .__dsh_ann_mark b{color:#2f81f7;flex:0 0 auto}
        .__dsh_ann_mark code{color:#57606a;font-size:11px;word-break:break-all}
        .__dsh_ann_marks footer{display:flex;justify-content:space-between;align-items:center;padding-top:6px}
        .__dsh_ann_err{color:#d1242f;font-size:12px;padding:4px 0}
        .__dsh_ann_start{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;color:#57606a;font-size:13px;text-align:center}
        .__dsh_ann_startTitle{font-size:15px;font-weight:600;color:#1f2328}
        .__dsh_ann_zone{position:absolute;border:1.5px dashed #2f81f7;background:rgba(47,129,247,.12);pointer-events:none;z-index:7;border-radius:2px}
      `
      document.head.appendChild(style)
      return () => { style.remove() }
    }


    /* ------------------------------------------------------- page titles */

    /** Tiny per-tab title store: the chip renders the page's own <title>. */
    const pageTitles = (() => {
      const map = new Map()
      const listeners = new Set()
      return {
        get(id) { return map.get(id) || '' },
        set(id, title) {
          if (!id) return
          const next = String(title || '').replace(/\s+/g, ' ').trim().slice(0, 64)
          if ((map.get(id) || '') === next) return
          if (next) map.set(id, next)
          else map.delete(id)
          for (const listener of listeners) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
      }
    })()

    function BrowserTitle(props) {
      const { useTabInfo } = props
      useLocaleRevision()
      const tab = useTabInfo().tab
      const title = React.useSyncExternalStore(
        (listener) => pageTitles.subscribe(listener),
        () => pageTitles.get(tab.id),
        () => pageTitles.get(tab.id),
      )
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0 } },
        h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, style: { flex: '0 0 auto' } },
          h('circle', { cx: 8, cy: 8, r: 6, stroke: 'currentColor', strokeWidth: 1.2 }),
          h('path', { d: 'M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12', stroke: 'currentColor', strokeWidth: 1.2 }),
        ),
        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, title || t('tab.browser')),
      )
    }

    /* ------------------------------------------------- stock browser entry */

    /**
     * A small Annotate button at the end of the built-in browser's tab strip.
     *
     * It lives in the browser's own chrome — never over the page — and the
     * built-in browser keeps every feature it has. The button only hands the
     * active tab's URL to this plugin's annotated view.
     *
     * Anchors are semantic (`role="tablist"`, `data-sidebar-right-tab`), not
     * hashed class names; when the strip is absent the entry simply does not
     * render, and nothing breaks.
     */
    function installStripEntry(sidebarRight) {
      const ENTRY = 'data-dsh-ann-entry'
      let frame = 0

      const readUrl = (tabId) => {
        const nodes = tabId
          ? document.querySelectorAll('[data-sidebar-right-tab="' + String(tabId) + '"]')
          : document.querySelectorAll('[data-sidebar-right-session]')
        for (const node of nodes) {
          const input = Array.from(node.querySelectorAll('input')).find((item) => /^https?:\/\//i.test(String(item.value || '')))
          if (input) return String(input.value)
          const iframe = node.querySelector('iframe')
          if (iframe && /^https?:\/\//i.test(iframe.getAttribute('src') || '')) return iframe.getAttribute('src')
        }
        return ''
      }

      const decorate = () => {
        frame = 0
        for (const strip of document.querySelectorAll('[data-sidebar-right-session] [role="tablist"]')) {
          const chip = strip.querySelector('[role="tab"][aria-selected="true"] [data-sidebar-right-tab]') || strip.querySelector('[data-sidebar-right-tab]')
          const tabId = chip && chip.getAttribute('data-sidebar-right-tab')
          // Only when the strip's active tab really shows a web page: no entry
          // while the browser is closed, on other tabs, or on our own tab.
          let hasFrame = false
          let isOurs = false
          if (tabId) {
            for (const node of document.querySelectorAll('[data-sidebar-right-tab="' + String(tabId) + '"]')) {
              if (node.querySelector('[data-dsh-ann-frame]')) isOurs = true
              if (node.querySelector('iframe')) hasFrame = true
            }
          }
          const existing = strip.querySelector('[' + ENTRY + ']')
          if (!hasFrame || isOurs) {
            if (existing) existing.remove()
            continue
          }
          if (existing) continue
          const button = document.createElement('button')
          button.type = 'button'
          button.setAttribute(ENTRY, '')
          button.textContent = t('strip.button')
          button.title = t('strip.buttonTitle')
          button.style.cssText = [
            'height:22px', 'margin:0 4px', 'padding:0 8px', 'flex:0 0 auto', 'align-self:center',
            'border:1px solid rgba(47,129,247,.5)', 'border-radius:11px',
            'background:rgba(47,129,247,.1)', 'color:#2f81f7', 'font-size:11px',
            'cursor:pointer', 'line-height:1', 'white-space:nowrap',
          ].join(';')
          button.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            const url = readUrl(tabId)
            if (url === '') return
            try { sidebarRight.openTab('annotate-browser', { params: { url } }) } catch (error) {}
          })
          strip.appendChild(button)
        }
      }

      const schedule = () => {
        if (frame) return
        frame = window.requestAnimationFrame(decorate)
      }

      const observer = new MutationObserver(schedule)
      observer.observe(document.body, { childList: true, subtree: true })
      schedule()

      return () => {
        observer.disconnect()
        if (frame) window.cancelAnimationFrame(frame)
        for (const node of document.querySelectorAll('[' + ENTRY + ']')) node.remove()
      }
    }

    /* ------------------------------------------------------------------- body */

    function AnnotateBody(props) {
      const { useTabInfo, sessionId, sendPrompt, openBrowserTab } = props
      /* Re-render on a language switch, before anything reads a string. */
      useLocaleRevision()
      const tab = useTabInfo ? useTabInfo().tab : undefined
      const tabId = tab && tab.id
      const initial = (() => {
        const fromParams = tab && tab.navigation && tab.navigation.params && typeof tab.navigation.params.url === 'string'
          ? tab.navigation.params.url
          : ''
        return normalizeUrl(fromParams) || loadPage(sessionId, tabId)
      })()

      const [address, setAddress] = React.useState(initial)
      const [url, setUrl] = React.useState(initial)
      const [reloadKey, setReloadKey] = React.useState(0)
      const [annotating, setAnnotating] = React.useState(false)
      const [pending, setPending] = React.useState(null)
      const [note, setNote] = React.useState('')
      const [marks, setMarks] = React.useState(() => loadMarks(sessionId))
      const [error, setError] = React.useState('')
      const [sent, setSent] = React.useState('')
      const [forceDirect, setForceDirect] = React.useState(false)
      const [proxyFailed, setProxyFailed] = React.useState(false)
      const frameRef = React.useRef(null)
      const addrRef = React.useRef(null)
      const historyRef = React.useRef(initial ? [initial] : [])
      const [cursor, setCursor] = React.useState(historyRef.current.length - 1)
      const annotatingRef = React.useRef(false)
      annotatingRef.current = annotating

      React.useEffect(() => { saveMarks(sessionId, marks) }, [sessionId, marks])
      React.useEffect(() => { savePage(sessionId, tabId, url) }, [sessionId, tabId, url])

      /* A page served by this same server needs no proxy: frame it directly and
         keep its cookies. Pages only reachable from the user's machine (a
         host-mapped port, for instance) also end up here after a failed render. */
      const sameOriginPage = (() => {
        try { return url !== '' && new URL(url).origin === window.location.origin } catch (e) { return false }
      })()
      /* After folding a loopback alias the page is on this origin and annotatable. */
      /* localhost and 127.0.0.1 are the same server on the same port; other
         plugins deliberately swap the two names when they hand a URL over.
         Fold those back onto this window's origin so the page stays annotatable
         instead of becoming a cross-origin frame. */
      const loopbackHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
      const effectiveUrl = (() => {
        try {
          if (url === '') return url
          const target = new URL(url)
          const here = window.location
          if (loopbackHost(target.hostname) && loopbackHost(here.hostname) && target.port === here.port) {
            return here.origin + target.pathname + target.search + target.hash
          }
        } catch (e) {}
        return url
      })()
      const sameLoopbackSite = effectiveUrl !== url
      const directMode = sameOriginPage || sameLoopbackSite || forceDirect
      React.useEffect(() => {
        setForceDirect(false)
        setProxyFailed(false)
      }, [url])


      const go = (next) => {
        const normalized = normalizeUrl(next)
        if (!normalized) return
        const list = historyRef.current.slice(0, cursor + 1)
        list.push(normalized)
        historyRef.current = list
        setCursor(list.length - 1)
        setAddress(normalized)
        setUrl(normalized)
        setPending(null)
        setAnnotating(false)
        setError('')
        try { pageTitles.set(tabId, new URL(normalized).host) } catch (error) {}
      }

      const goTo = (index) => {
        if (index < 0 || index >= historyRef.current.length) return
        const entry = historyRef.current[index]
        setCursor(index)
        setAddress(entry)
        setUrl(entry)
        setPending(null)
        setAnnotating(false)
        setError('')
      }

      const canBack = cursor > 0
      const canForward = cursor >= 0 && cursor < historyRef.current.length - 1

      /* Link interception inside the proxied page posts these to the panel. */
      React.useEffect(() => {
        const onMessage = (event) => {
          const data = event.data
          const frame = frameRef.current
          if (!data || !frame || event.source !== frame.contentWindow) return
          if (data.source !== 'dsh-browser') return
          if (data.kind === 'navigate' || data.kind === 'open') {
            if (typeof data.url !== 'string' || !/^https?:/i.test(data.url)) return
            if (data.kind === 'open' && typeof openBrowserTab === 'function' && tab) {
              openBrowserTab(tab.kind, data.url)
              return
            }
            go(data.url)
          }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
      }, [])

      /* Attach picking + rectangle selection to the (same-origin) document. */
      const attach = React.useCallback(() => {
        const frame = frameRef.current
        if (!frame) return
        // Cross-origin direct load: the page is readable-window only, no DOM.
        if (directMode && !sameOriginPage && !sameLoopbackSite) return
        let doc
        try {
          doc = frame.contentDocument
        } catch (accessError) {
          setError(t('error.crossOrigin'))
          return
        }
        if (!doc || !doc.documentElement) return
        if (!doc.getElementById(STYLE_TAG_ID)) {
          const style = doc.createElement('style')
          style.id = STYLE_TAG_ID
          style.textContent =
            '.' + HL_CLASS + '{outline:2px solid #2f81f7 !important;outline-offset:1px !important}' +
            'html[data-dsh-ann-active],html[data-dsh-ann-active] *{cursor:crosshair !important;user-select:none !important;-webkit-user-select:none !important}' +
            '.__dsh_ann_zone{position:fixed !important;border:1.5px dashed #2f81f7 !important;background:rgba(47,129,247,.12) !important;pointer-events:none !important;z-index:2147483646 !important}'
          ;(doc.head || doc.documentElement).appendChild(style)
        }
        let hovered = null
        let boxEl = null
        let start = null
        let dragging = false
        let suppressClick = false

        const clearHover = () => {
          if (hovered) {
            try { hovered.classList.remove(HL_CLASS) } catch (e) {}
            hovered = null
          }
        }
        const onMove = (event) => {
          if (!annotatingRef.current || dragging) return
          const target = event.target && event.target.nodeType === 1 ? event.target : null
          if (!target || target === hovered) return
          clearHover()
          hovered = target
          try { hovered.classList.add(HL_CLASS) } catch (e) {}
        }
        const onDown = (event) => {
          if (!annotatingRef.current || event.button !== 0) return
          // Never start a native text selection while picking.
          event.preventDefault()
          start = { x: event.clientX, y: event.clientY }
          dragging = false
          suppressClick = false
          clearHover()
        }
        const onDragMove = (event) => {
          if (!annotatingRef.current || !start) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (!dragging && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
          dragging = true
          event.preventDefault()
          event.stopPropagation()
          if (!boxEl) {
            boxEl = doc.createElement('div')
            boxEl.className = '__dsh_ann_zone'
            ;(doc.body || doc.documentElement).appendChild(boxEl)
          }
          const left = Math.min(start.x, event.clientX)
          const top = Math.min(start.y, event.clientY)
          boxEl.style.left = left + 'px'
          boxEl.style.top = top + 'px'
          boxEl.style.width = Math.abs(dx) + 'px'
          boxEl.style.height = Math.abs(dy) + 'px'
        }
        const onUp = (event) => {
          if (!annotatingRef.current || !start) return
          const finish = start
          start = null
          if (!dragging) return
          dragging = false
          suppressClick = true
          event.preventDefault()
          event.stopPropagation()
          const result = describeRegion(doc, { x1: finish.x, y1: finish.y, x2: event.clientX, y2: event.clientY })
          if (boxEl) { try { boxEl.remove() } catch (e) {} boxEl = null }
          setPending(result)
          setNote('')
          setAnnotating(false)
        }
        const onClick = (event) => {
          if (!annotatingRef.current) return
          if (suppressClick) { suppressClick = false; return }
          event.preventDefault()
          event.stopPropagation()
          const target = event.target && event.target.nodeType === 1 ? event.target : null
          clearHover()
          if (!target) return
          setPending(describe(target))
          setNote('')
          setAnnotating(false)
        }
        const onKey = (event) => {
          if (event.key === 'Escape' && annotatingRef.current) {
            event.preventDefault()
            setAnnotating(false)
          }
        }
        const onSelectStart = (event) => {
          if (annotatingRef.current) event.preventDefault()
        }
        doc.addEventListener('mousemove', onMove, true)
        doc.addEventListener('mousedown', onDown, true)
        doc.addEventListener('mousemove', onDragMove, true)
        doc.addEventListener('mouseup', onUp, true)
        doc.addEventListener('click', onClick, true)
        doc.addEventListener('keydown', onKey, true)
        doc.addEventListener('selectstart', onSelectStart, true)
        return () => {
          try {
            doc.removeEventListener('mousemove', onMove, true)
            doc.removeEventListener('mousedown', onDown, true)
            doc.removeEventListener('mousemove', onDragMove, true)
            doc.removeEventListener('mouseup', onUp, true)
            doc.removeEventListener('click', onClick, true)
            doc.removeEventListener('keydown', onKey, true)
            doc.removeEventListener('selectstart', onSelectStart, true)
            if (boxEl) boxEl.remove()
          } catch (e) {}
          clearHover()
        }
      }, [directMode, sameOriginPage])

      React.useEffect(() => {
        const frame = frameRef.current
        if (!frame) return undefined
        let disposeListeners = null
        const onLoad = () => {
          if (disposeListeners) disposeListeners()
          disposeListeners = attach() || null
          try {
            const doc = frame.contentDocument
            const title = doc && doc.title
            const bodyText = doc && doc.body ? String(doc.body.innerText || '').slice(0, 200) : ''
            if (!directMode && (/页面渲染失败/.test(String(title || '')) || /页面渲染失败/.test(bodyText))) {
              // A URL only reachable from the user's machine (a host-mapped port)
              // cannot be rendered here; frame it directly instead of dead-ending.
              if (/ERR_CONNECTION_REFUSED|ERR_ADDRESS_UNREACHABLE|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_TIMED_OUT/.test(bodyText)) {
                setForceDirect(true)
                setProxyFailed(false)
              } else {
                setProxyFailed(true)
              }
              setError('')
            } else if (!title && !directMode && /not found|forbidden|unauthorized/i.test(bodyText)) {
              setError(t('proxy.unavailable'))
            } else {
              setProxyFailed(false)
              setError('')
            }
            const shown = title || (() => { try { return new URL(url).host } catch (e) { return '' } })()
            if (shown) pageTitles.set(tab.id, shown)
          } catch (e) {}
        }
        frame.addEventListener('load', onLoad)
        if (frame.contentDocument && frame.contentDocument.readyState === 'complete') onLoad()
        return () => {
          frame.removeEventListener('load', onLoad)
          if (disposeListeners) disposeListeners()
        }
      }, [url, reloadKey, attach, directMode])

      const pageId = (() => {
        try { return new URL(url).host } catch (e) { return url }
      })()

      /* Adding a note returns to picking; leaving the mode is the only stop. */
      const saveMark = () => {
        if (!pending) return
        const text = note.trim()
        if (text === '') return
        const order = marks.length + 1
        setMarks((list) => list.concat([{
          id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          page: url,
          pageId,
          target: pending,
          comment: text,
          at: Date.now(),
        }]))
        setPending(null)
        setNote('')
        setAnnotating(true)
        setSent(t('annotate.noted', { order: order }))
        setTimeout(() => setSent(''), 3500)
      }

      const dropPending = () => { setPending(null); setNote(''); setAnnotating(true) }

      const toggleMode = () => {
        if (annotating) { setAnnotating(false); return }
        setPending(null)
        setAnnotating(true)
      }

      const submit = async () => {
        /* Selection order is the list order: marks are appended, never sorted. */
        const ordered = marks.slice()
        if (pending && note.trim() !== '') {
          ordered.push({ id: 'pending', page: url, pageId, target: pending, comment: note.trim() })
        }
        const list = ordered
        if (list.length === 0) return
        const lines = []
        lines.push(t('message.header', { count: list.length, pageId: pageId }))
        lines.push(t('message.page', { url: url }))
        lines.push('')
        list.forEach((mark, index) => {
          const t = mark.target || {}
          const n = index + 1
          if (t.kind === 'region') {
            lines.push(t('message.region', {
            index: n,
            size: t.rect ? t.rect.width + '×' + t.rect.height : '',
            x: t.rect ? t.rect.x : '',
            y: t.rect ? t.rect.y : '',
            inside: t.elements && t.elements.length ? t('message.regionInside', { count: t.total || t.elements.length }) : '',
          }))
            if (t.elements && t.elements.length) {
              t.elements.forEach((el) => {
                lines.push(t('message.elementLine', { selector: el.selector || el.tag, text: el.text ? ' 「' + el.text + '」' : '' }))
              })
              if (t.total && t.total > t.elements.length) lines.push(t('message.more', { count: t.total - t.elements.length }))
            }
          } else {
            const quote = t.text ? ' 「' + t.text + '」' : ''
            lines.push(t('message.element', { index: n, target: t.selector || t.tag || 'element', text: quote }))
            if (t.rect) lines.push(t('message.position', { size: t.rect.width + '×' + t.rect.height, x: t.rect.x, y: t.rect.y }))
          }
          lines.push(t('message.note', { comment: mark.comment }))
        })
        const text = lines.join('\n')
        try {
          if (typeof sendPrompt !== 'function') throw new Error(t('error.noSessions'))
          await sendPrompt(sessionId, text)
          setMarks([])
          setPending(null)
          setNote('')
          setSent(t('marks.sent', { count: list.length }))
          saveMarks(sessionId, [])
          setTimeout(() => setSent(''), 4000)
        } catch (sendError) {
          setError(t('error.sendFailed', { reason: String(sendError && sendError.message ? sendError.message : sendError) }))
        }
      }

      /* Crosshair + no text selection only while annotating; exiting restores both. */
      React.useEffect(() => {
        const frame = frameRef.current
        const doc = frame && frame.contentDocument
        if (!doc || !doc.documentElement) return
        const root = doc.documentElement
        if (annotating) {
          root.setAttribute('data-dsh-ann-active', '')
          return
        }
        root.removeAttribute('data-dsh-ann-active')
        try {
          const hovered = doc.querySelectorAll('.' + HL_CLASS)
          for (const node of hovered) node.classList.remove(HL_CLASS)
          const zone = doc.getElementById(BOX_TAG_ID)
          if (zone) zone.remove()
          const leftover = doc.querySelector('.__dsh_ann_zone')
          if (leftover) leftover.remove()
        } catch (error) {}
      }, [annotating, url, reloadKey])

      /* Esc anywhere in the panel leaves the mode as well. */
      React.useEffect(() => {
        if (!annotating) return undefined
        const onKey = (event) => { if (event.key === 'Escape') setAnnotating(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [annotating])

      const toolbars = h('div', { className: '__dsh_ann_bar' },
        h('button', { className: '__dsh_ann_btn', title: t('toolbar.back'), disabled: !canBack, onClick: () => goTo(cursor - 1) }, '←'),
        h('button', { className: '__dsh_ann_btn', title: t('toolbar.forward'), disabled: !canForward, onClick: () => goTo(cursor + 1) }, '→'),
        h('button', { className: '__dsh_ann_btn', title: t('toolbar.reload'), onClick: () => setReloadKey((k) => k + 1) }, '⟳'),
        h('input', {
          className: '__dsh_ann_addr',
          ref: addrRef,
          value: address,
          placeholder: t('toolbar.addressPlaceholder'),
          onChange: (event) => setAddress(event.target.value),
          onKeyDown: (event) => { if (event.key === 'Enter') go(event.currentTarget.value) },
          spellCheck: false,
        }),
        h('button', { className: '__dsh_ann_btn __dsh_ann_primary', onClick: () => go(addrRef.current ? addrRef.current.value : address) }, t('toolbar.open')),
        h('button', {
          className: '__dsh_ann_btn',
          title: t('toolbar.openExternal'),
          onClick: () => {
            const target = effectiveUrl || url
            if (target) window.open(target, '_blank', 'noopener,noreferrer')
          },
        }, '↗'),
        h('button', {
          className: '__dsh_ann_btn',
          'data-active': annotating ? 'true' : 'false',
          disabled: directMode && !sameOriginPage && !sameLoopbackSite,
          title: directMode && !sameOriginPage && !sameLoopbackSite ? t('toolbar.annotateDisabled') : (annotating ? t('toolbar.annotateStopTitle') : t('toolbar.annotateTitle')),
          onClick: toggleMode,
        }, annotating ? t('toolbar.annotateStop') : t('toolbar.annotate')),
        marks.length > 0 ? h('span', { style: { color: '#57606a', fontSize: '12px' } }, t('toolbar.markCount', { count: marks.length })) : null,
        marks.length > 0 ? h('button', { className: '__dsh_ann_btn', onClick: () => setMarks([]) }, t('toolbar.clear')) : null,
      )

      const frame = h('div', { className: '__dsh_ann_frame' },
        url === ''
          ? h('div', { className: '__dsh_ann_start' },
              h('div', { className: '__dsh_ann_startTitle' }, t('empty.title')),
              h('div', null, t('empty.body')),
            )
          : h('iframe', {
            ref: frameRef,
            key: url + '#' + reloadKey + (directMode ? '#direct' : ''),
            src: directMode ? (sameLoopbackSite && !sameOriginPage ? effectiveUrl : url) : PROXY + '?url=' + encodeURIComponent(url),
            title: 'annotate-browser',
            'data-dsh-ann-frame': '',
          }),
        annotating ? h('div', { className: '__dsh_ann_hint' }, t('annotate.hint')) : null,
        proxyFailed && !directMode ? h('div', { className: '__dsh_ann_card', style: { borderColor: '#d1242f' } },
          h('div', { className: '__dsh_ann_target' }, t('proxy.unreachable')),
          h('div', { className: '__dsh_ann_actions' },
            h('button', { className: '__dsh_ann_btn', onClick: () => setProxyFailed(false) }, t('proxy.dismiss')),
            h('button', {
              className: '__dsh_ann_btn __dsh_ann_primary',
              onClick: () => { setProxyFailed(false); setForceDirect(true) },
            }, t('proxy.loadDirect')),
          ),
        ) : null,
        forceDirect && !sameOriginPage ? h('div', { className: '__dsh_ann_hint', style: { background: 'rgba(209,36,47,.9)' } }, t('proxy.directNotice')) : null,
        pending ? h('div', { className: '__dsh_ann_card' },
          h('div', { className: '__dsh_ann_target' },
            pending.kind === 'region'
              ? h('span', null, t('annotate.region', { width: pending.rect.width, height: pending.rect.height, x: pending.rect.x, y: pending.rect.y }) + (pending.elements && pending.elements.length ? t('annotate.regionElements', { count: pending.elements.length }) : ''))
              : h('span', null, h('code', null, pending.selector || pending.tag), pending.text ? ' 「' + pending.text.slice(0, 60) + '」' : ''),
          ),
          h('textarea', {
            autoFocus: true,
            value: note,
            placeholder: pending.kind === 'region' ? t('annotate.noteRegion') : t('annotate.noteElement'),
            onChange: (event) => setNote(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Escape') dropPending()
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) saveMark()
            },
          }),
          h('div', { className: '__dsh_ann_actions' },
            h('button', { className: '__dsh_ann_btn', onClick: dropPending }, t('annotate.cancel')),
            h('button', { className: '__dsh_ann_btn __dsh_ann_primary', disabled: note.trim() === '', onClick: saveMark }, t('annotate.add')),
          ),
        ) : null,
      )

      const list = marks.length === 0 ? null : h('div', { className: '__dsh_ann_marks' },
        marks.map((mark, index) => h('div', { className: '__dsh_ann_mark', key: mark.id || ('m' + index) },
          h('b', null, String(index + 1)),
          h('div', { style: { flex: '1 1 auto', minWidth: 0 } },
            h('div', null, mark.comment),
            h('code', null, mark.target && mark.target.kind === 'region'
              ? t('marks.regionMeta', { width: mark.target.rect.width, height: mark.target.rect.height }) + (mark.target.elements && mark.target.elements.length ? t('marks.regionElements', { count: mark.target.total || mark.target.elements.length }) : '')
              : (mark.target && (mark.target.selector || mark.target.tag)) || ''),
          ),
          h('button', { className: '__dsh_ann_btn', title: t('marks.delete'), onClick: () => setMarks((all) => all.filter((m, i) => i !== index)) }, '×'),
        )),
        h('footer', null,
          h('span', { style: { color: '#57606a' } }, t('marks.pending', { count: marks.length })),
          h('button', { className: '__dsh_ann_btn __dsh_ann_primary', onClick: submit }, t('marks.send')),
        ),
      )

      return h('div', { className: '__dsh_ann_root' },
        toolbars,
        frame,
        list,
        error ? h('div', { className: '__dsh_ann_err', style: { padding: '0 8px 6px' } }, error) : null,
        sent ? h('div', { style: { padding: '0 8px 6px', color: '#1a7f37', fontSize: '12px' } }, sent) : null,
      )
    }

    /* ------------------------------------------------------------------ apply */

    return {
      inject: ['slots', 'sessions', 'locale'],
      apply(ctx) {
        ctx.effect(() => installStyles(), 'dsh-annotated-browser: styles')

        /* ---------------------------------------------------------- locale
         *
         * Register the dictionaries under this plugin's own namespace and bind
         * `t` to the live service, so a language switch in Settings reaches
         * every string without a reload. `inject` guarantees `locale` is
         * present; the guard only covers a host that mounted without it.
         */
        ctx.effect(() => {
          const locale = ctx.get('locale')
          if (!locale || typeof locale.register !== 'function') return () => {}
          const disposers = Object.keys(DICTIONARIES).map((language) =>
            locale.register(NS, language, DICTIONARIES[language]),
          )
          localeService = locale
          boundT = locale.bind(NS)
          return () => {
            for (const dispose of disposers) {
              try { dispose() } catch (error) {}
            }
            localeService = null
            boundT = null
          }
        }, 'dsh-annotated-browser: locale dictionaries')

        /* The client half has no row config; the host owns the switch. */
        const modeReady = (async () => {
          try {
            const response = await fetch('/api/annotated-browser/config', { credentials: 'same-origin' })
            if (!response.ok) return { takeover: true }
            const body = await response.json()
            return body && body.value ? body.value : { takeover: true }
          } catch (error) {
            return { takeover: true }
          }
        })()

        const sendPrompt = async (sessionId, text) => {
          const sessions = ctx.get('sessions')
          if (!sessions) throw new Error(t('error.noSessionService'))
          const conversation = sessions.scope(sessionId) && sessions.scope(sessionId).get('conversation')
          if (conversation) {
            await conversation.send(text)
            return
          }
          const binding = sessions.binding(sessionId)
          const session = binding && binding.session
          if (!session) throw new Error(t('error.sessionClosed'))
          const result = await session.prompt([{ type: 'text', text }], 'queue')
          if (!result || result.ok !== true) throw new Error(t('error.notSent'))
        }

        ctx.inject(['sidebarRight', 'sidebarRightTabs'], async (sidebar) => {
          /* Two modes:
           *
           *  - takeover (default): the plugin provides the `browser` type itself,
           *    so pages open straight into the annotatable view.
           *  - side (takeover: false): the stock browser is untouched; an
           *    Annotate button in its tab strip hands the current URL over.
           */
          const mode = await modeReady
          const takeover = !(mode && mode.takeover === false)

          const injectBody = (fallbackKind) => () => ({
            sendPrompt,
            openBrowserTab: (kind, url) =>
              sidebar.sidebarRight.openTab(kind || fallbackKind, { params: { url }, revealIfOpened: false }),
          })

          const bodyKeys = []

          let tookOver = false
          if (takeover) {
            const browserType = {
              id: ID + ':browser',
              kind: 'browser',
              multiple: true,
              keepMounted: true,
              title: () => t('tab.browser'),
              guide: [
                {
                  id: 'annotate-browser',
                  commandId: 'browser.new',
                  order: 30,
                  title: () => t('tab.browser'),
                  description: () => t('guide.browser.desc'),
                },
              ],
            }
            sidebar.effect(() => {
              try {
                const dispose = sidebar.sidebarRightTabs.register(browserType)
                tookOver = true
                return dispose
              } catch (error) {
                // Another plugin already owns the browser kind: keep that one,
                // stay available as the separate annotated tab instead.
                tookOver = false
                if (typeof console !== 'undefined') console.warn('[annotated-browser] browser kind already taken:', error && error.message)
                return () => {}
              }
            }, 'dsh-annotated-browser: browser takeover')
            sidebar.slots.inject('sidebar.right.pane.tab', () =>
              sidebar.slots.register(
                { name: 'sidebar.right.pane.tab', key: browserType.id, inject: injectBody('browser') },
                AnnotateBody,
              ),
            )
            bodyKeys.push(browserType.id)
          }

          /* The annotate kind stays registered either way: it is the hand-off
             target in side mode, and it keeps tabs opened by older builds. */
          const alias = {
            id: ID,
            kind: KIND,
            multiple: true,
            keepMounted: true,
            title: () => t('tab.annotate'),
            ...(takeover && tookOver
              ? {}
              : {
                  guide: [
                    {
                      id: 'annotate-browser',
                      order: 40,
                      title: () => t('tab.annotate'),
                      description: () => t('guide.annotate.desc'),
                    },
                  ],
                }),
          }
          sidebar.effect(() => sidebar.sidebarRightTabs.register(alias), 'dsh-annotated-browser: annotate kind')
          sidebar.slots.inject('sidebar.right.pane.tab', () =>
            sidebar.slots.register(
              { name: 'sidebar.right.pane.tab', key: alias.id, inject: injectBody(KIND) },
              AnnotateBody,
            ),
          )
          bodyKeys.push(alias.id)

          sidebar.slots.inject('sidebar.right.pane.tab.title', () => {
            const disposers = bodyKeys.map((key) =>
              sidebar.slots.register({ name: 'sidebar.right.pane.tab.title', key }, BrowserTitle),
            )
            return () => { for (const dispose of disposers) dispose() }
          })

          if (!takeover || !tookOver) {
            sidebar.effect(() => installStripEntry(sidebar.sidebarRight), 'dsh-annotated-browser: tab strip entry')
          }
        })
      },
    }
  },
})
