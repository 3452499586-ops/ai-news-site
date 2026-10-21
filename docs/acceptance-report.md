# 最终验收报告

验收日期：2026-10-22（Asia/Shanghai）  
验收对象：AI 信号档案，本地静态交付版  
数据版本：2026.10.22

## 结论

代码、数据结构、文档和静态零请求审计均通过。网站不依赖 Node.js、服务器、数据库、API、CDN、远程字体、分析服务、Service Worker、WebSocket 或定时任务；运行入口为本地 `index.html`。

当前受控浏览器环境明确阻止 `file://` 导航，并禁止用其他自动化通道绕过。因此，本报告没有把自动浏览器无法执行的 Network、视口和键盘实测写成“通过”。相关项目已保留为本机人工复核清单，`tests/browser-smoke.html` 也可由用户双击运行。

## 自动测试结果

执行：

```powershell
node --check app.js
node --check news-data.js
node --test tests/app.test.js tests/news-data.test.js
powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1
git diff --check
```

结果：

- `app.js` 与 `news-data.js` 语法检查通过。
- Node 测试共 15 项：15 通过，0 失败，0 跳过。
- 数据测试确认：正式精选为 8 条、ID 唯一、无 `pending`、三类时间含时区、每条具备一级来源，需独立核验的复杂事件具备二级来源。
- 逻辑与 DOM 测试确认：全文搜索、组合筛选、三种排序、URL 状态、统计、无效条目跳过、安全外链属性和详情按钮的 `aria-expanded` 状态。
- 静态审计通过：页面结构、本地资源引用、响应式规则、打印样式、减少动态效果、键盘焦点、交付文档均存在；未发现 `fetch`、`XMLHttpRequest`、`WebSocket`、Service Worker、分析脚本、远程资源、嵌入密钥或无限动画。
- `git diff --check` 未发现空白错误。

## 静态功能与可访问性检查

- `index.html` 使用 `header`、`nav`、`main`、`section`、`article`、`aside`、`footer`、`form`、`label` 和 `noscript`。
- 具备跳至正文链接、可见 `:focus-visible`、表单标签、`aria-live` 结果播报和详情展开状态。
- 来源链接由脚本创建，并统一设置 `target="_blank"` 与 `rel="noopener noreferrer"`。
- 搜索与筛选数据只来自内存中的 `window.AI_NEWS_DATA`，未实现网络读取。
- CSS 包含桌面、平板和窄屏断点、打印样式及 `prefers-reduced-motion: reduce`；未使用持续动画或远程素材。
- 正文主要位于浅色阅读区，高饱和克拉因蓝用于导航、重点区和状态层级。

## 零消耗检查

源代码扫描结果：

- 远程 URL 只存在于 `news-data.js` 的资讯来源字段中，不存在于页面资源的 `src`、`href`、CSS `url()` 或预连接配置中。
- 页面加载不会自动打开来源 URL；只有用户点击来源链接才访问网络。
- 未发现后台轮询、自动刷新、后台同步、推送、Cookie、指纹、位置、摄像头、麦克风、剪贴板、上传、第三方 iframe 或评论组件。
- 项目没有构建流程、部署配置、GitHub Actions、云函数、数据库配置或付费服务依赖。

## 受环境限制、尚需本机人工复核

以下项目未在受控浏览器中执行，原因是该环境禁止打开本地 `file://` 页面：

1. 双击 `index.html` 后逐项操作搜索、所有筛选、三种排序、清除条件、详情、来源展开、标签切换和手动轮播。
2. 在约 1440px、768px、390px 视口检查固定导航、正文可读性和横向溢出。
3. 仅用键盘检查跳至正文、导航、表单、详情、轮播和来源链接。
4. 开启系统“减少动态效果”并检查打印预览。
5. 在浏览器 Network 面板清空记录后刷新并执行交互，确认没有外部请求、WebSocket、轮询和 Service Worker。

建议先双击 `tests/browser-smoke.html`。该页面会在浏览器内验证数据装载、查询逻辑、组合筛选、排序、URL 状态、DOM 渲染、安全外链、详情展开和初始化流程；全部显示 PASS 后，再按 [README](../README.md) 的 Network 步骤完成最后人工复核。

## Codex 额度保护

最终验收阶段开始前读取到账户主窗口已用 66%，剩余 34%，高于用户规定的 15% 停止阈值。项目没有创建任何额度监控或后台自动任务；阈值只在本次交互执行期间主动检查。

## 已知限制

- 资讯不会自动更新；这是零后台消耗设计的一部分。
- 外部来源将来可能改版、删除或改变访问限制，需要每次手动更新时重新检查。
- 自动测试能验证结构和逻辑，但不能替代用户设备上对字体渲染、浏览器差异、真实 Network 面板和辅助技术的人工检查。
