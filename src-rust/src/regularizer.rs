use lykiadb_lang::{
    ast::Span,
    tokenizer::token::{Token, TokenType},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Eq, PartialEq, Serialize, Deserialize, Clone)]
pub struct Tree {
    pub name: String,
    pub children: Option<Vec<Tree>>,
    pub span: Span,
}

fn leaf(name: &str, span: Span) -> Tree {
    Tree { name: name.to_string(), children: None, span }
}

pub struct TreeBuilder;

impl TreeBuilder {
    pub fn token_to_tree(token: Token) -> Tree {
        let span = token.span;
        match token.tok_type {
            TokenType::Identifier { dollar } => leaf(if dollar { "Variable" } else { "Identifier" }, span),
            TokenType::Keyword(_)            => leaf("Keyword", span),
            TokenType::SqlKeyword(_)         => leaf("SqlKeyword", span),
            TokenType::Str                   => leaf("String", span),
            TokenType::Num                   => leaf("Number", span),
            TokenType::True | TokenType::False => leaf("Boolean", span),
            TokenType::Undefined             => leaf("Undefined", span),
            TokenType::Symbol(_)             => leaf("Symbol", span),
            TokenType::Eof                   => leaf("Eof", span),
        }
    }
}
