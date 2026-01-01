import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Config } from '../config/index.js'

export async function serveReview(
  cfg: Config,
  html: string,
  id: string,
  getStatus?: () => any,
  openNow?: boolean
): Promise<string> {
  const port = cfg.ui?.port ?? 5175
  const openCfg = cfg.ui?.openBrowser ?? true
  const route = `/review/${id}`
  const server = http.createServer((req, res) => {
    const u = (req.url || '').split('?')[0]
    if (u === route || u === `${route}/`) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html)
      return
    }
    if (u === `${route}/status` && getStatus) {
      const body = JSON.stringify(getStatus() || {})
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(body)
      return
    }
    res.statusCode = 404
    res.end('Not Found')
  })
  return new Promise((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}${route}`
      const shouldOpen = typeof openNow === 'boolean' ? openNow : openCfg
      if (shouldOpen) openBrowser(url)
      server.unref()
      resolve(url)
    })
    server.on('error', () => {
      const p = path.join(os.tmpdir(), `code-gate-${id}.html`)
      fs.writeFileSync(p, html, 'utf8')
      const url = `file://${p}`
      const shouldOpen = typeof openNow === 'boolean' ? openNow : openCfg
      if (shouldOpen) openBrowser(url)
      resolve(url)
    })
  })
}

export function saveOutput(cfg: Config, id: string, html: string) {
  try {
    const outDir = (cfg.output?.dir && cfg.output.dir.trim()) || '.review-logs'
    const p = path.join(process.cwd(), outDir)
    fs.mkdirSync(p, { recursive: true })
    const fp = path.join(p, `review-${id}.html`)
    fs.writeFileSync(fp, html, 'utf8')
    // process.stdout.write(`已保存审查页面：${fp}\n`)
  } catch (e) {
    // process.stderr.write(`保存审查页面失败：${(e as any)?.message || e}\n`)
  }
}

function openBrowser(url: string) {
  const platform = process.platform
  if (platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true })
  else if (platform === 'win32') spawn('cmd', ['/c', 'start', url], { stdio: 'ignore', detached: true })
  else spawn('xdg-open', [url], { stdio: 'ignore', detached: true })
}

export function triggerOpen(url: string) {
  openBrowser(url)
}
