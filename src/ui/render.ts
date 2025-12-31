import { parse, html } from 'diff2html'

export function renderHTML(
  diff: string,
  review: string,
  meta?: { aiInvoked?: boolean; aiSucceeded?: boolean; provider?: string; model?: string; status?: string }
): string {
  const json = (parse as any)(diff, { inputFormat: 'diff' })
  const diffHtml = (html as any)(json, { showFiles: true, matching: 'lines' })
  const badge = meta
    ? `<div class="meta">
  <span class="badge">AI: ${meta.aiInvoked ? (meta.aiSucceeded ? '参与' : '尝试失败') : '未参与'}</span>
  ${meta.provider ? `<span class="badge">Provider: ${escapeHtml(meta.provider)}</span>` : ''}
  ${meta.model ? `<span class="badge">Model: ${escapeHtml(meta.model)}</span>` : ''}
  ${meta.status ? `<div class="status">${escapeHtml(meta.status)}</div>` : ''}
</div>`
    : ''
  const reviewHtml = review ? `<div class="review"><pre>${escapeHtml(review)}</pre></div>` : ''
  const page = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>code-gate review</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<style>
body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
.container{max-width:1200px;margin:24px auto;padding:0 16px}
.review{background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:16px;margin-bottom:16px;white-space:pre-wrap}
.meta{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.badge{display:inline-block;background:#eaeef2;border:1px solid #d0d7de;border-radius:999px;padding:4px 10px;font-size:12px;color:#24292f}
.status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
.hljs{background:#f6f8fa;border-radius:6px;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;padding:12px}
</style>
</head>
<body>
<div class="container">
<h1>Code Review</h1>
${badge}
${reviewHtml}
${diffHtml}
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('pre code').forEach((el) => {
    if (el.classList.contains('language-tsx')) {
      el.classList.remove('language-tsx');
      el.classList.add('language-typescript');
    }
    hljs.highlightElement(el);
  });
});
</script>
</body>
</html>`
  return page
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderHTMLTabs(
  files: Array<{ file: string; review: string; diff: string }>,
  meta?: { aiInvoked?: boolean; aiSucceeded?: boolean; provider?: string; model?: string; status?: string }
): string {
  const reviewsArr = files.map((f) =>
    (f.review || '')
      .replace(/<\/script/gi, '<\\/script')
      .replace(/<\/style/gi, '<\\/style')
      .replace(/<\/textarea/gi, '<\\/textarea')
  )
  const reviewsJson = JSON.stringify(reviewsArr)
  const reviewsB64 = Buffer.from(reviewsJson, 'utf8').toString('base64')
  const tabs = files
    .map((f, i) => `<button type="button" class="tab" data-idx="${i}" title="${escapeHtml(f.file)}">${escapeHtml(f.file)}</button>`)
    .join('')
  const panes = files
    .map((f, i) => {
      const json = (parse as any)(f.diff, { inputFormat: 'diff' })
      const diffHtml = (html as any)(json, { showFiles: false, matching: 'lines' })
      const reviewHtml = f.review ? `<div class="review-body"><pre>${escapeHtml(f.review)}</pre></div>` : `<div class="review-body empty">暂无审查内容</div>`
      return `<div class="pane" data-idx="${i}">
  <div class="split">
    <div class="panel panel-left">
      <div class="panel-title">AI Review</div>
      ${reviewHtml}
    </div>
    <div class="panel panel-right">
      <div class="panel-title">Diff</div>
      <div class="diff-body">${diffHtml}</div>
    </div>
  </div>
</div>`
    })
    .join('')
  const badge = meta
    ? `<div class="meta">
  <span class="badge">AI: ${meta.aiInvoked ? (meta.aiSucceeded ? '参与' : '尝试失败') : '未参与'}</span>
  ${meta.provider ? `<span class="badge">Provider: ${escapeHtml(meta.provider)}</span>` : ''}
  ${meta.model ? `<span class="badge">Model: ${escapeHtml(meta.model)}</span>` : ''}
  ${meta.status ? `<div class="status">${escapeHtml(meta.status)}</div>` : ''}
</div>`
    : ''
  const page = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>code-gate review</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
*{box-sizing:border-box}
html,body{height:100%;}
body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;overflow:hidden}
.container{width:100%;max-width:100%;margin:0 auto;padding:16px;height:100%;display:flex;flex-direction:column}
.tabs{display:flex;gap:8px;overflow-x:auto;border-bottom:1px solid #d0d7de;flex:0 0 auto;scrollbar-width:thin}
.tab{flex:0 0 auto;background:none;border:none;border-bottom:3px solid transparent;padding:8px 16px;font-size:14px;color:#57606a;cursor:pointer;transition:color 0.2s;white-space:nowrap}
.tab:hover{color:#24292f;border-bottom-color:#d0d7de}
.tab.active{color:#24292f;border-bottom-color:#0969da}
.panes{flex:1;overflow:hidden;position:relative}
.pane{display:none;height:100%;padding-top:12px}
.pane.active{display:block}
.split{display:flex;gap:12px;align-items:stretch;height:100%}
.panel{border:1px solid #d0d7de;border-radius:6px;background:#fff;display:flex;flex-direction:column;flex:1 1 50%;min-width:0;max-width:50%;height:100%}
.panel-title{font-weight:600;padding:8px 12px;border-bottom:1px solid #d0d7de;background:#f6f8fa;flex:0 0 auto}
.review-body{padding:16px;overflow:auto;flex:1;font-size:14px;line-height:1.5;color:#24292f}
.review-body h1,.review-body h2,.review-body h3{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}
.review-body h1{font-size:2em;border-bottom:1px solid #d0d7de;padding-bottom:.3em}
.review-body h2{font-size:1.5em;border-bottom:1px solid #d0d7de;padding-bottom:.3em}
.review-body h3{font-size:1.25em}
.review-body p{margin-top:0;margin-bottom:16px}
.review-body blockquote{margin:0 0 16px;padding:0 1em;color:#57606a;border-left:.25em solid #d0d7de}
.review-body ul,.review-body ol{margin-top:0;margin-bottom:16px;padding-left:2em}
.review-body a{color:#0969da;text-decoration:none}
.review-body a:hover{text-decoration:underline}
.review-body.empty{color:#57606a}
.diff-body{padding:12px;overflow:auto;flex:1;display:flex;flex-direction:column}
.diff-body .d2h-code-side-linenumber,.diff-body .d2h-code-linenumber{position:static!important}
.meta{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.badge{display:inline-block;background:#eaeef2;border:1px solid #d0d7de;border-radius:999px;padding:4px 10px;font-size:12px;color:#24292f}
.status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
.hljs{background:#f6f8fa;border-radius:6px;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;padding:12px}
</style>
</head>
<body>
<div class="container">
<h1>Code Review</h1>
${badge}
<div class="tabs">${tabs}</div>
${panes}
</div>
<script>
function _decodeB64Json(b){ try { return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch(e){ return []; } }
const _reviews_b64 = ${JSON.stringify(reviewsB64)};
const tabs=[...document.querySelectorAll('.tab')];
const panes=[...document.querySelectorAll('.pane')];
function activate(i){
  tabs.forEach(t=>t.classList.toggle('active',t.dataset.idx==i));
  panes.forEach(p=>p.classList.toggle('active',p.dataset.idx==i));
}
tabs.forEach(t=>t.addEventListener('click',()=>activate(t.dataset.idx)));
activate(0);
  // Render markdown reviews
  try{
  const reviews=_decodeB64Json(_reviews_b64);
  reviews.forEach((md,i)=>{
    const el=document.querySelector(\`.pane[data-idx="\${i}"] .review-body\`);
    if(el && md){
      const html=DOMPurify.sanitize(marked.parse(md));
      el.innerHTML=html;
      try{
        const blocks=el.querySelectorAll('pre code');
        blocks.forEach((code)=>{
          if (code.classList.contains('language-tsx')) {
            code.classList.remove('language-tsx');
            code.classList.add('language-typescript');
          }
          hljs.highlightElement(code);
        });
      }catch(e){}
    }
  })
}catch(e){}
</script>
</body>
</html>`
  return page
}

export function renderHTMLLive(
  id: string,
  meta?: { aiInvoked?: boolean; aiSucceeded?: boolean; provider?: string; model?: string; status?: string },
  initial?: Array<{ file: string; review: string; diff: string }>
): string {
  const initialJsonLive = JSON.stringify(initial || [])
  const initialB64 = Buffer.from(initialJsonLive, 'utf8').toString('base64')
  const badge = meta
    ? `<div class="meta">
  <span class="badge">AI: ${meta.aiInvoked ? (meta.aiSucceeded ? '参与' : '尝试失败') : '未参与'}</span>
  ${meta.provider ? `<span class="badge">Provider: ${escapeHtml(meta.provider)}</span>` : ''}
  ${meta.model ? `<span class="badge">Model: ${escapeHtml(meta.model)}</span>` : ''}
  ${meta.status ? `<div class="status">${escapeHtml(meta.status)}</div>` : ''}
</div>`
    : ''
  const page = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>code-gate review</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/diff2html/bundles/js/diff2html.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
  *{box-sizing:border-box}
  html,body{height:100%;}
  body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;overflow:hidden}
  .container{width:100%;max-width:100%;margin:0 auto;padding:16px;height:100%;display:flex;flex-direction:column}
.tabs{display:flex;gap:8px;overflow-x:auto;border-bottom:1px solid #d0d7de;flex:0 0 auto;scrollbar-width:thin}
.tab{flex:0 0 auto;background:none;border:none;border-bottom:3px solid transparent;padding:8px 16px;font-size:14px;color:#57606a;cursor:pointer;transition:color 0.2s;white-space:nowrap}
.tab:hover{color:#24292f;border-bottom-color:#d0d7de}
.tab.active{color:#24292f;border-bottom-color:#0969da}
.panes{flex:1;overflow:hidden;position:relative}
.pane{display:none;height:100%;padding-top:12px}
.pane.active{display:block}
.split{display:flex;gap:12px;align-items:stretch;height:100%}
.panel{border:1px solid #d0d7de;border-radius:6px;background:#fff;display:flex;flex-direction:column;flex:1 1 50%;min-width:0;max-width:50%;height:100%}
.panel-title{font-weight:600;padding:8px 12px;border-bottom:1px solid #d0d7de;background:#f6f8fa;flex:0 0 auto}
.review-body{padding:16px;overflow:auto;flex:1;font-size:14px;line-height:1.5;color:#24292f}
.review-body h1,.review-body h2,.review-body h3{margin-top:24px;margin-bottom:16px;font-weight:600;line-height:1.25}
.review-body h1{font-size:2em;border-bottom:1px solid #d0d7de;padding-bottom:.3em}
.review-body h2{font-size:1.5em;border-bottom:1px solid #d0d7de;padding-bottom:.3em}
.review-body h3{font-size:1.25em}
.review-body p{margin-top:0;margin-bottom:16px}
.review-body blockquote{margin:0 0 16px;padding:0 1em;color:#57606a;border-left:.25em solid #d0d7de}
.review-body ul,.review-body ol{margin-top:0;margin-bottom:16px;padding-left:2em}
.review-body a{color:#0969da;text-decoration:none}
.review-body a:hover{text-decoration:underline}
.review-body.empty{color:#57606a}
.diff-body{padding:12px;overflow:auto;flex:1;display:flex;flex-direction:column}
  .diff-body .d2h-code-side-linenumber,.diff-body .d2h-code-linenumber{position:static!important}
  .meta{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  .badge{display:inline-block;background:#eaeef2;border:1px solid #d0d7de;border-radius:999px;padding:4px 10px;font-size:12px;color:#24292f}
  .status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
  .notice{margin:8px 0;color:#57606a}
  .hljs{background:#f6f8fa;border-radius:6px;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;padding:12px}
  </style>
</head>
<body>
<div class="container">
<h1>Code Review <span class="status-text" style="font-size:14px;color:#57606a;font-weight:normal;">后台继续审查中…</span></h1>
${badge}
<div class="tabs"></div>
<div class="panes"></div>
</div>
<script>
const route = ${JSON.stringify('/review/' + id + '/status')};
function _decodeB64Json(b){ try { return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch(e){ return []; } }
const initial=_decodeB64Json(${JSON.stringify(initialB64)});
const tabs=document.querySelector('.tabs');
const panes=document.querySelector('.panes');
const known=new Set();
function activate(i){
  [...tabs.children].forEach((t,idx)=>t.classList.toggle('active',idx===i));
  [...panes.children].forEach((p,idx)=>p.classList.toggle('active',idx===i));
}
function addItem(item){
  if(known.has(item.file))return;
  known.add(item.file);
  const i=[...known].length-1;
  const t=document.createElement('button');
  t.type='button';
  t.className='tab';
  t.title=item.file;
  t.textContent=item.file;
  t.addEventListener('click',()=>activate(i));
  tabs.appendChild(t);
  const p=document.createElement('div');
  p.className='pane';
  const reviewHtml=item.review?DOMPurify.sanitize(marked.parse(item.review)):'<div class=\"review-body empty\">暂无审查内容</div>';
  const parsed=window.Diff2Html.parse(item.diff,{inputFormat:'diff'});
  const diffHtml=window.Diff2Html.html(parsed,{ showFiles:false, matching:'lines' });
  p.innerHTML='<div class=\"split\"><div class=\"panel panel-left\"><div class=\"panel-title\">AI Review</div><div class=\"review-body\">'+reviewHtml+'</div></div><div class=\"panel panel-right\"><div class=\"panel-title\">Diff</div><div class=\"diff-body\">'+diffHtml+'</div></div></div>';
  panes.appendChild(p);
  try{
    const el=p.querySelector('.review-body');
    const blocks=el?el.querySelectorAll('pre code'):[];
    blocks.forEach((code)=>{
      if (code.classList.contains('language-tsx')) {
        code.classList.remove('language-tsx');
        code.classList.add('language-typescript');
      }
      hljs.highlightElement(code);
    });
  }catch(e){}
  if(i===0)activate(0);
  try{
    const aiBadge=document.querySelector('.meta .badge');
    if(aiBadge && aiBadge.textContent && aiBadge.textContent.indexOf('AI:')===0){
      aiBadge.textContent='AI: 参与';
    }
  }catch(e){}
}
async function poll(){
  try{
    const res=await fetch(route);
    if(!res.ok) {
      const n=document.querySelector('.status-text');
      if(n && known.size>0) n.textContent='全部完成';
      return;
    }
    const data=await res.json();
    const list=data && Array.isArray(data.files)?data.files:[];
    list.forEach(it=>{ if(it && it.done) addItem(it); });
    if(data.done) {
      const n=document.querySelector('.status-text');
      if(n) n.textContent='全部完成';
    }
  }catch(e){}
}
setInterval(poll,5000);
try{ initial.forEach(addItem); }catch(e){}
poll();
</script>
</body>
</html>`
  return page
}
