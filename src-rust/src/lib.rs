use lykiadb_lang::tokenizer::scanner::Scanner;
use regularizer::{Tree, TreeBuilder};
use wasm_bindgen::prelude::*;
mod regularizer;

#[wasm_bindgen]
pub fn tokenize(source: &str) -> Result<JsValue, JsValue> {
    let tokens = match Scanner::scan(source) {
        Ok(t) => t,
        Err(e) => return Err(JsValue::from_str(&format!("{:?}", e))),
    };

    if tokens.is_empty() {
        return Ok(JsValue::NULL);
    }

    let mut root_span = tokens.last().unwrap().span;
    root_span.start = 0;
    root_span.line = 0;

    let token_tree = Tree {
        name: "Program".to_owned(),
        children: Some(tokens.into_iter().map(TreeBuilder::token_to_tree).collect()),
        span: root_span,
    };

    serde_wasm_bindgen::to_value(&token_tree)
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))
}
