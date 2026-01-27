import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'
import { createJiti } from 'jiti'
import { Config } from './types.js'
import { defaultConfig } from './defaults.js'

export * from './types.js'
export * from './defaults.js'

function findConfigFile(cwd: string): string | undefined {
  const candidates = [
    path.join(cwd, '.codegate.js'),
    path.join(cwd, '.codegate.cjs'),
    path.join(cwd, '.codegate.mjs'),
    path.join(cwd, '.codegate.ts'),
    path.join(cwd, 'code-gate.config.js'),
    path.join(cwd, 'code-gate.config.cjs'),
    path.join(cwd, 'code-gate.config.mjs'),
    path.join(cwd, 'code-gate.config.ts'),
    path.join(cwd, 'code-gate.config.json'),
    path.join(cwd, 'code-gate.config.yaml'),
    path.join(cwd, 'code-gate.config.yml'),
    path.join(cwd, '.code-gaterc'),
    path.join(cwd, '.code-gaterc.json'),
    path.join(cwd, '.code-gaterc.yaml'),
    path.join(cwd, '.code-gaterc.yml')
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return undefined
}

async function readFile(p: string): Promise<any> {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.js' || ext === '.cjs' || ext === '.mjs' || ext === '.ts') {
    const jiti = createJiti(import.meta.url)
    const mod = await jiti.import(p) as any
    return mod?.default ?? mod
  }
  const raw = fs.readFileSync(p, 'utf8')
  if (ext === '.yaml' || ext === '.yml') return yaml.parse(raw)
  return JSON.parse(raw)
}

function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return mergeDeep(target, ...sources);
}

export async function loadConfig(cwd = process.cwd()): Promise<Config> {
  const p = findConfigFile(cwd)
  if (!p) return { ...defaultConfig }
  
  try {
    const user = (await readFile(p)) || {}
    // Deep clone default config to avoid mutation issues
    const base = JSON.parse(JSON.stringify(defaultConfig))
    return mergeDeep(base, user)
  } catch (e) {
    console.error(`Failed to load config from ${p}:`, e)
    return { ...defaultConfig }
  }
}
