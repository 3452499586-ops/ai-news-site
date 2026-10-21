# 手动更新指南

本指南面向不需要编程经验的维护者。网站不自动联网、不自动核验、不自动发布；每次更新均由人手完成。

<a id="manual-update"></a>
## 手动更新（manual-update）

1. **备份。** 关闭页面，把整个项目目录复制一份，命名为 `ai-news-site-backup-YYYY-MM-DD`。
2. **收集候选。** 从信源规范列出的官方入口开始，记录原文链接、原始标题和发布时间。
3. **查第二来源。** 对融资、并购、人事、监管、安全事故和争议事件寻找一个独立权威来源。
4. **核对事实。** 逐项检查名称、版本、发布状态、三类时间、数字、开源许可、API 与地区限制。
5. **精选 5—8 条。** 同一机构最多两条，并兼顾中国、国际、模型或研究，以及产品、商业、政策和安全。
6. **编辑数据。** 用纯文本编辑器打开 `news-data.js`；复制一整个现有对象作为模板，在数组中替换字段。保留逗号、引号和括号结构。
7. **更新站点元数据。** 修改 `AI_NEWS_META.dataDate`、`lastManualUpdate`、`version` 和 `coveredOrganizations`。
8. **本地检查。** 双击 `index.html`，检查条数、搜索、全部筛选、排序、展开、轮播和外部链接。
9. **断网检查。** 断网刷新页面，确认核心内容与交互完整；再按 README 的 Network 步骤确认零自动请求。
10. **保存交付。** 直接复制项目文件即可，不要接入自动部署、定时任务、数据库或云同步运行依赖。

## 单条数据必填项

每条对象应保留：`id`、`title`、`summary`、`company`、`region`、`category`、`eventTime`、`publishedTime`、`verifiedTime`、`background`、`content`、`importance`、`userImpact`、`developerImpact`、`verificationStatus`、`verificationNote`、`uncertainty`、`openSourceStatus`、`apiStatus`、`isResearch`、`tags`、`sources`、`corrections`、`featured`、`score`。

时间推荐使用 ISO 8601，例如 `2026-10-22T09:30:00+08:00`。如果原始来源只给日期，可把时间写为当地 `00:00:00`，并保留 `timePrecision: 'date'`，不要虚构具体时刻。

状态只能使用：

- `verified`：满足已核验标准。
- `official`：仅能确认机构公开声明。
- `pending`：不得放入正式精选。

来源 `type` 使用 `primary` 或 `secondary`。所有网址应为完整 HTTPS 地址；页面只在用户点击后访问。

## 修改后的检查

若电脑已安装 Node.js，可运行：

```powershell
node --test tests/app.test.js tests/news-data.test.js
powershell -ExecutionPolicy Bypass -File tests/static-audit.ps1
```

没有 Node.js 也不影响网站运行。此时至少打开 `tests/browser-smoke.html`，确认各项显示 PASS；再执行人工 Network 检查。若页面空白，通常是对象之间漏了逗号、字符串引号未闭合或括号数量不匹配。

<a id="rollback"></a>
## 回滚（rollback）

1. 关闭当前页面和正在编辑的文件。
2. 从更新前的备份目录复制 `news-data.js`。
3. 覆盖当前项目中的同名文件。
4. 重新双击 `index.html`，确认旧版本恢复。
5. 保留失败版本的副本用于排查，但不要把它作为正式交付文件。

若来源后来撤回或核心事实被推翻，先回滚或移除该条，再重新核验。不要用自动抓取、AI API、后台监控或计划任务代替上述人工流程。
