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

pub struct TreeBuilder;

impl TreeBuilder {
    pub fn token_to_tree(token: Token) -> Tree {
        match token.tok_type {
            TokenType::Identifier { dollar } => Tree {
                name: if dollar {
                    "Variable".to_string()
                } else {
                    "Identifier".to_string()
                },
                children: None,
                span: token.span,
            },
            TokenType::Keyword(_) => Tree {
                name: "Keyword".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::SqlKeyword(_) => Tree {
                name: "SqlKeyword".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::Str => Tree {
                name: "String".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::Num => Tree {
                name: "Number".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::True | TokenType::False => Tree {
                name: "Boolean".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::Undefined => Tree {
                name: "Undefined".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::Symbol(_) => Tree {
                name: "Symbol".to_string(),
                children: None,
                span: token.span,
            },
            TokenType::Eof => Tree {
                name: "Eof".to_string(),
                children: None,
                span: token.span,
            },
        }
    }
}
