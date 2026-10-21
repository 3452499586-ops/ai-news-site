const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeText,
  validateItem,
  filterItems,
  sortItems,
  summarizeItems,
  parseQueryState,
  buildQueryState
} = require('../app.js');

const baseItem = {
  id: 'alpha',
  title: 'Voxtral 3 实时语音',
  summary: '面向 Enterprise Agent 的语音模型',
  company: 'Mistral AI',
  region: '法国',
  category: '模型与产品',
  eventTime: '2026-10-20T00:00:00+02:00',
  publishedTime: '2026-10-20T00:00:00+02:00',
  verifiedTime: '2026-10-22T00:00:00+08:00',
  verificationStatus: 'verified',
  openSourceStatus: '部分开放',
  apiStatus: '已开放',
  isResearch: false,
  tags: ['语音 Agent', 'API'],
  sources: [{ name: 'Mistral Official', type: 'primary', channel: '官方', url: 'https://example.com/a' }],
  score: 88
};

const items = [
  baseItem,
  {
    ...baseItem,
    id: 'beta',
    title: 'DeepSeek Flash 更新',
    summary: '来自中国的模型与 Search API 更新',
    company: 'DeepSeek',
    region: '中国',
    category: '模型与产品',
    eventTime: '2026-10-17T00:00:00+08:00',
    verificationStatus: 'official',
    openSourceStatus: '开放权重',
    apiStatus: '已开放',
    isResearch: false,
    tags: ['搜索', '多模态'],
    sources: [{ name: 'DeepSeek API Docs', type: 'primary', channel: '官方文档', url: 'https://example.com/b' }],
    score: 90
  },
  {
    ...baseItem,
    id: 'gamma',
    title: 'Earth AI Research',
    summary: '地理空间 research 工具',
    company: 'Google Research',
    region: '美国',
    category: '研究与开源',
    eventTime: '2026-10-14T00:00:00-07:00',
    verificationStatus: 'official',
    openSourceStatus: '部分开放',
    apiStatus: '早期访问',
    isResearch: true,
    tags: ['Earth AI'],
    sources: [{ name: 'Google Research Blog', type: 'primary', channel: '研究博客', url: 'https://example.com/c' }],
    score: 80
  }
];

test('归一化搜索文本时折叠空格并统一英文大小写', () => {
  assert.equal(normalizeText('  Voice   AGENT 语音 '), 'voice agent 语音');
  assert.equal(normalizeText(null), '');
});

test('搜索覆盖标题、公司、摘要、标签和来源名称', () => {
  assert.deepEqual(filterItems(items, { query: 'VOXTRAL' }).map((item) => item.id), ['alpha']);
  assert.deepEqual(filterItems(items, { query: ' deepseek ' }).map((item) => item.id), ['beta']);
  assert.deepEqual(filterItems(items, { query: 'enterprise agent' }).map((item) => item.id), ['alpha']);
  assert.deepEqual(filterItems(items, { query: 'earth ai' }).map((item) => item.id), ['gamma']);
  assert.deepEqual(filterItems(items, { query: 'research blog' }).map((item) => item.id), ['gamma']);
});

test('公司、地区、类型、核验、开源、API 与研究筛选可组合', () => {
  const result = filterItems(items, {
    company: 'Google Research',
    region: '美国',
    category: '研究与开源',
    verificationStatus: 'official',
    openSourceStatus: '部分开放',
    apiStatus: '早期访问',
    isResearch: 'true'
  });
  assert.deepEqual(result.map((item) => item.id), ['gamma']);
  assert.deepEqual(filterItems(items, { isResearch: 'false' }).map((item) => item.id), ['alpha', 'beta']);
});

test('关键字段或一级来源缺失时校验拒绝条目', () => {
  assert.deepEqual(validateItem(baseItem), { valid: true, errors: [] });
  const invalid = { ...baseItem, title: '', sources: [] };
  const result = validateItem(invalid);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['title', 'primarySource']);
});

test('三种排序不修改原数组，并以事件时间打破评分同分', () => {
  const tie = { ...items[2], id: 'delta', eventTime: '2026-10-21T00:00:00Z', score: 90 };
  const input = [...items, tie];
  assert.deepEqual(sortItems(input, 'newest').map((item) => item.id), ['delta', 'alpha', 'beta', 'gamma']);
  assert.deepEqual(sortItems(input, 'oldest').map((item) => item.id), ['gamma', 'beta', 'alpha', 'delta']);
  assert.deepEqual(sortItems(input, 'score').map((item) => item.id), ['delta', 'beta', 'alpha', 'gamma']);
  assert.deepEqual(input.map((item) => item.id), ['alpha', 'beta', 'gamma', 'delta']);
});

test('统计结果区分核验状态、分类和唯一来源机构', () => {
  assert.deepEqual(summarizeItems(items), {
    total: 3,
    verified: 1,
    official: 2,
    pending: 0,
    categories: { '模型与产品': 2, '研究与开源': 1 },
    companies: 3,
    sourceCount: 3
  });
});

test('URL 状态忽略非法值并保留合法筛选', () => {
  const options = {
    companies: ['Mistral AI', 'DeepSeek'],
    regions: ['法国', '中国'],
    categories: ['模型与产品'],
    verificationStatuses: ['verified', 'official'],
    openSourceStatuses: ['部分开放', '开放权重'],
    apiStatuses: ['已开放'],
    sortModes: ['newest', 'oldest', 'score']
  };
  assert.deepEqual(
    parseQueryState('?q=%E8%AF%AD%E9%9F%B3&company=不存在&region=%E4%B8%AD%E5%9B%BD&status=official&research=maybe&sort=score', options),
    { query: '语音', company: '', region: '中国', category: '', verificationStatus: 'official', openSourceStatus: '', apiStatus: '', isResearch: '', sort: 'score' }
  );
});

test('构建 URL 状态时省略空值并使用稳定字段顺序', () => {
  assert.equal(
    buildQueryState({ query: '语音 Agent', company: '', region: '中国', category: '模型与产品', verificationStatus: '', openSourceStatus: '', apiStatus: '已开放', isResearch: 'false', sort: 'newest' }),
    '?q=%E8%AF%AD%E9%9F%B3+Agent&region=%E4%B8%AD%E5%9B%BD&category=%E6%A8%A1%E5%9E%8B%E4%B8%8E%E4%BA%A7%E5%93%81&api=%E5%B7%B2%E5%BC%80%E6%94%BE&research=false'
  );
});
