const test = require('node:test');
const assert = require('node:assert/strict');

const { AI_NEWS_META, AI_NEWS_DATA } = require('../news-data.js');

const iso8601WithZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
const requiredTextFields = [
  'title', 'summary', 'company', 'region', 'category', 'background',
  'content', 'importance', 'userImpact', 'developerImpact',
  'openSourceStatus', 'apiStatus'
];

test('正式精选保持 5—8 条、ID 唯一且不含待确认内容', () => {
  assert.ok(AI_NEWS_DATA.length >= 5 && AI_NEWS_DATA.length <= 8);
  assert.equal(new Set(AI_NEWS_DATA.map((item) => item.id)).size, AI_NEWS_DATA.length);
  assert.equal(AI_NEWS_DATA.some((item) => item.verificationStatus === 'pending'), false);
});

test('每条资讯具备完整文本、三类带时区时间和本地筛选字段', () => {
  for (const item of AI_NEWS_DATA) {
    assert.ok(item.id, '缺少 id');
    for (const field of requiredTextFields) {
      assert.equal(typeof item[field], 'string', `${item.id} 的 ${field} 必须是字符串`);
      assert.ok(item[field].trim(), `${item.id} 缺少 ${field}`);
    }
    for (const field of ['eventTime', 'publishedTime', 'verifiedTime']) {
      assert.match(item[field], iso8601WithZone, `${item.id} 的 ${field} 不是带时区 ISO 8601`);
    }
    assert.equal(typeof item.isResearch, 'boolean');
    assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
    assert.ok(Array.isArray(item.corrections));
    assert.equal(typeof item.featured, 'boolean');
    assert.equal(typeof item.score, 'number');
  }
});

test('每条资讯至少有可访问格式的一级来源，复杂事件还具有独立来源', () => {
  for (const item of AI_NEWS_DATA) {
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.id} 缺少来源`);
    assert.ok(item.sources.some((source) => source.type === 'primary'), `${item.id} 缺少一级来源`);
    for (const source of item.sources) {
      assert.equal(new URL(source.url).protocol, 'https:', `${item.id} 来源不是 HTTPS`);
      assert.ok(source.name && source.channel);
    }
    if (item.requiresIndependentVerification) {
      assert.ok(item.sources.some((source) => source.type === 'secondary'), `${item.id} 缺少独立来源`);
    }
  }
});

test('站点元数据包含数据日期、手动更新时间和覆盖机构', () => {
  assert.match(AI_NEWS_META.dataDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(AI_NEWS_META.lastManualUpdate, iso8601WithZone);
  assert.ok(Array.isArray(AI_NEWS_META.coveredOrganizations));
  assert.ok(AI_NEWS_META.coveredOrganizations.length >= 5);
});
