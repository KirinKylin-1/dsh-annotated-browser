# 发布清单 / Publishing checklist

## 0. 你的账号需要的东西

| 需要 | 怎么给 |
|---|---|
| npm 账号（有发布权限） | 在本机执行 `npm login`，或在 npmjs.com 建一个 **Automation** token 后 `npm config set //registry.npmjs.org/:_authToken=<token>` |
| GitHub 仓库地址 | 建一个空仓库 `dsh-annotated-browser`，把 URL 告诉我（替换 `package.json` 里的 `your-name`） |

## 1. 发布到 npm

```sh
cd /root/dsh-annotated-browser
npm login                      # 或先配好 NPM_TOKEN
npm publish --access public    # 包名 dsh-annotated-browser 目前未被占用
```

发布后验证：

```sh
npm view dsh-annotated-browser version
```

## 2. 推到 GitHub

```sh
cd /root/dsh-annotated-browser
git init
git add -A
git commit -m "dsh-annotated-browser v1.0.0"
git branch -M main
git remote add origin https://github.com/<owner>/dsh-annotated-browser.git
git push -u origin main
```

仓库要求（目录收录会检查）：
- 仓库创建满 **1 天**；
- 加上 **`dsh-plugin`** topic；
- `package.json` 里保留 `dsh.bundle`（已有）。

## 3. 提交到插件目录（awesome-dsh-plugin）

复制 `publish/catalog-entry.yml` 到该仓库：
`data/plugins/<owner>__dsh-annotated-browser.yml`
（先把 `your-name` 换成你的 GitHub 用户名），然后按 `publish/PR.md` 开 PR。

## 4. 发布后

- 用户安装：`dsh plugin --profile web add dsh-annotated-browser`，重启一次 `dsh web`，本机需有 Chrome/Chromium；
- 后续发版：改 `version` → `npm publish` → 打 tag。

## 本机已有的发布产物

- `assets/icon-180.png`（目录卡片图标，放 GitHub 仓库里）
- `publish/catalog-entry.yml`（收录条目）
- `publish/PR.md`（PR 标题与正文）
