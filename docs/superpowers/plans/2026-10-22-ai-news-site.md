# AI 权威资讯聚合网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个内置 5—8 条真实已核验 AI 资讯、可直接双击打开、离线完成全部核心交互且零持续消耗的中文静态网站。

**Architecture:** 使用无构建步骤的 `index.html + styles.css + news-data.js + app.js` 架构；数据通过浏览器全局变量注入，纯逻辑函数同时暴露给 Node 内置测试运行器，界面只操作本地 DOM。开发阶段执行一次性人工资讯核验、静态审计和浏览器检查，交付代码不包含联网、抓取、后台或部署逻辑。

**Tech Stack:** 原生 HTML5、CSS3、ES2020 JavaScript、Node.js 内置 `node:test`（仅开发测试）、PowerShell（仅手动静态审计）、浏览器开发者工具。

**Spec:** `docs/superpowers/specs/2026-10-22-ai-news-site-design.md`

## Global Constraints

- 项目运行时只能读取本地 HTML、CSS、JavaScript、图片、字体和 SVG；除主动点击来源链接外不得发起网络请求。
- 不使用后端、数据库、CMS、框架、包管理器、远程字体、CDN、iframe、Cookie、Service Worker、WebSocket、分析代码或自动部署。
- `index.html` 必须能通过 `file://` 直接打开，核心功能不依赖本地服务器。
- 首批正式精选必须包含 5—8 条真实资讯；每条都有一级来源，复杂或争议事实采用官方来源加独立权威来源。
- `pending` 状态不得进入正式精选；厂商自报且缺少独立验证的主张标为 `official`。
- 外部链接必须由用户主动触发，并包含 `target="_blank"` 与 `rel="noopener noreferrer"`。
- 只要任一可读取 Codex 使用额度窗口剩余量达到或低于 15%，立即停止、保存现状并报告；不得购买、兑换或自动补充额度。
- 额度检查只在实施主要阶段前人工执行，不得写入网站、测试自动任务或后台监控。

## Review Focus

- 数据中出现缺少 `id`、标题、三类时间或一级来源的条目时，该条目不得作为正式资讯渲染，测试归 Task 2。
- 中文、英文、大小写和前后空格混合搜索时，应获得一致结果，测试归 Task 2。
- 多个筛选条件组合后无结果时，应显示条件摘要和清除按钮，测试归 Task 5。
- URL 中包含未知或非法筛选值时，应忽略非法值并保留有效值，测试归 Task 2。
- 启用减少动态效果、窄屏和打印模式时，内容仍应完整可读且无持续动画，测试归 Task 4 与 Task 7。

---

### Task 1: 首批资讯核验与本地数据集

**Files:**
- Create: `news-data.js`
- Create: `docs/research-log.md`
- Create: `tests/news-data.test.js`

**Interfaces:**
- Consumes: 官方发布页、官方文档、官方代码仓库、政府或标准机构资料，以及必要的独立权威媒体来源。
- Produces: `window.AI_NEWS_META: NewsMeta`、`window.AI_NEWS_DATA: NewsItem[]`；Node 环境导出 `{ AI_NEWS_META, AI_NEWS_DATA }`。

- [ ] **Step 1: 检查 Codex 剩余额度**

使用账户额度读取工具。若任一窗口剩余量 `<= 15%`，停止执行并报告；否则在 `docs/research-log.md` 记录检查时间和剩余百分比。

- [ ] **Step 2: 写出数据契约失败测试**

在 `tests/news-data.test.js` 使用 `node:test` 断言：条目总数在 5—8；`id` 唯一；正式精选无 `pending`；每条具有三类 ISO 8601 时间、完整内容字段和至少一个 `primary` 来源；复杂事件具有 `secondary` 来源；URL 使用 `https:`；元数据日期和手动更新时间存在。

- [ ] **Step 3: 运行测试并确认因数据文件缺失而失败**

Run: `node --test tests/news-data.test.js`

Expected: FAIL，错误指向找不到 `news-data.js`。

- [ ] **Step 4: 一次性检索候选资讯并建立证据日志**

在 `docs/research-log.md` 为每个候选事件记录：候选标题、事件时间、发布时间、核验时间、一级来源、第二来源、来源类别、核验判断、排除理由或入选理由。优先官方来源；融资、人事、监管、安全和争议事件必须补充独立来源。

- [ ] **Step 5: 对候选资讯评分并精选 5—8 条**

按 `30% 信源权威度 + 25% 行业影响 + 20% 时效性 + 15% 多源一致性 + 10% 信息新颖度` 评分，并检查至少一条中国动态、一条国际动态及一条模型、研究或开源动态；同一公司最多两条。

- [ ] **Step 6: 实现 `news-data.js`**

定义 `NewsMeta` 与 `NewsItem` 数据对象；每条资讯填写 `id`、标题、摘要、机构、地区、分类、三类时间、背景、核心内容、重要性、两类受众影响、核验状态、不确定项、开源状态、API 状态、研究属性、标签、来源、纠错记录、重点标记和评分。浏览器写入 `window`，Node 环境通过 `module.exports` 导出相同对象。

- [ ] **Step 7: 运行数据测试并确认通过**

Run: `node --test tests/news-data.test.js`

Expected: PASS，所有入选条目满足数据契约。

- [ ] **Step 8: 提交数据集和证据日志**

```powershell
git add news-data.js docs/research-log.md tests/news-data.test.js
git commit -m "content: add verified AI news dataset"
```

### Task 2: 本地搜索、筛选、排序和状态逻辑

**Files:**
- Create: `app.js`
- Create: `tests/app.test.js`

**Interfaces:**
- Consumes: `NewsItem[]`、`URLSearchParams` 风格键值和筛选状态对象 `FilterState`。
- Produces: `normalizeText(value): string`、`validateItem(item): ValidationResult`、`filterItems(items, state): NewsItem[]`、`sortItems(items, mode): NewsItem[]`、`summarizeItems(items): Summary`、`parseQueryState(search, options): FilterState`、`buildQueryState(state): string`，并挂载到 `window.AINewsApp` 与 `module.exports`。

- [ ] **Step 1: 写出纯逻辑失败测试**

在 `tests/app.test.js` 分别断言：中英文大小写和空格归一化；标题、公司、摘要、标签、来源均可搜索；公司、地区、类型、核验、开源、API 和研究条件可组合；无效条目被校验拒绝；三种排序稳定；统计结果正确；非法 URL 参数被忽略且合法参数保留。

- [ ] **Step 2: 运行测试并确认因函数不存在而失败**

Run: `node --test tests/app.test.js`

Expected: FAIL，错误指向找不到 `app.js` 或导出函数。

- [ ] **Step 3: 实现纯逻辑函数和双环境导出**

在 `app.js` 实现 Interfaces 中的七个函数。不得访问网络；不得修改传入数组；字符串比较使用统一的 `normalizeText`；时间排序使用 `eventTime`，评分排序在同分时以事件时间倒序处理。

- [ ] **Step 4: 运行逻辑测试并确认通过**

Run: `node --test tests/app.test.js`

Expected: PASS，无警告或未处理异常。

- [ ] **Step 5: 提交纯逻辑层**

```powershell
git add app.js tests/app.test.js
git commit -m "feat: add local news query logic"
```

### Task 3: 语义化页面骨架与零请求边界

**Files:**
- Create: `index.html`
- Create: `tests/static-audit.ps1`
- Create: `assets/icons/.gitkeep`
- Create: `assets/images/.gitkeep`
- Create: `assets/fonts/.gitkeep`

**Interfaces:**
- Consumes: `news-data.js` 先于 `app.js` 的本地脚本加载顺序。
- Produces: 供 Task 5 使用的稳定 DOM 容器：`#signal-bar`、`#featured-stage`、`#verification-overview`、`#filter-form`、`#timeline`、`#empty-state`、`#source-radar`、`#live-region`。

- [ ] **Step 1: 写出静态结构失败审计**

在 `tests/static-audit.ps1` 断言 `index.html` 存在所需语义元素、跳至主内容链接、表单标签、上述 DOM 容器、本地样式和脚本路径；拒绝 `http(s)` 资源属性、远程字体、iframe、预连接、预取、Service Worker、WebSocket、`fetch`、XHR、分析脚本和疑似密钥。

- [ ] **Step 2: 运行审计并确认因页面缺失而失败**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: FAIL，错误指向缺少 `index.html`。

- [ ] **Step 3: 创建语义化 `index.html` 和本地资源目录**

页面包含固定导航、今日信号栏、8:4 首屏、搜索和筛选控件、时间线、深度背景、来源雷达、核验方法、更新说明与页脚；加入 `noscript` 提示、`aria-live` 结果区域和手动轮播控制。外部链接由 Task 5 渲染，静态页面本身不包含远程资源。

- [ ] **Step 4: 运行静态审计并确认结构通过**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: PASS，未发现外部资源或禁止能力。

- [ ] **Step 5: 提交页面骨架**

```powershell
git add index.html tests/static-audit.ps1 assets
git commit -m "feat: add offline semantic page shell"
```

### Task 4: 克拉因蓝编辑式视觉系统

**Files:**
- Create: `styles.css`
- Modify: `tests/static-audit.ps1`

**Interfaces:**
- Consumes: Task 3 的语义结构和稳定容器。
- Produces: 颜色令牌、8:4 首屏、纵向信号时间线、响应式布局、打印样式、清晰焦点态和减少动态效果规则。

- [ ] **Step 1: 扩展静态审计使样式要求先失败**

断言 `styles.css` 包含 `#002FA7`、`#06143D`、`#F5F7FC`、`#29C98A`、`#FFB84D`、`#FF5B6E`，包含 `@media (prefers-reduced-motion: reduce)`、窄屏断点、打印样式和 `:focus-visible`，且不存在 `url(http`、`@import` 或持续无限动画。

- [ ] **Step 2: 运行审计并确认因样式文件缺失而失败**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: FAIL，错误指向缺少 `styles.css`。

- [ ] **Step 3: 实现编辑式视觉系统**

使用系统字体栈；将大胆视觉集中于首屏克拉因蓝信号场和时间轴；正文使用纸白背景、分隔线和留白，不制作同尺寸圆角卡片墙。桌面首屏为 8:4 网格，移动端为单栏；打印时隐藏交互控件并展开可读内容。

- [ ] **Step 4: 运行审计并确认样式要求通过**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: PASS，颜色、断点、焦点、打印和减少动态效果规则全部存在。

- [ ] **Step 5: 提交视觉系统**

```powershell
git add styles.css tests/static-audit.ps1
git commit -m "feat: add Klein blue editorial design system"
```

### Task 5: 页面渲染与本地交互

**Files:**
- Modify: `app.js`
- Create: `tests/browser-smoke.html`
- Modify: `tests/app.test.js`

**Interfaces:**
- Consumes: Task 1 的本地数据、Task 2 的纯逻辑函数、Task 3 的 DOM 容器。
- Produces: `initNewsSite(document, location, history): void`、`renderNewsList(items, root): void`、`renderFeatured(items, index, root): void`、`renderSummary(summary, roots): void`；详情、筛选、清除、排序、标签导航、URL 本地状态和手动轮播交互。

- [ ] **Step 1: 检查 Codex 剩余额度**

在进入编码主阶段前读取账户额度；任一窗口剩余量 `<= 15%` 时立即停止并报告。

- [ ] **Step 2: 写出 DOM 渲染和空状态失败测试页面**

`tests/browser-smoke.html` 本地加载 `news-data.js` 与 `app.js`，创建最小 DOM fixture，断言初始化后条目数与数据一致、缺失关键字段的条目不渲染、外部链接具有 `target` 和 `rel`、展开按钮维护 `aria-expanded`、组合筛选无结果时显示条件摘要和清除按钮、清除后恢复内容。

- [ ] **Step 3: 用浏览器打开测试页并确认失败**

Open: `tests/browser-smoke.html` via `file://`

Expected: 页面测试报告显示 FAIL，原因是渲染函数或交互尚未实现。

- [ ] **Step 4: 实现 DOM 渲染函数**

实现 Interfaces 中四个函数；全部用户可见文本使用 `textContent` 或安全节点构造，来源链接显式设置 `target="_blank"` 和 `rel="noopener noreferrer"`，无效资讯仅输出本地控制台诊断。

- [ ] **Step 5: 实现筛选、排序、搜索和清除交互**

表单变化调用 Task 2 纯逻辑函数并更新列表、结果计数、空状态和 URL 本地状态；搜索输入使用轻量本地防抖，不记录关键词、不发送请求。

- [ ] **Step 6: 实现详情、标签导航和手动轮播**

详情按钮维护焦点和 `aria-expanded`；标签点击转化为本地筛选；重点资讯最多三条，只响应按钮、键盘或触屏手势，不自动切换或发声。

- [ ] **Step 7: 运行 Node 逻辑测试**

Run: `node --test tests/app.test.js tests/news-data.test.js`

Expected: PASS，原有纯逻辑和数据契约无回归。

- [ ] **Step 8: 重新打开浏览器测试页并确认通过**

Open: `tests/browser-smoke.html` via `file://`

Expected: 页面显示全部断言 PASS，控制台无错误。

- [ ] **Step 9: 提交完整交互层**

```powershell
git add app.js tests/app.test.js tests/browser-smoke.html
git commit -m "feat: add offline news browsing interactions"
```

### Task 6: 使用说明、信源规范与手动更新文档

**Files:**
- Create: `README.md`
- Create: `docs/source-policy.md`
- Create: `docs/verification-policy.md`
- Create: `docs/update-guide.md`
- Modify: `tests/static-audit.ps1`

**Interfaces:**
- Consumes: 已实现的数据字段、交互行为、审计命令和目录结构。
- Produces: 无需编程的打开、更新、备份、核验和零请求检查说明。

- [ ] **Step 1: 扩展文档审计使缺失内容先失败**

断言四份交付文档存在；`README.md` 包含双击打开、替换数据、增加公司、备份、断网使用和 Network 检查；三个政策文档分别包含来源分级、核验等级与双源规则、逐步手动更新和回滚方法。

- [ ] **Step 2: 运行审计并确认因文档缺失而失败**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: FAIL，列出缺失文档或章节。

- [ ] **Step 3: 编写四份交付文档**

使用非技术读者可执行的中文步骤，明确禁止自动更新、付费服务和后台任务；说明修改 `news-data.js` 前备份旧版本、如何核对三类时间、如何判断官方声明、如何确认 Network 面板无自动外部请求。

- [ ] **Step 4: 运行文档和静态审计**

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: PASS，文档完整且无禁止能力。

- [ ] **Step 5: 提交交付文档**

```powershell
git add README.md docs/source-policy.md docs/verification-policy.md docs/update-guide.md tests/static-audit.ps1
git commit -m "docs: add offline update and verification guides"
```

### Task 7: 最终离线、视觉与零消耗验收

**Files:**
- Modify: `index.html`（仅修复验收中发现的问题）
- Modify: `styles.css`（仅修复验收中发现的问题）
- Modify: `app.js`（仅按失败测试修复问题）
- Modify: `tests/*`（先补充失败回归测试再修复）
- Create: `docs/acceptance-report.md`

**Interfaces:**
- Consumes: 完整网站和全部测试。
- Produces: 可追溯的测试结果、浏览器检查记录、Network 零外部请求结论和剩余限制说明。

- [ ] **Step 1: 检查 Codex 剩余额度**

在进入浏览器验收阶段前读取账户额度；任一窗口剩余量 `<= 15%` 时立即停止、保存现状并报告未完成验收项。

- [ ] **Step 2: 运行完整自动测试和静态审计**

Run: `node --test tests/app.test.js tests/news-data.test.js`

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: 两个命令均以退出码 0 完成，0 个失败。

- [ ] **Step 3: 通过 `file://` 验证用户主流程**

双击或在浏览器打开 `index.html`，依次验证搜索、所有筛选维度、三种排序、详情展开、来源展开、标签切换、手动轮播、URL 状态和清除条件；检查浏览器控制台无错误。

- [ ] **Step 4: 检查桌面、平板和移动布局**

检查约 1440px、768px 和 390px 宽度；确认固定导航不遮挡内容、正文可读、时间线顺序正确、控件无横向溢出。检查系统减少动态效果和打印预览；内容必须完整可读且无持续动画。

- [ ] **Step 5: 检查键盘与基本可访问性**

仅用键盘完成跳至正文、导航、搜索、筛选、详情展开、轮播和来源链接操作；确认焦点可见、标题层级正确、状态不只依赖颜色、表单标签可见、动态结果由 `aria-live` 宣告。

- [ ] **Step 6: 检查 Network 与后台能力**

清空 Network 面板后重新加载本地页面并执行全部本地交互；确认 0 个外部请求、0 个 WebSocket、0 个后台轮询、无 Service Worker 注册。来源链接只在主动点击后访问外部网络。

- [ ] **Step 7: 对发现的问题执行测试优先修复**

每个缺陷先在所属测试文件中添加能复现问题的失败测试，确认失败后再修改产品文件，随后重跑完整测试和静态审计。

- [ ] **Step 8: 编写验收报告**

在 `docs/acceptance-report.md` 记录测试命令与结果、浏览器与视口、离线结果、Network 观察、可访问性检查、减少动态效果、打印检查、已知限制和本次额度检查结果。

- [ ] **Step 9: 检查工作区并提交最终验收**

```powershell
git diff --check
git status --short
git add index.html styles.css app.js tests docs/acceptance-report.md
git commit -m "test: complete offline acceptance verification"
```

- [ ] **Step 10: 最终重新运行验证**

Run: `node --test tests/app.test.js tests/news-data.test.js`

Run: `powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1`

Expected: 全部通过，且 `git status --short` 无未提交产品变更。
