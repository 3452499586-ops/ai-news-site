# AI 信号档案

一个一次性交付、纯静态、手动更新的中文 AI 资讯网站。页面只使用本地 HTML、CSS 和 JavaScript；加载与交互过程中不调用 API、不抓取网页、不发送搜索词，也不使用 Cookie、统计脚本、远程字体、云函数或后台任务。

## 打开网站（double-click）

1. 保持整个项目目录结构不变。
2. 双击 `index.html`，用现代浏览器打开。
3. 页面应显示 8 条本地资讯；搜索、筛选、排序、详情展开和手动轮播均可离线使用（offline）。
4. 只有用户主动点击“打开原文”时，浏览器才会访问外部网站。

无需安装 Node.js、Python、数据库或浏览器扩展。测试命令仅供维护者验收，不是网站运行条件。

## 文件说明

- `index.html`：语义化页面骨架与无障碍标签。
- `styles.css`：克拉因蓝设计、响应式、打印和减少动态效果规则。
- `app.js`：纯本地搜索、筛选、排序、展开、轮播和 URL 状态。
- `news-data.js`：全部资讯与站点元数据；这是日常唯一需要修改的数据文件。
- `docs/`：信源、核验与手动更新规则。
- `tests/`：本地数据测试、交互测试、静态审计和手动浏览器检查页。

## 替换数据

先按[手动更新指南](docs/update-guide.md)备份（backup），再编辑 `news-data.js` 中的 `AI_NEWS_META` 和 `AI_NEWS_DATA`。每次保留 5—8 条正式精选，三类时间必须带时区；不得把 `pending` 条目放入正式精选。

不要把数据改成远程 JSON，也不要在 `app.js` 中加入 `fetch()`。这样才能继续支持双击打开和零后台请求。

## 增加公司（add-company）

无需改页面结构。新增或修改一条资讯的 `company` 字段后，公司筛选项会在本地自动生成。若要把该机构列入顶部覆盖范围，同时把名称加入 `AI_NEWS_META.coveredOrganizations`。公司名称应使用同一标准写法，避免出现重复选项。

## 来源与核验

编辑前先阅读[信源规范](docs/source-policy.md)和[核验规范](docs/verification-policy.md)。每条资讯至少需要一个可访问的一级来源；融资、并购、人事、监管、安全事故和争议事件应再加入一个相互独立的权威来源。

## 备份与回滚

每次编辑前复制整个项目目录，建议命名为 `ai-news-site-backup-YYYY-MM-DD`。如果更新后页面空白或测试失败，用备份中的 `news-data.js` 覆盖当前文件即可回滚。不要使用会自动同步或收费的服务作为运行依赖。

## 断网与零请求检查

1. 断开网络后重新打开 `index.html`，确认正文和所有本地交互仍可用。
2. 联网状态下按 `F12` 打开开发者工具，进入 **Network** 面板并清空记录。
3. 勾选 Disable cache，刷新页面。页面自身加载项只能来自本地文件；不应出现 `http://`、`https://`、WebSocket、统计或 API 请求。
4. 在 Application 面板确认没有 Service Worker；在 Network 面板确认搜索、筛选、排序和展开时没有新增请求。
5. 外部来源链接只在用户主动点击后打开新标签页，这是允许的网络行为。

维护者还可以运行：

```powershell
node --test tests/app.test.js tests/news-data.test.js
powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1
```

静态审计会检查远程资源、网络 API、分析脚本、Service Worker、无限动画和必需文档。它不能替代最终的人工浏览器 Network 检查。

## 隐私与费用承诺

本项目不保存密钥，不创建定时任务，不连接数据库，不部署云函数，不注册 Service Worker，不收集用户信息，也没有自动更新机制。交付后仅占用本地磁盘空间和浏览器正常运行所需的少量设备资源，不产生持续服务费用。
