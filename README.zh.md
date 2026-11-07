# dsh-annotated-browser

**在真实网页上标注，把备注直接发进对话。** 点一个元素，或者当你要说的东西横跨好几个节点时拖出一块区域；写下要改什么；发送。模型收到的是选择器、可见文本和位置——不是一张需要靠猜的截图。

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.1%2B-4d6bfe)](https://www.npmjs.com/package/@deepseek-ai/dsh)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)

[English](README.md) · **中文**

</div>

---

## 它和别的有什么不一样

多数「侧栏浏览器」插件把远端页面往 iframe 里一框就结束了。这带来两个没人想要的后果：发 `X-Frame-Options` 或 CSP `frame-ancestors` 的站点**直接白屏**；而 iframe 始终是**跨域**的，GUI 永远读不到里面的 DOM——标注也就无从谈起。

本插件在宿主上用无头 Chromium 渲染页面，再把执行后的 HTML 从 DSH 自己的源返回。iframe 因此同源，于是：

| | 出厂侧栏浏览器 | 本插件 |
|---|---|---|
| 发 `X-Frame-Options` / CSP 的站点 | 白屏 | **能打开** |
| GUI 读取页面 DOM | 不可能（跨域） | **可以（同源）** |
| 点元素拿到选择器 | — | **可以** |
| 框选区域，列出框内所有元素 | — | **可以** |
| 备注进入对话 | — | **一条消息，按点选顺序** |

另外三点是有意为之，不是顺带：

- **内置浏览器照常可用。** 设 `takeover: false` 时本插件完全不替换 `browser` 标签类型：快捷键、「在系统浏览器中打开」、历史记录，以及其他插件打开 `browser` 标签的行为，全都和原来一模一样；本插件只是**额外**加一个独立的标注标签和一个标签栏里的交接按钮。
- **点选不中断。** 加一条备注不会把你踢出标注模式——你可以一直点，直到按 Esc。备注攒成一个列表，最后作为**一条**消息发出，所以整页走查只花一个回合，而不是十几个。
- **同源页面跳过代理。** 本来就由这台 DSH 提供的页面（比如别的插件挂的页面）直接以同源 iframe 打开——登录态保留，不用绕一圈 Chromium。如果代理确实访问不到某个地址（比如只在你本机映射的端口），面板会退到**直接加载（只读）**：能看，并且老实标明不能标注，而不是卡死在一个空白 iframe 上。

## 怎么用

1. 右侧栏 →「浏览器」→ 输入网址；
2. 工具栏点「标注」（按 Esc 退出）：点元素，或按住鼠标拖出一块区域；
3. 写备注 →「加入列表」；加完自动回到点选状态，不用再点一次；
4. 「发送到会话」把你选的先后顺序，整批发成一条消息。

已收集的列表按会话存在 `localStorage`，刷新页面不会丢，只有「清空」或发送成功才会消失。

## 安装

从注册表（发布后）：

```sh
dsh plugin --profile web add dsh-annotated-browser
```

从本仓库安装——不需要 npm 账号：

```sh
# 直接从 git 装
dsh plugin --profile web add github:KirinKylin-1/dsh-annotated-browser

# 或从 Release 附件装
dsh plugin --profile web add https://github.com/KirinKylin-1/dsh-annotated-browser/releases/download/v1.0.0/dsh-annotated-browser-1.0.0.tgz
```

然后重启一次 `dsh web`（宿主半要加载），并刷新 GUI。

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
