# dsh-annotated-browser

**在真实网页上标注，把备注直接发进对话。** 点一个元素，或者当你要说的东西横跨好几个节点时拖出一块区域；写下要改什么；发送。模型收到的是选择器、可见文本和位置——不是一张需要靠猜的截图。

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.1%2B-4d6bfe)](https://www.npmjs.com/package/@deepseek-ai/dsh)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)

[English](README.md) · **中文**

</div>

---

## 它能解决什么

要在真实网页上精准描述「这里要改」，你需要两样东西：**看到那一页**，以及**说清楚是哪一块**。这个插件就是为这两件事做的。

**让更多页面能正常打开。** 有些站点会通过 `X-Frame-Options` 或 CSP `frame-ancestors` 声明自己不允许被嵌入。这类声明对直接嵌 iframe 的页面生效，本插件不走那条路：它在宿主上用无头 Chromium 渲染页面，再把执行后的 HTML 从 DSH 自己的源返回，页面因而不受嵌入声明的限制，能正常显示。

**让页面内容可被读取。** 因为渲染结果来自 DSH 自己的源，面板和页面**同源**——这是标注得以成立的前提。同源之后，插件能读到页面 DOM，从而提供这些能力：

- 点一个元素，拿到它的**选择器**（`#id`、`data-testid`、或沿父级回溯的 CSS 路径）；
- 拖一块区域，列出**框内所有元素**，而不只是最外层那个；
- 把可见文本、元素位置和你的备注一起记下；
- 一次点选可以连续进行，最后**按点选顺序**合并成一条消息发进对话。

**尊重你已经装的东西。** 设 `takeover: false` 时，插件不替换 `browser` 标签类型：快捷键、「在系统浏览器中打开」、历史记录，以及其他插件打开 `browser` 标签的行为都保持原样。插件只是**额外**提供一个独立的标注标签，和在标签栏里的一个交接按钮。

**一次说清一整页。** 加完一条备注会继续停在点选状态，你可以一路点下去，直到按 Esc。所有备注攒成一个列表，最后作为**一条**消息发出，所以走查一整页是一个回合，不是十几个来回。

**已经同源的地方不绕路。** 由这台 DSH 自己提供的页面（比如其他插件挂载的页面）直接以同源 iframe 打开，登录态保留，也不必再绕一次 Chromium。

**打不开时也说清楚。** 如果某个地址确实只有你本机能访问（例如只在本机映射的端口），面板会退到**直接加载（只读）**：页面照常显示，并明确告诉你此时无法标注，而不是留下一个空白框让你猜。

## 怎么用

1. 右侧栏 →「浏览器」→ 输入网址；
2. 工具栏点「标注」（按 Esc 退出）：点元素，或按住鼠标拖出一块区域；
3. 写备注 →「加入列表」；加完自动回到点选状态，不用再点一次；
4. 「发送到会话」把你选的先后顺序，整批发成一条消息。

已收集的列表按会话存在 `localStorage`，刷新页面不会丢，只有「清空」或发送成功才会消失。

## 安装

```sh
dsh plugin --profile web add https://github.com/KirinKylin-1/dsh-annotated-browser/releases/download/v1.2.2/dsh-annotated-browser-1.2.2.tgz
```

然后重启一次 `dsh web`（宿主半要加载），并刷新 GUI。

**推荐就用这一条。** 它从 GitHub Releases 下载一个 273 KB 的预构建包——不用编译、不拉 git 历史、不需要 npm 账号。已在全新的 profile 里、不配置任何代理的情况下实测：**9.4 秒装完**。

另外两种方式，按需选：

```sh
# 直接从 git 装（下载更大，从源码跑）
dsh plugin --profile web add github:KirinKylin-1/dsh-annotated-browser

# 从 npm 注册表装（发布后可用）
dsh plugin --profile web add dsh-annotated-browser
```

**前提**：宿主机上要有 Chromium 系浏览器——Chrome、Chromium、Edge 都行。会自动探测（Windows / macOS / Linux 的常见路径，或 `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH`）。探测不到就手动指定：

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: dsh-annotated-browser
  config:
    browserExecutable: /usr/bin/google-chrome
```

## 配置项

| 字段 | 默认 | 说明 |
|---|---|---|
| `browserExecutable` | 自动探测 | Chrome/Chromium 绝对路径 |
| `proxyServer` | 空 | 渲染页面走的 HTTP 代理，例如 `http://127.0.0.1:7890` |
| `timeoutMs` | `30000` | 页面加载超时（毫秒） |
| `allowRemote` | `false` | 允许非 loopback 请求使用代理路由（只有直接对局域网暴露 DSH 时才需要打开） |
| `takeover` | `true` | 由本插件提供 `browser` 标签类型，页面直接进可标注视图；设 `false` 则保留出厂浏览器，改用标签栏里的交接按钮 |

## 语言

面板跟随 GUI 语言（**设置 → 常规**），切换即时生效，不用刷新。内置中文和英文；所有文案都在 `i18n.js` 里，加一门语言就是加一份字典。

## 边界

- 页面由无头 Chromium 渲染后转发；登录态和复杂交互与真实浏览器有差异。
- 代理页从 DSH 自己的源输出，请把它当作「可信度接近 GUI 自身」的内容：只浏览你愿意在 GUI 里打开的站点。
- 不会复用你自己浏览器的 cookie。

## 许可

MIT
