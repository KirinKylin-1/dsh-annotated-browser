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
 *  - picking stays on after a note is added — only the 退出标注 button or Esc
 *    leaves the mode;
 *  - the collected list is persisted per Session in localStorage, so closing
 *    the tab or reloading the page keeps it until 清空.
 */
window.__ModuleLoader__.load({
  id: 'dsh-annotated-browser',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

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
        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, title || '浏览器'),
      )
    }

    /* ------------------------------------------------- stock browser entry */

    /**
     * A small 「标注」 button at the end of the built-in browser's tab strip.
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
          button.textContent = '标注'
          button.title = '在当前页面标注（打开标注视图）'
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
          setError('无法访问页面 DOM（跨域），标注不可用')
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
              setError('页面代理不可用：请确认插件 host 半已加载，且本机装有 Chrome/Chromium（或在插件配置里指定 browserExecutable）')
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
        setSent('已加入第 ' + order + ' 条，可以继续点选（Esc 或「退出标注」结束）')
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
        lines.push('【内置浏览器批注】' + list.length + ' 处 · ' + pageId)
        lines.push('页面：' + url)
        lines.push('')
        list.forEach((mark, index) => {
          const t = mark.target || {}
          const n = index + 1
          if (t.kind === 'region') {
            lines.push(n + '. 区域 ' + (t.rect ? t.rect.width + '×' + t.rect.height : '') + (t.rect ? ' @ (' + t.rect.x + ',' + t.rect.y + ')' : '') + (t.elements && t.elements.length ? '（框内 ' + (t.total || t.elements.length) + ' 个元素）' : ''))
            if (t.elements && t.elements.length) {
              t.elements.forEach((el) => {
                lines.push('   - ' + (el.selector || el.tag) + (el.text ? ' 「' + el.text + '」' : ''))
              })
              if (t.total && t.total > t.elements.length) lines.push('   - …另有 ' + (t.total - t.elements.length) + ' 个元素未列出')
            }
          } else {
            const quote = t.text ? ' 「' + t.text + '」' : ''
            lines.push(n + '. ' + (t.selector || t.tag || 'element') + quote)
            if (t.rect) lines.push('   位置：' + t.rect.width + '×' + t.rect.height + ' @ (' + t.rect.x + ',' + t.rect.y + ')')
          }
          lines.push('   备注：' + mark.comment)
        })
        const text = lines.join('\n')
        try {
          if (typeof sendPrompt !== 'function') throw new Error('会话服务不可用')
          await sendPrompt(sessionId, text)
          setMarks([])
          setPending(null)
          setNote('')
          setSent('已发送 ' + list.length + ' 条到当前会话')
          saveMarks(sessionId, [])
          setTimeout(() => setSent(''), 4000)
        } catch (sendError) {
          setError('发送失败：' + String(sendError && sendError.message ? sendError.message : sendError))
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
        h('button', { className: '__dsh_ann_btn', title: '后退', disabled: !canBack, onClick: () => goTo(cursor - 1) }, '←'),
        h('button', { className: '__dsh_ann_btn', title: '前进', disabled: !canForward, onClick: () => goTo(cursor + 1) }, '→'),
        h('button', { className: '__dsh_ann_btn', title: '刷新', onClick: () => setReloadKey((k) => k + 1) }, '⟳'),
        h('input', {
          className: '__dsh_ann_addr',
          ref: addrRef,
          value: address,
          placeholder: '输入网址后回车',
          onChange: (event) => setAddress(event.target.value),
          onKeyDown: (event) => { if (event.key === 'Enter') go(event.currentTarget.value) },
          spellCheck: false,
        }),
        h('button', { className: '__dsh_ann_btn __dsh_ann_primary', onClick: () => go(addrRef.current ? addrRef.current.value : address) }, '打开'),
        h('button', {
          className: '__dsh_ann_btn',
          title: '在系统浏览器中打开（交给浏览器处理，不影响本面板）',
          onClick: () => {
            const target = effectiveUrl || url
            if (target) window.open(target, '_blank', 'noopener,noreferrer')
          },
        }, '↗'),
        h('button', {
          className: '__dsh_ann_btn',
          'data-active': annotating ? 'true' : 'false',
          disabled: directMode && !sameOriginPage && !sameLoopbackSite,
          title: directMode && !sameOriginPage && !sameLoopbackSite ? '跨域直接加载的页面无法标注' : (annotating ? '退出标注（Esc）' : '标注：点元素，或拖拽框选区域'),
          onClick: toggleMode,
        }, annotating ? '退出标注' : '标注'),
        marks.length > 0 ? h('span', { style: { color: '#57606a', fontSize: '12px' } }, marks.length + ' 条') : null,
        marks.length > 0 ? h('button', { className: '__dsh_ann_btn', onClick: () => setMarks([]) }, '清空') : null,
      )

      const frame = h('div', { className: '__dsh_ann_frame' },
        url === ''
          ? h('div', { className: '__dsh_ann_start' },
              h('div', { className: '__dsh_ann_startTitle' }, '浏览器'),
              h('div', null, '在上方地址栏输入网址开始浏览；点「标注」可对页面元素或区域写备注。'),
            )
          : h('iframe', {
            ref: frameRef,
            key: url + '#' + reloadKey + (directMode ? '#direct' : ''),
            src: directMode ? (sameLoopbackSite && !sameOriginPage ? effectiveUrl : url) : PROXY + '?url=' + encodeURIComponent(url),
            title: 'annotate-browser',
            'data-dsh-ann-frame': '',
          }),
        annotating ? h('div', { className: '__dsh_ann_hint' }, '点元素标注，或按住鼠标拖出区域 · Esc 退出') : null,
        proxyFailed && !directMode ? h('div', { className: '__dsh_ann_card', style: { borderColor: '#d1242f' } },
          h('div', { className: '__dsh_ann_target' }, '服务端打不开这个地址（它可能只在你这台机器上可访问，例如宿主机映射的端口）。'),
          h('div', { className: '__dsh_ann_actions' },
            h('button', { className: '__dsh_ann_btn', onClick: () => setProxyFailed(false) }, '关闭提示'),
            h('button', {
              className: '__dsh_ann_btn __dsh_ann_primary',
              onClick: () => { setProxyFailed(false); setForceDirect(true) },
            }, '直接加载（只读）'),
          ),
        ) : null,
        forceDirect && !sameOriginPage ? h('div', { className: '__dsh_ann_hint', style: { background: 'rgba(209,36,47,.9)' } }, '代理访问不到该地址，已改为直接加载：跨域页面无法标注，仅供查看') : null,
        pending ? h('div', { className: '__dsh_ann_card' },
          h('div', { className: '__dsh_ann_target' },
            pending.kind === 'region'
              ? h('span', null, '区域 ' + pending.rect.width + '×' + pending.rect.height + '@(' + pending.rect.x + ',' + pending.rect.y + ')' + (pending.elements && pending.elements.length ? ' · 覆盖 ' + pending.elements.length + ' 个元素' : ''))
              : h('span', null, h('code', null, pending.selector || pending.tag), pending.text ? ' 「' + pending.text.slice(0, 60) + '」' : ''),
          ),
          h('textarea', {
            autoFocus: true,
            value: note,
            placeholder: pending.kind === 'region' ? '这块区域要怎么改？' : '这个元素要怎么改？',
            onChange: (event) => setNote(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Escape') dropPending()
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) saveMark()
            },
          }),
          h('div', { className: '__dsh_ann_actions' },
            h('button', { className: '__dsh_ann_btn', onClick: dropPending }, '取消'),
            h('button', { className: '__dsh_ann_btn __dsh_ann_primary', disabled: note.trim() === '', onClick: saveMark }, '加入列表'),
          ),
        ) : null,
      )

      const list = marks.length === 0 ? null : h('div', { className: '__dsh_ann_marks' },
        marks.map((mark, index) => h('div', { className: '__dsh_ann_mark', key: mark.id || ('m' + index) },
          h('b', null, String(index + 1)),
          h('div', { style: { flex: '1 1 auto', minWidth: 0 } },
            h('div', null, mark.comment),
            h('code', null, mark.target && mark.target.kind === 'region'
              ? '区域 ' + mark.target.rect.width + '×' + mark.target.rect.height + (mark.target.elements && mark.target.elements.length ? ' · 框内 ' + (mark.target.total || mark.target.elements.length) + ' 个元素' : '')
              : (mark.target && (mark.target.selector || mark.target.tag)) || ''),
          ),
          h('button', { className: '__dsh_ann_btn', title: '删除', onClick: () => setMarks((all) => all.filter((m, i) => i !== index)) }, '×'),
        )),
        h('footer', null,
          h('span', { style: { color: '#57606a' } }, marks.length + ' 条待发送'),
          h('button', { className: '__dsh_ann_btn __dsh_ann_primary', onClick: submit }, '发送到会话'),
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
      inject: ['slots', 'sessions'],
      apply(ctx) {
        ctx.effect(() => installStyles(), 'dsh-annotated-browser: styles')

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
          if (!sessions) throw new Error('sessions 服务不可用')
          const conversation = sessions.scope(sessionId) && sessions.scope(sessionId).get('conversation')
          if (conversation) {
            await conversation.send(text)
            return
          }
          const binding = sessions.binding(sessionId)
          const session = binding && binding.session
          if (!session) throw new Error('当前会话已关闭')
          const result = await session.prompt([{ type: 'text', text }], 'queue')
          if (!result || result.ok !== true) throw new Error('消息未能发送')
        }

        ctx.inject(['sidebarRight', 'sidebarRightTabs'], async (sidebar) => {
          /* Two modes:
           *
           *  - takeover (default): the plugin provides the `browser` type itself,
           *    so pages open straight into the annotatable view.
           *  - side (takeover: false): the stock browser is untouched; a 标注
           *    button in its tab strip hands the current URL over instead.
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
              title: () => '浏览器',
              guide: [
                {
                  id: 'annotate-browser',
                  commandId: 'browser.new',
                  order: 30,
                  title: () => '浏览器',
                  description: () => '带标注的浏览器：点元素或框选区域写备注，直接发进对话',
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
            title: () => '标注浏览器',
            ...(takeover && tookOver
              ? {}
              : {
                  guide: [
                    {
                      id: 'annotate-browser',
                      order: 40,
                      title: () => '标注浏览器',
                      description: () => '带标注的浏览器：点元素/框选区域写备注，直接发进对话',
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
