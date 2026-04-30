// myterminal/src/ui/webview/app.js
const vscode = acquireVsCodeApi();

let activeCategory = '';
let currentResults = [];
let currentDetailId = null;

// DOM
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const detailDiv = document.getElementById('detail');
const emptyDiv = document.getElementById('empty');
const loadingDiv = document.getElementById('loading');
const statusText = document.getElementById('statusText');

// 统一标签点击 — 全部用关键词搜索模式
document.querySelectorAll('.tool-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.tool-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    activeCategory = '';
    const tool = tag.dataset.tool;
    searchInput.value = tool || '';
    doSearch();
  });
});

// 搜索输入（防抖）
let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doSearch, 200);
});

function doSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showEmpty();
    return;
  }

  showLoading();
  vscode.postMessage({
    type: 'search',
    query,
    category: activeCategory || undefined
  });
}

// 接收来自扩展的消息
window.addEventListener('message', (event) => {
  const msg = event.data;

  if (msg.type === 'searchResults') {
    currentResults = msg.results;
    renderResults(msg.results, msg.query);
  } else if (msg.type === 'commandDetail') {
    currentDetailId = msg.command.id;
    renderDetail(msg.command, msg.relatedCommands);
  } else if (msg.type === 'commandCount') {
    statusText.textContent = '共 ' + msg.count + ' 条指令';
  }
});

function showEmpty() {
  resultsDiv.innerHTML = '';
  resultsDiv.classList.remove('hidden');
  detailDiv.classList.add('hidden');
  emptyDiv.classList.remove('hidden');
  loadingDiv.classList.add('hidden');
}

function showLoading() {
  resultsDiv.classList.add('hidden');
  detailDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  loadingDiv.classList.remove('hidden');
}

function renderResults(results, query) {
  loadingDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  detailDiv.classList.add('hidden');
  resultsDiv.classList.remove('hidden');

  if (results.length === 0) {
    resultsDiv.innerHTML =
      '<div class="empty"><div class="empty-text">未找到匹配 "'
      + escapeHtml(query) + '" 的指令</div></div>';
    return;
  }

  resultsDiv.innerHTML = results.map((r, i) => {
    const cmd = r.command;
    return `
      <div class="result-item" data-index="${i}">
        <div class="name">
          ${escapeHtml(cmd.name)}
          <span class="match-badge">${Math.round(r.score)}%</span>
        </div>
        <div class="desc">${escapeHtml(cmd.description)}</div>
        <div class="meta">
          <span>${escapeHtml(cmd.category)}</span>
          <span>${cmd.platform.join(' · ')}</span>
        </div>
      </div>`;
  }).join('');

  // 点击结果项 → 请求详情
  resultsDiv.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      const cmd = results[idx].command;
      vscode.postMessage({ type: 'getDetail', id: cmd.id });
    });
  });
}

function renderDetail(command, relatedCommands) {
  resultsDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  loadingDiv.classList.add('hidden');
  detailDiv.classList.remove('hidden');

  detailDiv.innerHTML = `
    <button class="back-btn" id="backBtn">← 返回结果</button>
    <div class="cmd-header">
      <span class="cmd-name">${escapeHtml(command.name)}</span>
      ${command.platform.map(p => `<span class="platform-tag">${escapeHtml(p)}</span>`).join('')}
    </div>
    <div class="cmd-desc">${escapeHtml(command.description)}</div>

    <div class="syntax-box">
      <div class="label">语法</div>
      <code>${escapeHtml(command.syntax)}</code>
    </div>

    <div class="examples">
      <h4>示例</h4>
      ${command.examples.map(e => `
        <div class="example-item">
          <div>
            <div class="ex-desc">${escapeHtml(e.desc)}</div>
            <div class="ex-cmd">${escapeHtml(e.cmd)}</div>
          </div>
          <button class="copy-btn" data-cmd="${escapeHtml(e.cmd)}">复制</button>
        </div>
      `).join('')}
    </div>

    ${relatedCommands.length > 0 ? `
      <div class="related">
        <h4>相关指令</h4>
        ${relatedCommands.map(rc =>
          `<span class="related-tag" data-id="${escapeHtml(rc.id)}">${escapeHtml(rc.name)}</span>`
        ).join('')}
      </div>
    ` : ''}
  `;

  // 返回按钮
  document.getElementById('backBtn').addEventListener('click', () => {
    renderResults(currentResults, searchInput.value);
  });

  // 复制按钮
  detailDiv.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = btn.dataset.cmd;
      vscode.postMessage({ type: 'copy', text: cmd });
    });
  });

  // 相关指令点击
  detailDiv.querySelectorAll('.related-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const id = tag.dataset.id;
      vscode.postMessage({ type: 'getDetail', id });
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
