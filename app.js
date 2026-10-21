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
    if (item && item.verificationStatus === 'pending') errors.push('verificationStatus');
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

  function createElement(documentRef, tagName, className, text) {
    const node = documentRef.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '日期未提供';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date);
  }

  function statusText(status) {
    return { verified: '已核验', official: '官方声明', pending: '待确认' }[status] || '状态未知';
  }

  function appendDetail(documentRef, rootNode, title, text, wide) {
    if (!text) return;
    const block = createElement(documentRef, 'section', `detail-block${wide ? ' wide' : ''}`);
    block.append(
      createElement(documentRef, 'h4', '', title),
      createElement(documentRef, 'p', '', text)
    );
    rootNode.append(block);
  }

  function appendTimeDetails(documentRef, rootNode, item) {
    const block = createElement(documentRef, 'section', 'detail-block wide news-times');
    block.append(createElement(documentRef, 'h4', '', '时间记录'));
    const list = createElement(documentRef, 'dl');
    const entries = [
      ['事件发生时间', item.eventTime],
      ['原始发布时间', item.publishedTime],
      ['本站核验时间', item.verifiedTime]
    ];
    for (const [label, value] of entries) {
      const time = createElement(documentRef, 'time', '', formatDate(value));
      time.setAttribute('datetime', value);
      list.append(createElement(documentRef, 'dt', '', label), createElement(documentRef, 'dd'));
      list.children[list.children.length - 1].append(time);
    }
    block.append(list);
    rootNode.append(block);
  }

  function renderNewsList(items, rootNode) {
    if (!rootNode) return;
    const documentRef = rootNode.ownerDocument || root.document;
    const fragment = documentRef.createDocumentFragment ? documentRef.createDocumentFragment() : createElement(documentRef, 'div');

    for (const item of items) {
      const validation = validateItem(item);
      if (!validation.valid) {
        if (typeof window !== 'undefined' && root.console && typeof root.console.warn === 'function') {
          root.console.warn(`忽略无效资讯 ${item && item.id ? item.id : '(无 ID)'}: ${validation.errors.join(', ')}`);
        }
        continue;
      }

      const article = createElement(documentRef, 'article', 'timeline-item');
      article.dataset.newsId = item.id;

      const time = createElement(documentRef, 'div', 'timeline-time');
      const timeElement = createElement(documentRef, 'time', '', formatDate(item.eventTime));
      timeElement.setAttribute('datetime', item.eventTime);
      time.append(timeElement, createElement(documentRef, 'span', '', item.company));

      const content = createElement(documentRef, 'div', 'timeline-content');
      const meta = createElement(documentRef, 'div', 'timeline-meta');
      meta.append(
        createElement(documentRef, 'span', 'type-badge', item.category),
        createElement(documentRef, 'span', `status-badge ${item.verificationStatus}`, statusText(item.verificationStatus)),
        createElement(documentRef, 'span', '', `${item.sources.length} 个来源`)
      );
      content.append(
        meta,
        createElement(documentRef, 'h3', '', item.title),
        createElement(documentRef, 'p', 'timeline-summary', item.summary)
      );

      const toggle = createElement(documentRef, 'button', 'details-toggle', '展开证据与影响');
      toggle.setAttribute('type', 'button');
      toggle.setAttribute('aria-expanded', 'false');
      const detailsId = `details-${item.id}`;
      toggle.setAttribute('aria-controls', detailsId);

      const details = createElement(documentRef, 'div', 'news-details');
      details.id = detailsId;
      details.hidden = true;
      appendTimeDetails(documentRef, details, item);
      appendDetail(documentRef, details, '背景', item.background, false);
      appendDetail(documentRef, details, '核心事实', item.content, false);
      appendDetail(documentRef, details, '为什么重要', item.importance, false);
      appendDetail(documentRef, details, '对普通用户', item.userImpact, false);
      appendDetail(documentRef, details, '对开发者与企业', item.developerImpact, true);
      appendDetail(documentRef, details, '核验说明', item.verificationNote, true);

      if (item.uncertainty) {
        const uncertainty = createElement(documentRef, 'section', 'detail-block wide uncertainty');
        uncertainty.append(
          createElement(documentRef, 'h4', '', '不确定项'),
          createElement(documentRef, 'p', '', item.uncertainty)
        );
        details.append(uncertainty);
      }

      const sourceBlock = createElement(documentRef, 'section', 'detail-block wide');
      sourceBlock.append(createElement(documentRef, 'h4', '', '来源与原文'));
      const sourceList = createElement(documentRef, 'ul', 'source-list');
      for (const source of item.sources) {
        const listItem = createElement(documentRef, 'li');
        const link = createElement(documentRef, 'a', '', source.name);
        link.setAttribute('href', source.url);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        listItem.append(link, createElement(documentRef, 'span', '', ` · ${source.channel}`));
        sourceList.append(listItem);
      }
      sourceBlock.append(sourceList);
      details.append(sourceBlock);

      if (Array.isArray(item.corrections) && item.corrections.length) {
        appendDetail(
          documentRef,
          details,
          '纠错记录',
          item.corrections.map((entry) => `${entry.date}：${entry.note}`).join('；'),
          true
        );
      }

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        toggle.textContent = expanded ? '展开证据与影响' : '收起证据与影响';
        details.hidden = expanded;
      });

      content.append(toggle, details);
      article.append(time, content);
      fragment.append(article);
    }

    rootNode.replaceChildren(...(fragment.children ? fragment.children : [fragment]));
    rootNode.setAttribute('aria-busy', 'false');
  }

  function renderFeatured(items, index, rootNode) {
    if (!rootNode) return;
    const documentRef = rootNode.ownerDocument || root.document;
    const item = items[index];
    if (!item) {
      rootNode.replaceChildren(createElement(documentRef, 'p', '', '当前没有重点资讯。'));
      return;
    }
    const article = createElement(documentRef, 'article', 'featured-item');
    const meta = createElement(documentRef, 'div', 'featured-meta');
    meta.append(
      createElement(documentRef, 'span', `status-badge ${item.verificationStatus}`, statusText(item.verificationStatus)),
      createElement(documentRef, 'span', '', formatDate(item.eventTime)),
      createElement(documentRef, 'span', '', item.company),
      createElement(documentRef, 'span', '', item.category)
    );
    article.append(
      meta,
      createElement(documentRef, 'h2', '', item.title),
      createElement(documentRef, 'p', 'featured-summary', item.summary)
    );
    rootNode.replaceChildren(article);
  }

  function renderSummary(summary, roots = {}) {
    const documentRef = roots.signalBar
      ? roots.signalBar.ownerDocument
      : (roots.overview ? roots.overview.ownerDocument : root.document);
    const meta = roots.meta || {};
    const items = roots.items || [];

    if (roots.signalBar) {
      const inner = createElement(documentRef, 'div', 'signal-bar-inner');
      const stats = [
        ['数据日期', meta.dataDate || '未提供'],
        ['当前展示', `${summary.total} 条`],
        ['已核验', `${summary.verified} 条`],
        ['官方声明', `${summary.official} 条`],
        ['最后手动更新', meta.lastManualUpdate ? formatDate(meta.lastManualUpdate) : '未提供']
      ];
      for (const [label, value] of stats) {
        const stat = createElement(documentRef, 'div', 'signal-stat');
        stat.append(createElement(documentRef, 'span', '', label), createElement(documentRef, 'strong', '', value));
        inner.append(stat);
      }
      roots.signalBar.replaceChildren(inner);
    }

    if (roots.overview) {
      const title = createElement(documentRef, 'h2', '', '今日核验概览');
      title.id = 'verification-title';
      const rows = [
        ['已核验', summary.verified],
        ['官方声明', summary.official],
        ['覆盖机构', summary.companies],
        ['证据入口', summary.sourceCount]
      ];
      roots.overview.replaceChildren(title);
      for (const [label, value] of rows) {
        const row = createElement(documentRef, 'div', 'overview-number');
        row.append(createElement(documentRef, 'span', '', label), createElement(documentRef, 'strong', '', value));
        roots.overview.append(row);
      }
    }

    if (roots.sourceRadar) {
      const counts = new Map();
      for (const item of items) {
        for (const source of item.sources || []) {
          const label = source.type === 'secondary' ? '独立媒体' : source.channel;
          counts.set(label, (counts.get(label) || 0) + 1);
        }
      }
      const title = createElement(documentRef, 'h2', '', '来源雷达');
      title.id = 'radar-title';
      roots.sourceRadar.replaceChildren(title);
      const max = Math.max(1, ...counts.values());
      for (const [label, count] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        const row = createElement(documentRef, 'div', 'radar-row');
        const text = createElement(documentRef, 'p');
        text.append(createElement(documentRef, 'span', '', label), createElement(documentRef, 'strong', '', count));
        const track = createElement(documentRef, 'div', 'radar-track');
        const fill = createElement(documentRef, 'span');
        fill.setAttribute('style', `width: ${Math.round((count / max) * 100)}%`);
        track.append(fill);
        row.append(text, track);
        roots.sourceRadar.append(row);
      }
    }
  }

  function uniqueValues(items, key) {
    return [...new Set(items.map((item) => item[key]).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
  }

  function buildOptions(items) {
    return {
      companies: uniqueValues(items, 'company'),
      regions: uniqueValues(items, 'region'),
      categories: uniqueValues(items, 'category'),
      verificationStatuses: ['verified', 'official'],
      openSourceStatuses: uniqueValues(items, 'openSourceStatus'),
      apiStatuses: uniqueValues(items, 'apiStatus'),
      sortModes: ['newest', 'oldest', 'score']
    };
  }

  function populateSelect(select, values, labels = {}) {
    if (!select) return;
    const documentRef = select.ownerDocument;
    const first = select.children && select.children.length ? select.children[0] : null;
    select.replaceChildren(...(first ? [first] : []));
    for (const value of values) {
      const option = createElement(documentRef, 'option', '', labels[value] || value);
      option.setAttribute('value', value);
      select.append(option);
    }
  }

  function describeActiveFilters(state = {}) {
    const fieldLabels = {
      query: '搜索', company: '机构', region: '地区', category: '内容类型',
      verificationStatus: '核验状态', openSourceStatus: '开源状态', apiStatus: 'API 状态',
      isResearch: '研究属性', sort: '排序'
    };
    const valueLabels = {
      verificationStatus: { verified: '已核验', official: '官方声明' },
      isResearch: { true: '研究内容', false: '非研究内容' },
      sort: { newest: '时间：最新优先', oldest: '时间：最早优先', score: '编辑评分' }
    };
    return Object.entries(state)
      .filter(([key, value]) => value && !(key === 'sort' && value === 'newest'))
      .map(([key, value]) => {
        const labels = valueLabels[key];
        const displayValue = labels && Object.hasOwn(labels, value) ? labels[value] : value;
        return `${fieldLabels[key] || key}：${displayValue}`;
      })
      .join('；');
  }

  function bindLocalFormSubmit(form, onSubmit, clearPending) {
    if (!form || typeof form.addEventListener !== 'function') return;
    form.addEventListener('submit', (event) => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof clearPending === 'function') clearPending();
      if (typeof onSubmit === 'function') onSubmit();
    });
  }

  function initNewsSite(documentRef, locationRef, historyRef) {
    if (!documentRef || !documentRef.getElementById) return;
    const pageRoot = documentRef.documentElement;
    if (pageRoot && pageRoot.dataset && pageRoot.dataset.newsInitialized === 'true') return;
    if (pageRoot && pageRoot.dataset) pageRoot.dataset.newsInitialized = 'true';

    const rawItems = Array.isArray(root.AI_NEWS_DATA) ? root.AI_NEWS_DATA : [];
    const validItems = rawItems.filter((item) => {
      const validation = validateItem(item);
      if (!validation.valid && typeof window !== 'undefined' && root.console && typeof root.console.warn === 'function') {
        root.console.warn(`忽略无效资讯 ${item && item.id ? item.id : '(无 ID)'}: ${validation.errors.join(', ')}`);
      }
      return validation.valid;
    });
    const options = buildOptions(validItems);
    const form = documentRef.getElementById('filter-form');
    const timeline = documentRef.getElementById('timeline');
    if (!form || !timeline) return;

    const controls = {
      query: form.elements.namedItem('q'),
      company: form.elements.namedItem('company'),
      region: form.elements.namedItem('region'),
      category: form.elements.namedItem('category'),
      verificationStatus: form.elements.namedItem('verificationStatus'),
      openSourceStatus: form.elements.namedItem('openSourceStatus'),
      apiStatus: form.elements.namedItem('apiStatus'),
      isResearch: form.elements.namedItem('isResearch'),
      sort: form.elements.namedItem('sort')
    };

    populateSelect(controls.company, options.companies);
    populateSelect(controls.region, options.regions);
    populateSelect(controls.category, options.categories);
    populateSelect(controls.verificationStatus, ['verified', 'official'], { verified: '已核验', official: '官方声明' });
    populateSelect(controls.openSourceStatus, options.openSourceStatuses);
    populateSelect(controls.apiStatus, options.apiStatuses);

    const initial = parseQueryState(locationRef ? locationRef.search : '', options);
    for (const [key, control] of Object.entries(controls)) {
      if (control) control.value = initial[key] || (key === 'sort' ? 'newest' : '');
    }

    const empty = documentRef.getElementById('empty-state');
    const live = documentRef.getElementById('live-region');
    const featuredRoot = documentRef.getElementById('featured-stage');
    const carouselStatus = documentRef.getElementById('carousel-status');
    const featuredItems = sortItems(validItems.filter((item) => item.featured), 'score').slice(0, 3);
    let featuredIndex = 0;

    function currentState() {
      const state = {};
      for (const [key, control] of Object.entries(controls)) {
        state[key] = control ? control.value : '';
      }
      return state;
    }

    function updateFeatured() {
      renderFeatured(featuredItems, featuredIndex, featuredRoot);
      if (carouselStatus) carouselStatus.textContent = featuredItems.length ? `${featuredIndex + 1} / ${featuredItems.length}` : '0 / 0';
    }

    function applyState() {
      const state = currentState();
      const result = sortItems(filterItems(validItems, state), state.sort);
      renderNewsList(result, timeline);
      if (live) live.textContent = `当前显示 ${result.length} 条，共 ${validItems.length} 条本地资讯`;
      if (empty) {
        empty.hidden = result.length !== 0;
        const summary = empty.querySelector('[data-empty-summary]');
        if (summary) {
          const conditions = describeActiveFilters(state);
          summary.textContent = conditions ? `当前条件：${conditions}` : '请调整条件或清除筛选。';
        }
      }
      if (historyRef && typeof historyRef.replaceState === 'function' && locationRef) {
        const query = buildQueryState(state);
        historyRef.replaceState(null, '', `${locationRef.pathname || ''}${query}${locationRef.hash || ''}`);
      }
    }

    renderSummary(summarizeItems(validItems), {
      signalBar: documentRef.getElementById('signal-bar'),
      overview: documentRef.getElementById('verification-overview'),
      sourceRadar: documentRef.getElementById('source-radar'),
      meta: root.AI_NEWS_META || {},
      items: validItems
    });
    updateFeatured();
    applyState();

    let searchTimer = null;
    const clearPendingSearch = () => {
      root.clearTimeout(searchTimer);
      searchTimer = null;
    };
    if (controls.query) {
      controls.query.addEventListener('input', () => {
        clearPendingSearch();
        searchTimer = root.setTimeout(applyState, 140);
      });
    }
    bindLocalFormSubmit(form, applyState, clearPendingSearch);
    form.addEventListener('change', applyState);
    form.addEventListener('reset', () => root.setTimeout(applyState, 0));

    for (const button of documentRef.querySelectorAll('[data-clear-filters]')) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        form.reset();
        if (controls.sort) controls.sort.value = 'newest';
        applyState();
        if (controls.query && typeof controls.query.focus === 'function') controls.query.focus();
      });
    }

    for (const button of documentRef.querySelectorAll('[data-focus-search]')) {
      button.addEventListener('click', () => {
        if (controls.query && typeof controls.query.focus === 'function') controls.query.focus();
      });
    }

    for (const link of documentRef.querySelectorAll('[data-nav-filter]')) {
      link.addEventListener('click', () => {
        if (controls.category) controls.category.value = link.dataset.navFilter;
        applyState();
      });
    }

    const previous = documentRef.querySelector('[data-carousel-prev]');
    const next = documentRef.querySelector('[data-carousel-next]');
    if (previous) previous.addEventListener('click', () => {
      featuredIndex = featuredItems.length ? (featuredIndex - 1 + featuredItems.length) % featuredItems.length : 0;
      updateFeatured();
    });
    if (next) next.addEventListener('click', () => {
      featuredIndex = featuredItems.length ? (featuredIndex + 1) % featuredItems.length : 0;
      updateFeatured();
    });

    if (featuredRoot) {
      let touchStartX = null;
      featuredRoot.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches && event.changedTouches[0] ? event.changedTouches[0].clientX : null;
      }, { passive: true });
      featuredRoot.addEventListener('touchend', (event) => {
        if (touchStartX === null || !event.changedTouches || !event.changedTouches[0]) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) >= 45 && featuredItems.length) {
          featuredIndex = delta < 0
            ? (featuredIndex + 1) % featuredItems.length
            : (featuredIndex - 1 + featuredItems.length) % featuredItems.length;
          updateFeatured();
        }
        touchStartX = null;
      }, { passive: true });
    }
  }

  const api = {
    EMPTY_FILTER_STATE,
    normalizeText,
    validateItem,
    filterItems,
    sortItems,
    summarizeItems,
    parseQueryState,
    buildQueryState,
    renderNewsList,
    renderFeatured,
    renderSummary,
    describeActiveFilters,
    bindLocalFormSubmit,
    initNewsSite
  };

  root.AINewsApp = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof window !== 'undefined' && window.document) {
    const start = () => initNewsSite(window.document, window.location, window.history);
    if (window.document.readyState === 'loading') window.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof window !== 'undefined' ? window : globalThis));
