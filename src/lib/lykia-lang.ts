import {
  HighlightStyle,
  Language,
  LanguageSupport,
  defineLanguageFacet,
  syntaxHighlighting,
} from '@codemirror/language'
import { Input, NodeType, Parser, PartialParse, Tree } from '@lezer/common'
import { styleTags, tags as t } from '@lezer/highlight'
import type { TokenTree, TokenizeResult } from '@/lib/wasm'

const highlight = styleTags({
  String: t.string,
  Number: t.number,
  Identifier: t.variableName,
  Boolean: t.bool,
  Keyword: t.keyword,
  SqlKeyword: t.tagName,
  Symbol: t.operator,
  Variable: t.special(t.variableName),
  'Null Undefined': t.null,
})

// Node types are defined once at module load — never recreated per-parse
let _nodeId = 0
const makeType = (name: string, top = false) =>
  NodeType.define({ id: _nodeId++, name, top, props: [highlight] })

const TOKEN_TYPES: Record<string, NodeType> = Object.fromEntries(
  ['Program', 'Keyword', 'SqlKeyword', 'String', 'Number', 'Boolean',
   'Identifier', 'Variable', 'Symbol', 'Eof', 'Undefined']
    .map((name) => [name, makeType(name)]),
)
const ROOT_TYPE = makeType('_root', true)

function convertToLezerTree(node: TokenTree): Tree {
  if (!node.span) return Tree.empty
  const children = (node.children ?? [])
    .slice()
    .sort((a, b) => a.span.start - b.span.start)
  return new Tree(
    TOKEN_TYPES[node.name] ?? makeType(node.name),
    children.map(convertToLezerTree),
    children.map((c) => c.span.start - node.span.start),
    node.span.end - node.span.start,
  )
}

class LykiaParser extends Parser {
  private lastTree: Tree = Tree.empty
  constructor(private tokenizeFn: (source: string) => TokenizeResult) {
    super()
  }

  createParse(input: Input): PartialParse {
    const doc = input.read(0, input.length)
    return {
      advance: (): Tree | null => {
        const result = this.tokenizeFn(doc)
        if (result?.tree) {
          this.lastTree = new Tree(
            ROOT_TYPE,
            [convertToLezerTree(result.tree)],
            [result.tree.span.start],
            result.tree.span.end,
          )
        }
        return this.lastTree
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
  tokenizeFn: (source: string) => TokenizeResult,
): LanguageSupport {
  const facet = defineLanguageFacet()
  const parser = new LykiaParser(tokenizeFn)
  const lang = new Language(facet, parser, [], 'lykia')
  return new LanguageSupport(lang, [syntaxHighlighting(lykiaHighlightStyle)])
}
