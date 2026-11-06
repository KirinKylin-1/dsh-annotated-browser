# dsh-annotated-browser

给 DSH（DeepSeek Harness）右侧栏浏览器加标注：在页面上点选元素或框选一块区域，写下要改什么，整批发进当前对话——带选择器、可见文本和位置。

安装后，**出厂内置浏览器的标签右键菜单里会多一行「在此页面标注」**：把当前页面在插件的标注视图里打开（页面经代理渲染，才能被读取和点选）。这一行走的是官方扩展位 `sidebar.right.tab.menu.item`，不覆盖页面、不替换任何东西，侧栏更新也不会把它弄丢。

本插件另外新增**自己的**标签类型「标注浏览器」，**不动出厂的 `browser` 标签**：快捷键、「在系统浏览器中打开」、历史记录，以及其他插件打开 `browser` 标签的行为都和原来一样。插件不注册服务、不替换任何 provider，所以既不依赖别的插件，也不会改变浏览器自身功能。

## 为什么要代理

出厂浏览器直接 `<iframe src="目标站">`，带来两个后果：

- 发 `X-Frame-Options` / CSP 的站点直接白屏；
- 跨域 iframe，GUI 读不到里面的 DOM——标注根本无从谈起。

本插件的宿主半用无头 Chromium 渲染页面，再把执行后的 HTML 从 DSH 自己的源返回。iframe 因此同源（能读 DOM），也不受目标站的嵌入限制。

本来就由同一台 DSH 服务器提供的页面（例如别的插件挂载的页面）不走代理，直接以同源 iframe 打开——同源本来就够用，登录态也保留。若代理访问不到某个地址（比如只映射在宿主机的端口），面板会给出「直接加载（只读）」：直接加载原地址，能看但不能标注。

插件提供 `browser` 标签类型，所以「浏览器」入口打开的就是可标注视图：新标签是空白浏览器，每个标签只恢复自己的页面，`target=_blank` 链接会新开一个浏览器标签。

## 安装

```sh
dsh plugin --profile web add dsh-annotated-browser
# 或从本地目录
dsh plugin --profile web add file:/path/to/dsh-annotated-browser
```

重启一次 `dsh web`（宿主半要加载），然后刷新 GUI。

**前提**：宿主机器上要有 Chromium 系浏览器。会自动探测（`google-chrome`、`chromium`、`msedge`、macOS/Windows 常见路径，或 `CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH`）。探测不到就手动指定：

```yaml
# profile 的 patch 文件（如 ~/.dsh/profiles/web/cordis.patch.yml）
- id: dsh-annotated-browser
  config:
    browserExecutable: /usr/bin/google-chrome
```

## 使用

1. 右侧栏 →「浏览器」→ 输入网址；
2. 工具栏点「标注」（`Esc` 退出）：点元素，或按住鼠标拖出一块区域；
3. 写备注 →「加入列表」；加完自动回到拾取状态，只有退出标注才会停；
4. 「发送到会话」按你选择的先后顺序，把整批发成一条消息。

已收集的列表按会话存在 `localStorage`，只有「清空」或发送成功才会消失。

## 配置项

| 字段 | 默认 | 说明 |
|---|---|---|
| `browserExecutable` | 自动探测 | Chrome/Chromium 绝对路径 |
| `proxyServer` | 空 | 渲染页面走的 HTTP 代理，如 `http://127.0.0.1:7890` |
| `timeoutMs` | `30000` | 页面加载超时（毫秒） |
| `allowRemote` | `false` | 允许非 loopback 请求使用代理路由（只有直接对局域网暴露 DSH 时才需要打开） |
| `takeover` | `true` | 由本插件提供 `browser` 类型，页面直接进可标注视图；设为 `false` 则保留出厂浏览器，改用标签栏里的「标注」按钮交接 |

## 边界

- 页面由无头 Chromium 渲染后转发；登录态和复杂交互与真实浏览器有差异。
- 代理页从 DSH 自己的源输出，请只浏览你愿意在 GUI 里打开的站点。
- 不会复用你浏览器的登录态。

## 许可

MIT
