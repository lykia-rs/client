use lykiadb_lang::tokenizer::scanner::{ScanError, Scanner};
use regularizer::{Tree, TreeBuilder};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
mod regularizer;

#[derive(Serialize, Deserialize)]
struct ParseError {
    from: usize,
    to: usize,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct TokenizeResult {
    tree: Option<Tree>,
    errors: Vec<ParseError>,
}

fn scan_error_to_parse_error(e: &ScanError) -> ParseError {
    let span = match e {
        ScanError::UnexpectedCharacter { span } => span,
        ScanError::UnterminatedString { span } => span,
        ScanError::MalformedNumberLiteral { span } => span,
    };
    ParseError {
        from: span.start,
        to: if span.end > span.start { span.end } else { span.start + 1 },
        message: e.to_string(),
    }
}

#[wasm_bindgen]
pub fn tokenize(source: &str) -> JsValue {
    let result = match Scanner::scan(source) {
        Ok(tokens) => {
            if tokens.is_empty() {
                TokenizeResult { tree: None, errors: vec![] }
            } else {
                let mut root_span = tokens.last().unwrap().span;
                root_span.start = 0;
                root_span.line = 0;
                let token_tree = Tree {
                    name: "Program".to_owned(),
                    children: Some(tokens.into_iter().map(TreeBuilder::token_to_tree).collect()),
                    span: root_span,
                };
                TokenizeResult { tree: Some(token_tree), errors: vec![] }
            }
        }
        Err(e) => TokenizeResult {
            tree: None,
            errors: vec![scan_error_to_parse_error(&e)],
        },
    };
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}
