import init, { tokenize as wasmTokenize } from '../../lykia-wasm/pkg/lykia_wasm'
import wasmUrl from '../../lykia-wasm/pkg/lykia_wasm_bg.wasm?url'

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

export function initWasm(): Promise<void> {
  if (initialized) return Promise.resolve()
  if (initPromise) return initPromise
  initPromise = init({ module_or_path: wasmUrl }).then(() => {
    initialized = true
  })
  return initPromise
}

export function tokenize(source: string): TokenTree | null {
  if (!initialized) return null
  return wasmTokenize(source) as TokenTree | null
}
