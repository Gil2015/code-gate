import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function getAssets(): { css: string; js: string } {
  try {
    const d2hCssPath = require.resolve('diff2html/bundles/css/diff2html.min.css')
    const hljsCssPath = require.resolve('highlight.js/styles/github.min.css')
    // We also need marked, dompurify, diff2html, highlight.js scripts for client side if we want to be fully offline.
    // However, the current implementation uses CDN for scripts in some places and inline CSS in others.
    // The user requested robustness. Let's stick to inline CSS for now as implemented before.
    
    const d2hCss = fs.readFileSync(d2hCssPath, 'utf8')
    const hljsCss = fs.readFileSync(hljsCssPath, 'utf8')
    
    return {
      css: `${d2hCss}\n${hljsCss}`,
      js: '' // Scripts are currently CDN based in the template, we can optimize this later to be local too.
    }
  } catch (e) {
    console.error('Failed to load assets', e)
    return { css: '', js: '' }
  }
}

export const CLIENT_SCRIPT = `
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('pre code').forEach((el) => {
    if (el.classList.contains('language-tsx')) {
      el.classList.remove('language-tsx');
      el.classList.add('language-typescript');
    }
    hljs.highlightElement(el);
  });
});
`

export const CUSTOM_CSS = `
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
.badge.red{color:#cf222e;background:#ffebe9;border-color:#ff818266}
.badge.blue{color:#0969da;background:#ddf4ff;border-color:#54aeff66}
.badge.green{color:#1a7f37;background:#dafbe1;border-color:#4ac26b66}
.status{background:#fff8c5;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:12px;color:#4b4b00}
.notice{margin:8px 0;color:#57606a}
.hljs{background:#f6f8fa;border-radius:6px;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;font-size:12px;padding:12px}
`
