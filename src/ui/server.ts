import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Config } from '../config.js'

export async function serveReview(cfg: Config, html: string): Promise<string> {
  const port = cfg.ui?.port ?? 5175
  const open = cfg.ui?.openBrowser ?? true
  const id = Date.now().toString(36)
  const route = `/review/${id}`
  const server = http.createServer((req, res) => {
    if (req.url && req.url.startsWith(route)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(html)
      return
    }
    res.statusCode = 404
    res.end('Not Found')
  })
  return new Promise((resolve) => {
    server.listen(port, () => {
      const url = `http://localhost:${port}${route}`
      process.stdout.write(`预览地址：${url}\n`)
      if (open) openBrowser(url)
      server.unref()
      resolve(url)
    })
    server.on('error', () => {
      const p = path.join(os.tmpdir(), `code-gate-${id}.html`)
      fs.writeFileSync(p, html, 'utf8')
      const url = `file://${p}`
      process.stdout.write(`预览地址：${url}\n`)
      if (open) openBrowser(url)
      resolve(url)
    })
  })
}

function openBrowser(url: string) {
  const platform = process.platform
  if (platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true })
  else if (platform === 'win32') spawn('cmd', ['/c', 'start', url], { stdio: 'ignore', detached: true })
  else spawn('xdg-open', [url], { stdio: 'ignore', detached: true })
}
