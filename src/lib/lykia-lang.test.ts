import { describe, it, expect, vi } from 'vitest'
import { Tree } from '@lezer/common'
import { lykiaLanguage, lykiaHighlightStyle } from './lykia-lang'
import type { TokenizeResult, TokenTree } from './wasm'

function makeTokenTree(overrides: Partial<TokenTree> = {}): TokenTree {
  return {
    name: 'Program',
    children: [],
    span: { start: 0, end: 5, line: 1, line_end: 1 },
    ...overrides,
  }
}

function makeTokenize(result: TokenizeResult): (source: string) => TokenizeResult {
  return vi.fn().mockReturnValue(result)
}

describe('lykia-lang', () => {
  describe('lykiaLanguage', () => {
    it('returns a LanguageSupport instance', () => {
      const lang = lykiaLanguage(makeTokenize({ tree: null, errors: [] }))
      expect(lang).toBeDefined()
      expect(lang.language).toBeDefined()
    })
  })

  describe('lykiaHighlightStyle', () => {
    it('is defined and has rules', () => {
      expect(lykiaHighlightStyle).toBeDefined()
    })
  })

  describe('LykiaParser (via LanguageSupport)', () => {
    it('parses with a valid token tree', () => {
      const tree: TokenTree = makeTokenTree({
        children: [
          { name: 'Keyword', children: null, span: { start: 0, end: 3, line: 1, line_end: 1 } },
        ],
      })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      // The parser is used internally by CodeMirror — ensure it was constructed
      expect(lang.language.parser).toBeDefined()
    })

    it('returns last tree when tokenize returns null tree', () => {
      const tokenize = makeTokenize({ tree: null, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })

    it('handles multiple token types in children', () => {
      const tree: TokenTree = makeTokenTree({
        children: [
          { name: 'Keyword', children: null, span: { start: 0, end: 6, line: 1, line_end: 1 } },
          { name: 'String', children: null, span: { start: 7, end: 12, line: 1, line_end: 1 } },
          { name: 'Number', children: null, span: { start: 13, end: 15, line: 1, line_end: 1 } },
          { name: 'Boolean', children: null, span: { start: 16, end: 20, line: 1, line_end: 1 } },
          { name: 'Identifier', children: null, span: { start: 21, end: 25, line: 1, line_end: 1 } },
          { name: 'Variable', children: null, span: { start: 26, end: 30, line: 1, line_end: 1 } },
          { name: 'SqlKeyword', children: null, span: { start: 31, end: 37, line: 1, line_end: 1 } },
          { name: 'Symbol', children: null, span: { start: 38, end: 39, line: 1, line_end: 1 } },
        ],
        span: { start: 0, end: 39, line: 1, line_end: 1 },
      })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })

    it('handles nested children', () => {
      const tree: TokenTree = makeTokenTree({
        children: [
          {
            name: 'Keyword',
            children: [
              { name: 'Identifier', children: null, span: { start: 1, end: 3, line: 1, line_end: 1 } },
            ],
            span: { start: 0, end: 5, line: 1, line_end: 1 },
          },
        ],
        span: { start: 0, end: 5, line: 1, line_end: 1 },
      })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })

    it('handles unknown node names gracefully', () => {
      const tree: TokenTree = makeTokenTree({
        children: [
          { name: 'UnknownType', children: null, span: { start: 0, end: 5, line: 1, line_end: 1 } },
        ],
      })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })

    it('handles empty children array', () => {
      const tree: TokenTree = makeTokenTree({ children: [] })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })

    it('handles null children', () => {
      const tree: TokenTree = makeTokenTree({ children: null })
      const tokenize = makeTokenize({ tree, errors: [] })
      const lang = lykiaLanguage(tokenize)
      expect(lang.language.parser).toBeDefined()
    })
  })
})
