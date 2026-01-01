import { marked } from 'marked'
import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { parse, html as d2hHtml } from 'diff2html'
import { getAssets, CUSTOM_CSS, CLIENT_SCRIPT, LOGO_BASE64, GITHUB_SVG } from './assets.js'

// Setup JSDOM for DOMPurify
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window as any)
DOMPurify.addHook('afterSanitizeAttributes', function (node: any) {
  if (node.tagName === 'SPAN' && node.className && node.className.startsWith('hljs-')) {
    // allow
  }
})

// Setup Marked
marked.setOptions({
  // @ts-ignore
  highlight: function (code: any, lang: any) {
    if (lang === 'xml' || !lang) {
      if (
        code.includes('import ') ||
        code.includes('export ') ||
        code.includes('const ') ||
        code.includes('interface ') ||
        (code.includes('<') && code.includes('/>'))
      ) {
        lang = 'tsx'
      }
    }
    const language = hljs.getLanguage(lang as string) ? lang : 'plaintext'
    try {
      return hljs.highlight(code, { language: language as string }).value
    } catch {
      return code
    }
  } as any
})

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderReviewItem(item: { file: string; review: string; diff: string }) {
  const json = (parse as any)(item.diff, { inputFormat: 'diff' })
  const diffHtml = (d2hHtml as any)(json, { showFiles: false, matching: 'lines' })
  const reviewHtml = item.review
    ? DOMPurify.sanitize(marked.parse(item.review) as string, { ADD_TAGS: ['span'], ADD_ATTR: ['class'] })
    : '<div class="review-body empty">暂无审查内容</div>'
  return {
    file: item.file,
    reviewHtml,
    diffHtml
  }
}

function getBaseTemplate(title: string, body: string, extraHead = '', extraScript = '') {
  const { css } = getAssets()
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${css}
${CUSTOM_CSS}
</style>
${extraHead}
</head>
<body>
<div class="container">
${body}
</div>
<script>
${CLIENT_SCRIPT}
${extraScript}
</script>
</body>
</html>`
}

export function renderHTMLTabs(
  files: Array<{ file: string; review: string; diff: string }>,
  meta?: { aiInvoked?: boolean; aiSucceeded?: boolean; provider?: string; model?: string; status?: string; datetime?: string; subtitle?: string }
): string {
  const renderedFiles = files.map(renderReviewItem)
  
  const tabs = renderedFiles
    .map((f, i) => `<button type="button" class="tab" data-idx="${i}" title="${escapeHtml(f.file)}">${escapeHtml(f.file)}</button>`)
    .join('')
    
  const panes = renderedFiles
    .map((f, i) => `
<div class="pane" data-idx="${i}">
  <div class="split">
    <div class="panel">
      <div class="panel-title">AI Review</div>
      <div class="review-body">${f.reviewHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-title">Diff</div>
      <div class="diff-body">${f.diffHtml}</div>
    </div>
  </div>
</div>`)
    .join('')

  let statusBadge = ''
  if (!meta?.aiInvoked) {
    statusBadge = `<span class="badge red">AI: 未参与</span>`
  } else if (meta?.aiInvoked && !meta?.aiSucceeded) {
    statusBadge = `<span class="badge red">AI: 尝试失败</span>`
  } else {
    // 静态页面生成时，肯定是“审核完毕”
    statusBadge = `<span class="badge green">AI: 审核完毕</span>`
  }

  const badge = meta
    ? `<div class="meta">
  ${statusBadge}
  ${meta.provider ? `<span class="badge">Provider: ${escapeHtml(meta.provider)}</span>` : ''}
  ${meta.model ? `<span class="badge">Model: ${escapeHtml(meta.model)}</span>` : ''}
  ${meta.status ? `<div class="status">${escapeHtml(meta.status)}</div>` : ''}
</div>`
    : ''

  const header = `<div class="header-row">
    <img src="${LOGO_BASE64}" class="logo" alt="Code Gate Logo" />
    <h1>Code Review</h1>
    ${meta?.subtitle ? `<div class="subtitle">${escapeHtml(meta.subtitle)}</div>` : ''}
  </div>
  <div class="top-right-area">
    <a href="https://github.com/Gil2015/code-gate" target="_blank" class="github-link" aria-label="GitHub Repo">
      ${GITHUB_SVG}
    </a>
    ${meta?.datetime ? `<div class="timestamp">${escapeHtml(meta.datetime)}</div>` : ''}
  </div>
  `

  const script = `
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
function activate(i) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.idx == i));
  panes.forEach(p => p.classList.toggle('active', p.dataset.idx == i));
}
tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.idx)));
if(tabs.length > 0) activate(0);
`

  return getBaseTemplate('Code Gate Review', `${header}${badge}<div class="tabs">${tabs}</div><div class="panes">${panes}</div>`, '', script)
}

export function renderHTMLLive(
  id: string,
  meta?: { aiInvoked?: boolean; aiSucceeded?: boolean; provider?: string; model?: string; status?: string; datetime?: string; subtitle?: string },
  initial?: Array<{ file: string; review: string; diff: string }>
): string {
  // Logic for live template... similar structure but uses polling script
  // Since we want to be robust, let's keep using CDN for the live page dependencies if we want, OR use the same bundled assets.
  // The original live template used CDN for marked/diff2html etc because it rendered client side.
  // But wait, our `renderReviewItem` logic is server side (in node).
  // The live page receives JSON updates and renders them.
  // If we want to keep the live page rendering client-side, we need to inject the libraries or bundle them.
  // The previous implementation used CDNs for the live page. Let's stick to that for the live page to avoid complex bundling of JS libraries.
  
  const initialJson = JSON.stringify(initial || [])
  const initialB64 = Buffer.from(initialJson, 'utf8').toString('base64')
  
  let statusBadge = ''
  // 实时页面初始状态：
  // 1. 如果 aiInvoked=true 但 aiSucceeded=false，说明可能一开始就挂了，显示红色失败
  // 2. 否则，默认为正在审核（蓝色），因为 live 页面就是在审核过程中打开的
  // 注意：我们不再完全依赖 meta.aiInvoked 的 false 状态来显示“未参与”，因为在 live 模式下，
  // 初始调用时 aiInvoked 可能还没被设置为 true（取决于调用时机），但只要进了 live 页面，就是为了看 AI 结果。
  
  if (meta?.aiInvoked && meta?.status && meta.status.includes('失败')) {
     statusBadge = `<span class="badge red">AI: 尝试失败</span>`
  } else if (meta?.aiInvoked === false && meta?.status && meta.status.includes('失败')) {
     statusBadge = `<span class="badge red">AI: 未参与</span>`
  } else {
     statusBadge = `<span class="badge blue" id="ai-status">AI: 正在审核剩余文件...</span>`
  }
  
  const badge = meta
    ? `<div class="meta">
  ${statusBadge}
  ${meta.provider ? `<span class="badge">Provider: ${escapeHtml(meta.provider)}</span>` : ''}
  ${meta.model ? `<span class="badge">Model: ${escapeHtml(meta.model)}</span>` : ''}
  ${meta.status ? `<div class="status">${escapeHtml(meta.status)}</div>` : ''}
</div>`
    : ''

  const header = `<div class="header-row">
    <img src="${LOGO_BASE64}" class="logo" alt="Code Gate Logo" />
    <h1>Code Review</h1>
    ${meta?.subtitle ? `<div class="subtitle">${escapeHtml(meta.subtitle)}</div>` : ''}
  </div>
  <div class="top-right-area">
    <a href="https://github.com/Gil2015/code-gate" target="_blank" class="github-link" aria-label="GitHub Repo">
      ${GITHUB_SVG}
    </a>
    ${meta?.datetime ? `<div class="timestamp">${escapeHtml(meta.datetime)}</div>` : ''}
  </div>
  `

  const head = `
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
`

  const script = `
const route = '/review/${id}/status';
function _decodeB64Json(b){ try { return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch(e){ return []; } }
const initial = _decodeB64Json('${initialB64}');
const tabsContainer = document.querySelector('.tabs');
const panesContainer = document.querySelector('.panes');
const known = new Set();

function activate(i){
  [...tabsContainer.children].forEach((t,idx)=>t.classList.toggle('active',idx===i));
  [...panesContainer.children].forEach((p,idx)=>p.classList.toggle('active',idx===i));
}

function addItem(item){
  if(known.has(item.file)) return;
  known.add(item.file);
  const i = known.size - 1;
  
  const t = document.createElement('button');
  t.type = 'button';
  t.className = 'tab';
  t.title = item.file;
  t.textContent = item.file;
  t.addEventListener('click', () => activate(i));
  tabsContainer.appendChild(t);
  
  const p = document.createElement('div');
  p.className = 'pane';
  
  const reviewHtml = item.review ? DOMPurify.sanitize(marked.parse(item.review)) : '<div class="review-body empty">暂无审查内容</div>';
  const parsed = window.Diff2Html.parse(item.diff, {inputFormat:'diff'});
  const diffHtml = window.Diff2Html.html(parsed, { showFiles:false, matching:'lines' });
  
  p.innerHTML = \`
  <div class="split">
    <div class="panel">
      <div class="panel-title">AI Review</div>
      <div class="review-body">\${reviewHtml}</div>
    </div>
    <div class="panel">
      <div class="panel-title">Diff</div>
      <div class="diff-body">\${diffHtml}</div>
    </div>
  </div>\`;
  panesContainer.appendChild(p);
  
  try {
    const el = p.querySelector('.review-body');
    const blocks = el ? el.querySelectorAll('pre code') : [];
    blocks.forEach((code) => {
      if (code.classList.contains('language-tsx')) {
        code.classList.remove('language-tsx');
        code.classList.add('language-typescript');
      }
      hljs.highlightElement(code);
    });
  } catch(e){}
  
  if(i === 0) activate(0);
}

async function poll(){
  try{
    const res = await fetch(route);
    if(!res.ok) {
      const n = document.getElementById('ai-status');
      if(n && known.size > 0) {
        n.textContent = 'AI: 审核完毕';
        n.className = 'badge green';
      }
      return;
    }
    const data = await res.json();
    const list = data && Array.isArray(data.files) ? data.files : [];
    list.forEach(it => { if(it && it.done) addItem(it); });
    if(data.done) {
      const n = document.getElementById('ai-status');
      if(n) {
        n.textContent = 'AI: 审核完毕';
        n.className = 'badge green';
      }
    } else {
      setTimeout(poll, 2000);
    }
  } catch(e) {
    setTimeout(poll, 5000);
  }
}

try { initial.forEach(addItem); } catch(e){}
poll();
`

  return getBaseTemplate('Code Gate Review', `${header}${badge}<div class="tabs"></div><div class="panes"></div>`, head, script)
}
