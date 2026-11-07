#!/usr/bin/env node
/**
 * Inline the dictionaries from i18n.js into client.js.
 *
 * Why this exists: the DSH client module loader resolves `require(spec)`
 * through its module table only — a relative file path is not a spec it can
 * resolve, and `require.async('./client.chunk.js')` is reserved for the
 * revision-hashed chunk names a bundler emits. A plugin that ships `client.js`
 * as plain hand-written source therefore cannot `require('./i18n.js')` at
 * runtime; the dictionaries have to travel inside the bundle.
 *
 * i18n.js stays the single source of truth. This script rewrites the marked
 * block in client.js from it, so translators only ever edit i18n.js.
 *
 * Usage: node scripts/build-i18n.mjs [--check]
 *   --check  exit 1 when client.js is out of date, without writing.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.join(ROOT, 'i18n.js')
const TARGET = path.join(ROOT, 'client.js')

const BEGIN = '    /* >>> generated from i18n.js — do not edit by hand >>> */'
const END = '    /* <<< generated from i18n.js <<< */'

/** Serialize one dictionary as a JS object literal, keeping keys quoted. */
function literal(dictionary) {
  const entries = Object.entries(dictionary).map(([key, value]) =>
    '      ' + JSON.stringify(key) + ': ' + JSON.stringify(value) + ',')
  return '{\n' + entries.join('\n') + '\n    }'
}

const module = await import('file://' + SOURCE.replace(/\\/g, '/'))
const DICTIONARIES = module.DICTIONARIES
const NS = module.NS

if (!DICTIONARIES || typeof DICTIONARIES !== 'object' || !NS) {
  console.error('i18n.js must export NS and DICTIONARIES')
  process.exit(1)
}

const languages = Object.keys(DICTIONARIES)
const block = [
  BEGIN,
  '    const NS = ' + JSON.stringify(NS),
  '    const DICTIONARIES = {',
  languages.map((language) => '      ' + language + ': ' + literal(DICTIONARIES[language]) + ',').join('\n'),
  '    }',
  END,
].join('\n')

const source = fs.readFileSync(TARGET, 'utf8')
const start = source.indexOf(BEGIN)
const end = source.indexOf(END)

if (start < 0 || end < 0) {
  console.error('client.js is missing the generated-dictionary markers')
  process.exit(1)
}

const next = source.slice(0, start) + block + source.slice(end + END.length)
const stale = next !== source

if (process.argv.includes('--check')) {
  if (stale) {
    console.error('client.js is out of date with i18n.js — run: npm run build:i18n')
    process.exit(1)
  }
  console.log('client.js dictionaries are up to date (' + languages.join(', ') + ')')
  process.exit(0)
}

if (stale) {
  fs.writeFileSync(TARGET, next)
  console.log('inlined ' + languages.length + ' dictionaries into client.js (' + languages.join(', ') + ')')
} else {
  console.log('client.js already up to date')
}
