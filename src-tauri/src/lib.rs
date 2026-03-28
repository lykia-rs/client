use lykiadb_common::comm::{Message, Request, Response, client::{get_session, Protocol, ClientSession}};
use lykiadb_lang::tokenizer::scanner::Scanner;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct TokenInfo {
    tok_type: String,
    lexeme: Option<String>,
    start: usize,
    end: usize,
    line: u32,
    line_end: u32,
}

#[derive(Serialize, Deserialize)]
struct TokenizeResult {
    success: bool,
    tokens: Vec<TokenInfo>,
    error: Option<ErrorInfo>,
}

#[derive(Serialize, Deserialize)]
struct ErrorInfo {
    message: String,
    start: usize,
    end: usize,
    line: u32,
    line_end: u32,
}

#[derive(Serialize, Deserialize)]
struct QueryResult {
    success: bool,
    data: Option<serde_json::Value>,
    duration: u64,
    error: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ConnectionResult {
    success: bool,
    error: Option<String>,
}

#[tauri::command]
async fn test_connection(address: String) -> Result<ConnectionResult, String> {
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async move {
            let _session = get_session(&address, Protocol::Tcp).await;
            Ok(ConnectionResult {
                success: true,
                error: None,
            })
        })
    })
    .await
    .map_err(|e| format!("Connection error."))?
}

#[tauri::command]
async fn execute_query(address: String, query: String) -> Result<QueryResult, String> {
    tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(async move {
            let mut session = get_session(&address, Protocol::Tcp).await;
            let msg = Message::Request(Request::Run(query));
            
            match session.send_receive(msg).await {
                Ok(Message::Response(Response::Value(value, duration))) | 
                Ok(Message::Response(Response::Program(value, duration))) => {
                    Ok(QueryResult {
                        success: true,
                        data: Some(value),
                        duration,
                        error: None,
                    })
                }
                Ok(Message::Response(Response::Error(err, duration))) => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration,
                        error: Some(format!("{:?}", err)),
                    })
                }
                Err(_) => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration: 0,
                        error: Some("Communication error".to_string()),
                    })
                }
                _ => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration: 0,
                        error: Some("Unexpected response".to_string()),
                    })
                }
            }
        })
    })
    .await
    .map_err(|e| format!("Connection error."))?
}

#[tauri::command]
fn tokenize_query(source: String) -> TokenizeResult {
    match Scanner::scan(&source) {
        Ok(tokens) => {
            let token_infos: Vec<TokenInfo> = tokens
                .iter()
                .map(|t| {
                    let tok_type = match &t.tok_type {
                        lykiadb_lang::tokenizer::token::TokenType::Str => "string".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::Num => "number".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::Undefined => "keyword".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::False => "keyword".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::True => "keyword".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::Identifier { dollar } => {
                            if *dollar { "variable".to_string() } else { "identifier".to_string() }
                        }
                        lykiadb_lang::tokenizer::token::TokenType::Symbol(_) => "symbol".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::Keyword(_) => "keyword".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::SqlKeyword(_) => "sql_keyword".to_string(),
                        lykiadb_lang::tokenizer::token::TokenType::Eof => "eof".to_string(),
                    };
                    TokenInfo {
                        tok_type,
                        lexeme: t.lexeme.clone(),
                        start: t.span.start,
                        end: t.span.end,
                        line: t.span.line,
                        line_end: t.span.line_end,
                    }
                })
                .collect();
            TokenizeResult {
                success: true,
                tokens: token_infos,
                error: None,
            }
        }
        Err(scan_error) => {
            let (message, span) = match &scan_error {
                lykiadb_lang::tokenizer::scanner::ScanError::UnexpectedCharacter { span } => {
                    ("Unexpected character".to_string(), span)
                }
                lykiadb_lang::tokenizer::scanner::ScanError::UnterminatedString { span } => {
                    ("Unterminated string".to_string(), span)
                }
                lykiadb_lang::tokenizer::scanner::ScanError::MalformedNumberLiteral { span } => {
                    ("Malformed number literal".to_string(), span)
                }
            };
            TokenizeResult {
                success: false,
                tokens: vec![],
                error: Some(ErrorInfo {
                    message,
                    start: span.start,
                    end: span.end,
                    line: span.line,
                    line_end: span.line_end,
                }),
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![test_connection, execute_query, tokenize_query])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
