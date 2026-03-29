use lykiadb_lang::tokenizer::scanner::{ScanError, Scanner};
use lykiadb_lang::parser::{ParseError, Parser};
use regularizer::{Tree, TreeBuilder};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
mod regularizer;

#[derive(Serialize, Deserialize)]
struct ParseErrorInfo {
    from: usize,
    to: usize,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct TokenizeResult {
    tree: Option<Tree>,
    errors: Vec<ParseErrorInfo>,
}

fn from_scan_error(e: &ScanError) -> ParseErrorInfo {
    let span = match e {
        ScanError::UnexpectedCharacter { span } => span,
        ScanError::UnterminatedString { span } => span,
        ScanError::MalformedNumberLiteral { span } => span,
    };
    ParseErrorInfo {
        from: span.start,
        to: if span.end > span.start { span.end } else { span.start + 1 },
        message: e.to_string(),
    }
}

fn from_parse_error(e: &ParseError) -> ParseErrorInfo {
    let span = match e {
        ParseError::UnexpectedToken { token } => token.span,
        ParseError::MissingToken { token, .. } => token.span,
        ParseError::InvalidAssignmentTarget { left } => left.span,
        ParseError::MissingIdentifier { token } => token.span,
        ParseError::EmptyTokenLiteral { token } => token.span,
        ParseError::EmptyTokenLexeme { token } => token.span,
        ParseError::MalformedJoin { span } => *span,
        ParseError::NoTokens => return ParseErrorInfo { from: 0, to: 0, message: e.to_string() },
    };
    ParseErrorInfo {
        from: span.start,
        to: if span.end > span.start { span.end } else { span.start + 1 },
        message: e.to_string(),
    }
}

#[wasm_bindgen]
pub fn tokenize(source: &str) -> JsValue {
    let tokens = match Scanner::scan(source) {
        Err(e) => {
            let result = TokenizeResult { tree: None, errors: vec![from_scan_error(&e)] };
            return serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL);
        }
        Ok(t) => t,
    };

    if tokens.is_empty() {
        let result = TokenizeResult { tree: None, errors: vec![] };
        return serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL);
    }

    // Build the token tree (for syntax highlighting)
    let mut root_span = tokens.last().unwrap().span;
    root_span.start = 0;
    root_span.line = 0;
    let token_tree = Tree {
        name: "Program".to_owned(),
        children: Some(tokens.iter().cloned().map(TreeBuilder::token_to_tree).collect()),
        span: root_span,
    };

    // Run parser to surface parse errors (we discard the AST; we only need errors)
    let errors = match Parser::parse(&tokens) {
        Ok(_) => vec![],
        Err(e) => vec![from_parse_error(&e)],
    };

    let result = TokenizeResult { tree: Some(token_tree), errors };
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}
