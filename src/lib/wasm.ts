import init, { tokenize as wasmTokenize } from '../../src-rust/pkg/src_rust'
import wasmUrl from '../../src-rust/pkg/src_rust_bg.wasm?url'

let initialized = false
let initPromise: Promise<void> | null = null

export interface TokenTree {
  name: string
  children: TokenTree[] | null
  span: {
    start: number
    end: number
    line: number
    line_end: number
  }
}

export interface ParseError {
  from: number
  to: number
  message: string
}

export interface TokenizeResult {
  tree: TokenTree | null
  errors: ParseError[]
}

export function initWasm(): Promise<void> {
  if (initialized) return Promise.resolve()
  if (initPromise) return initPromise
  initPromise = init({ module_or_path: wasmUrl }).then(() => {
    initialized = true
  })
  return initPromise
}

export function tokenize(source: string): TokenizeResult {
  if (!initialized) return { tree: null, errors: [] }
  return wasmTokenize(source) as TokenizeResult
}
