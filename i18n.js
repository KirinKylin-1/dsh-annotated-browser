/**
 * dsh-annotated-browser — UI dictionaries.
 *
 * Every string the panel draws lives here. The two base dictionaries are
 * required by the locale service (`zh` and `en`); anything else is optional
 * and falls back along the locale chain, ending at English.
 *
 * Keys are flat and grouped by area so a translator can work one screen at a
 * time. Placeholders are `{name}` and are interpolated after lookup, so they
 * must survive translation verbatim.
 */

/** Host locale namespace owned by this plugin. */
export const NS = 'dsh-annotated-browser'

export const zh = {
  /* ---------------------------------------------------------- tab titles */
  'tab.browser': '浏览器',
  'tab.annotate': '标注浏览器',

  /* --------------------------------------------------------- guide cards */
  'guide.browser.title': '浏览器',
  'guide.browser.desc': '带标注的浏览器：点元素或框选区域写备注，直接发进对话',
  'guide.annotate.title': '标注浏览器',
  'guide.annotate.desc': '带标注的浏览器：点元素/框选区域写备注，直接发进对话',

  /* ------------------------------------------------- stock strip button */
  'strip.button': '标注',
  'strip.buttonTitle': '在当前页面标注（打开标注视图）',

  /* ------------------------------------------------------------ toolbar */
  'toolbar.back': '后退',
  'toolbar.forward': '前进',
  'toolbar.reload': '刷新',
  'toolbar.addressPlaceholder': '输入网址后回车',
  'toolbar.open': '打开',
  'toolbar.openExternal': '在系统浏览器中打开（交给浏览器处理，不影响本面板）',
  'toolbar.annotate': '标注',
  'toolbar.annotateStop': '退出标注',
  'toolbar.annotateTitle': '标注：点元素，或拖拽框选区域',
  'toolbar.annotateStopTitle': '退出标注（Esc）',
  'toolbar.annotateDisabled': '跨域直接加载的页面无法标注',
  'toolbar.markCount': '{count} 条',
  'toolbar.clear': '清空',

  /* --------------------------------------------------------- empty state */
  'empty.title': '浏览器',
  'empty.body': '在上方地址栏输入网址开始浏览；点「标注」可对页面元素或区域写备注。',

  /* --------------------------------------------------------- annotation */
  'annotate.hint': '点元素标注，或按住鼠标拖出区域 · Esc 退出',
  'annotate.noteElement': '这个元素要怎么改？',
  'annotate.noteRegion': '这块区域要怎么改？',
  'annotate.add': '加入列表',
  'annotate.cancel': '取消',
  'annotate.drop': '退出标注',
  'annotate.region': '区域 {width}×{height}@({x},{y})',
  'annotate.regionElements': ' · 覆盖 {count} 个元素',
  'annotate.noted': '已加入第 {order} 条，可以继续点选（Esc 或「退出标注」结束）',

  /* ------------------------------------------------------------ mark list */
  'marks.pending': '{count} 条待发送',
  'marks.send': '发送到会话',
  'marks.delete': '删除',
  'marks.regionMeta': '区域 {width}×{height}',
  'marks.regionElements': ' · 框内 {count} 个元素',
  'marks.sent': '已发送 {count} 条到当前会话',

  /* -------------------------------------------------------- proxy states */
  'proxy.unreachable': '服务端打不开这个地址（它可能只在你这台机器上可访问，例如宿主机映射的端口）。',
  'proxy.dismiss': '关闭提示',
  'proxy.loadDirect': '直接加载（只读）',
  'proxy.directNotice': '代理访问不到该地址，已改为直接加载：跨域页面无法标注，仅供查看',
  'proxy.unavailable': '页面代理不可用：请确认插件 host 半已加载，且本机装有 Chrome/Chromium（或在插件配置里指定 browserExecutable）',

  /* ------------------------------------------------------------- errors */
  'error.crossOrigin': '无法访问页面 DOM（跨域），标注不可用',
  'error.sendFailed': '发送失败：{reason}',
  'error.noSessions': '会话服务不可用',
  'error.sessionClosed': '当前会话已关闭',
  'error.notSent': '消息未能发送',
  'error.noSessionService': 'sessions 服务不可用',

  /* ------------------------------------------------- message sent to chat */
  'message.header': '【内置浏览器批注】{count} 处 · {pageId}',
  'message.page': '页面：{url}',
  'message.region': '{index}. 区域 {size} @ ({x},{y}){inside}',
  'message.regionInside': '（框内 {count} 个元素）',
  'message.elementLine': '   - {selector}{text}',
  'message.more': '   - …另有 {count} 个元素未列出',
  'message.element': '{index}. {target}{text}',
  'message.position': '   位置：{size} @ ({x},{y})',
  'message.note': '   备注：{comment}',
}

export const en = {
  /* ---------------------------------------------------------- tab titles */
  'tab.browser': 'Browser',
  'tab.annotate': 'Annotated browser',

  /* --------------------------------------------------------- guide cards */
  'guide.browser.title': 'Browser',
  'guide.browser.desc': 'Browser with annotation: pick an element or drag a region, write the note, send it into the conversation',
  'guide.annotate.title': 'Annotated browser',
  'guide.annotate.desc': 'Browser with annotation: pick an element or drag a region, write the note, send it into the conversation',

  /* ------------------------------------------------- stock strip button */
  'strip.button': 'Annotate',
  'strip.buttonTitle': 'Annotate this page (open the annotated view)',

  /* ------------------------------------------------------------ toolbar */
  'toolbar.back': 'Back',
  'toolbar.forward': 'Forward',
  'toolbar.reload': 'Reload',
  'toolbar.addressPlaceholder': 'Enter a URL and press Enter',
  'toolbar.open': 'Open',
  'toolbar.openExternal': 'Open in the system browser (hands off to the browser, this panel is unaffected)',
  'toolbar.annotate': 'Annotate',
  'toolbar.annotateStop': 'Exit annotation',
  'toolbar.annotateTitle': 'Annotate: click an element, or drag to frame a region',
  'toolbar.annotateStopTitle': 'Exit annotation (Esc)',
  'toolbar.annotateDisabled': 'A cross-origin page loaded directly cannot be annotated',
  'toolbar.markCount': '{count} notes',
  'toolbar.clear': 'Clear',

  /* --------------------------------------------------------- empty state */
  'empty.title': 'Browser',
  'empty.body': 'Enter a URL in the address bar above to start browsing; click Annotate to leave a note on an element or a region.',

  /* --------------------------------------------------------- annotation */
  'annotate.hint': 'Click an element to annotate, or drag to frame a region · Esc to exit',
  'annotate.noteElement': 'What should change about this element?',
  'annotate.noteRegion': 'What should change in this region?',
  'annotate.add': 'Add to list',
  'annotate.cancel': 'Cancel',
  'annotate.drop': 'Exit annotation',
  'annotate.region': 'Region {width}×{height}@({x},{y})',
  'annotate.regionElements': ' · covers {count} elements',
  'annotate.noted': 'Added as note {order}; keep picking (Esc or Exit annotation to stop)',

  /* ------------------------------------------------------------ mark list */
  'marks.pending': '{count} notes pending',
  'marks.send': 'Send to conversation',
  'marks.delete': 'Delete',
  'marks.regionMeta': 'Region {width}×{height}',
  'marks.regionElements': ' · {count} elements inside',
  'marks.sent': 'Sent {count} notes to the current conversation',

  /* -------------------------------------------------------- proxy states */
  'proxy.unreachable': 'The server cannot reach this address (it may only be reachable from your machine, such as a host-mapped port).',
  'proxy.dismiss': 'Dismiss',
  'proxy.loadDirect': 'Load directly (read-only)',
  'proxy.directNotice': 'The proxy cannot reach this address, so it was loaded directly: a cross-origin page cannot be annotated, viewing only',
  'proxy.unavailable': 'Page proxy unavailable: check that the plugin host half is loaded and that Chrome/Chromium is installed on this machine (or set browserExecutable in the plugin config)',

  /* ------------------------------------------------------------- errors */
  'error.crossOrigin': 'Cannot read the page DOM (cross-origin), annotation unavailable',
  'error.sendFailed': 'Send failed: {reason}',
  'error.noSessions': 'Session service unavailable',
  'error.sessionClosed': 'This conversation is closed',
  'error.notSent': 'The message was not sent',
  'error.noSessionService': 'sessions service unavailable',

  /* ------------------------------------------------- message sent to chat */
  'message.header': '[Built-in browser notes] {count} notes · {pageId}',
  'message.page': 'Page: {url}',
  'message.region': '{index}. Region {size} @ ({x},{y}){inside}',
  'message.regionInside': ' ({count} elements inside)',
  'message.elementLine': '   - {selector}{text}',
  'message.more': '   - …{count} more elements not listed',
  'message.element': '{index}. {target}{text}',
  'message.position': '   Position: {size} @ ({x},{y})',
  'message.note': '   Note: {comment}',
}

/** Dictionaries keyed by locale id, in the shape `ctx.locale.register` takes. */
export const DICTIONARIES = { zh, en }
