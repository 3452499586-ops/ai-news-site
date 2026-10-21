(function attachApplication(root) {
  'use strict';

  const EMPTY_FILTER_STATE = Object.freeze({
    query: '',
    company: '',
    region: '',
    category: '',
    verificationStatus: '',
    openSourceStatus: '',
    apiStatus: '',
    isResearch: '',
    sort: 'newest'
  });

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('zh-CN');
  }

  function validateItem(item) {
    const errors = [];
    const required = ['id', 'title', 'eventTime', 'publishedTime', 'verifiedTime'];
    for (const field of required) {
      if (!item || typeof item[field] !== 'string' || !item[field].trim()) errors.push(field);
    }
    const hasPrimary = Boolean(item && Array.isArray(item.sources)
      && item.sources.some((source) => source && source.type === 'primary' && source.url));
    if (!hasPrimary) errors.push('primarySource');
    return { valid: errors.length === 0, errors };
  }

  function filterItems(items, state = {}) {
    const query = normalizeText(state.query);
    return items.filter((item) => {
      if (!validateItem(item).valid) return false;
      if (state.company && item.company !== state.company) return false;
      if (state.region && item.region !== state.region) return false;
      if (state.category && item.category !== state.category) return false;
      if (state.verificationStatus && item.verificationStatus !== state.verificationStatus) return false;
      if (state.openSourceStatus && item.openSourceStatus !== state.openSourceStatus) return false;
      if (state.apiStatus && item.apiStatus !== state.apiStatus) return false;
      if (state.isResearch === 'true' && item.isResearch !== true) return false;
      if (state.isResearch === 'false' && item.isResearch !== false) return false;
      if (!query) return true;

      const sourceNames = (item.sources || []).map((source) => source.name || '');
      const haystack = normalizeText([
        item.title,
        item.company,
        item.summary,
        ...(item.tags || []),
        ...sourceNames
      ].join(' '));
      return haystack.includes(query);
    });
  }

  function sortItems(items, mode = 'newest') {
    const copy = [...items];
    const byNewest = (a, b) => new Date(b.eventTime) - new Date(a.eventTime);
    if (mode === 'oldest') return copy.sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
    if (mode === 'score') {
      return copy.sort((a, b) => (Number(b.score) - Number(a.score)) || byNewest(a, b));
    }
    return copy.sort(byNewest);
  }

  function summarizeItems(items) {
    const categories = {};
    const companies = new Set();
    const sources = new Set();
    const summary = { total: items.length, verified: 0, official: 0, pending: 0 };

    for (const item of items) {
      if (Object.hasOwn(summary, item.verificationStatus)) summary[item.verificationStatus] += 1;
      categories[item.category] = (categories[item.category] || 0) + 1;
      companies.add(item.company);
      for (const source of item.sources || []) sources.add(source.name);
    }

    return {
      ...summary,
      categories,
      companies: companies.size,
      sourceCount: sources.size
    };
  }

  function allowedValue(params, key, allowed) {
    const value = params.get(key) || '';
    return Array.isArray(allowed) && allowed.includes(value) ? value : '';
  }

  function parseQueryState(search, options = {}) {
    const params = new URLSearchParams(String(search || '').replace(/^#/, '?'));
    const research = params.get('research');
    const sort = allowedValue(params, 'sort', options.sortModes) || 'newest';
    return {
      query: params.get('q') || '',
      company: allowedValue(params, 'company', options.companies),
      region: allowedValue(params, 'region', options.regions),
      category: allowedValue(params, 'category', options.categories),
      verificationStatus: allowedValue(params, 'status', options.verificationStatuses),
      openSourceStatus: allowedValue(params, 'open', options.openSourceStatuses),
      apiStatus: allowedValue(params, 'api', options.apiStatuses),
      isResearch: research === 'true' || research === 'false' ? research : '',
      sort
    };
  }

  function buildQueryState(state = {}) {
    const params = new URLSearchParams();
    const fields = [
      ['q', state.query],
      ['company', state.company],
      ['region', state.region],
      ['category', state.category],
      ['status', state.verificationStatus],
      ['open', state.openSourceStatus],
      ['api', state.apiStatus],
      ['research', state.isResearch]
    ];
    for (const [key, value] of fields) {
      if (value !== undefined && value !== null && String(value).trim()) params.set(key, String(value));
    }
    if (state.sort && state.sort !== 'newest') params.set('sort', state.sort);
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  const api = {
    EMPTY_FILTER_STATE,
    normalizeText,
    validateItem,
    filterItems,
    sortItems,
    summarizeItems,
    parseQueryState,
    buildQueryState
  };

  root.AINewsApp = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
