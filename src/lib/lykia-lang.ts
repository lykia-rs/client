import {
  Language,
  LanguageSupport,
  defineLanguageFacet,
  syntaxHighlighting,
} from '@codemirror/language'
import { Input, NodeType, Parser, PartialParse, Tree } from '@lezer/common'
import { HighlightStyle } from '@codemirror/language'
import { styleTags, tags as t } from '@lezer/highlight'
import type { TokenTree } from '@/lib/wasm'

const tagMap = {
  String: t.string,
  Number: t.number,
  Identifier: t.variableName,
  Boolean: t.bool,
  Keyword: t.keyword,
  SqlKeyword: t.tagName,
  Symbol: t.operator,
  Variable: t.special(t.variableName),
  'Null Undefined': t.null,
} as Record<string, any>

const highlight = styleTags(tagMap)

function convertToLezerTree(node: TokenTree): Tree {
  if (!node.span) return Tree.empty
  const children = (node.children || []).slice().sort(
    (a: TokenTree, b: TokenTree) => a.span.start - b.span.start,
  )
  return new Tree(
    NodeType.define({ id: 0, name: node.name, top: false, props: [highlight] }),
    children.map(convertToLezerTree),
    children.map((c: TokenTree) => c.span.start - node.span.start),
    node.span.end - node.span.start,
  )
}

class LykiaParser extends Parser {
  private lastTree: Tree = Tree.empty
  constructor(private tokenizeFn: (source: string) => TokenTree | null) {
    super()
  }

  createParse(input: Input): PartialParse {
    const doc = input.read(0, input.length)
    return {
      advance: (): Tree | null => {
        try {
          const parsed = this.tokenizeFn(doc)
          if (!parsed) return this.lastTree

          const tree = new Tree(
            NodeType.define({ id: 0, name: '_root', top: true, props: [highlight] }),
            [convertToLezerTree(parsed)],
            [parsed.span.start],
            parsed.span.end,
          )
          this.lastTree = tree
          return tree
        } catch {
          // On parse error, return last successful tree to keep highlighting stable
          return this.lastTree
        }
      },
      parsedPos: input.length,
      stopAt: () => {},
      stoppedAt: input.length,
    }
  }
}

export const lykiaHighlightStyle = HighlightStyle.define([
  { tag: t.string, class: 'cm-string' },
  { tag: t.number, class: 'cm-number' },
  { tag: t.variableName, class: 'cm-identifier' },
  { tag: t.bool, class: 'cm-boolean' },
  { tag: t.keyword, class: 'cm-keyword' },
  { tag: t.tagName, class: 'cm-sqlkeyword' },
  { tag: t.operator, class: 'cm-symbol' },
  { tag: t.special(t.variableName), class: 'cm-variable' },
  { tag: t.null, class: 'cm-null' },
])

export function lykiaLanguage(
  tokenizeFn: (source: string) => TokenTree | null,
): LanguageSupport {
  const facet = defineLanguageFacet()
  const parser = new LykiaParser(tokenizeFn)
  const lang = new Language(facet, parser, [], 'lykia')
  return new LanguageSupport(lang, [syntaxHighlighting(lykiaHighlightStyle)])
}
