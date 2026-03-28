use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Copy, Clone, Eq, PartialEq, Serialize, Deserialize, Hash)]
pub struct Span {
    pub start: usize,
    pub end: usize,
    pub line: u32,
    pub line_end: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputError {
    pub message: String,
    pub hint: String,
    pub error_code: String,
    pub span: Option<Span>,
}

impl InputError {
    pub fn new(message: &str, hint: &str, span: Option<Span>) -> Self {
        InputError {
            message: message.to_owned(),
            hint: hint.to_owned(),
            error_code: "000".to_owned(),
            span,
        }
    }
}
