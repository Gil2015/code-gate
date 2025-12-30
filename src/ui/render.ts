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
<style>
body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
.container{max-width:1200px;margin:24px auto;padding:0 16px}
.review{background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:16px;margin-bottom:16px;white-space:pre-wrap}
.meta{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.badge{display:inline-block;background:#eaeef2;border:1px solid #d0d7de;border-radius:999px;padding:4px 10px;font-size:12px;color:#24292f}
.status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
</style>
</head>
<body>
<div class="container">
<h1>Code Review</h1>
${badge}
${reviewHtml}
${diffHtml}
</div>
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
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<style>
*{box-sizing:border-box}
html,body{height:100%;}
body{font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;overflow:hidden}
.container{width:100%;max-width:100%;margin:0 auto;padding:16px}
.tabs{display:flex;gap:8px;overflow-x:auto;padding:8px 0;border-bottom:1px solid #d0d7de}
.tab{flex:0 0 auto;background:#f0f2f5;border:1px solid #d0d7de;border-radius:4px;padding:8px 12px;font-size:12px;color:#24292f;cursor:pointer}
.tab.active{background:#0969da;color:#fff;border-color:#0969da}
.pane{display:none;padding-top:12px}
.pane.active{display:block}
.split{display:flex;gap:12px;align-items:stretch}
.panel{border:1px solid #d0d7de;border-radius:6px;background:#fff;display:flex;flex-direction:column;height:calc(100vh - 180px);flex:1 1 50%;min-width:0;max-width:50%}
.panel-title{font-weight:600;padding:8px 12px;border-bottom:1px solid #d0d7de;background:#f6f8fa}
.review-body{padding:12px;overflow:auto}
.review-body.empty{color:#57606a}
.diff-body{padding:12px;overflow:auto}
.diff-body .d2h-code-side-linenumber,.diff-body .d2h-code-linenumber{position:static!important}
.meta{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.badge{display:inline-block;background:#eaeef2;border:1px solid #d0d7de;border-radius:999px;padding:4px 10px;font-size:12px;color:#24292f}
.status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
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
  const reviews=${JSON.stringify(files.map(f=>f.review || ''))};
  reviews.forEach((md,i)=>{
    const el=document.querySelector(\`.pane[data-idx="\${i}"] .review-body\`);
    if(el && md){
      const html=DOMPurify.sanitize(marked.parse(md));
      el.innerHTML=html;
    }
  })
}catch(e){}
</script>
</body>
</html>`
  return page
}
