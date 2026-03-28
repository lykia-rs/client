use lykiadb_common::comm::{Message, Request, Response, client::{get_session, Protocol, ClientSession}};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct ErrorSpan {
    from: usize,
    to: usize,
}

#[derive(Serialize, Deserialize)]
struct QueryResult {
    success: bool,
    data: Option<serde_json::Value>,
    duration: u64,
    error: Option<String>,
    error_span: Option<ErrorSpan>,
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
                        error_span: None,
                    })
                }
                Ok(Message::Response(Response::Error(err, duration))) => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration,
                        error: Some(format!("{}: {}", err.message, err.hint)),
                        error_span: err.span.map(|s| ErrorSpan { from: s.start, to: s.end }),
                    })
                }
                Err(_) => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration: 0,
                        error: Some("Communication error".to_string()),
                        error_span: None,
                    })
                }
                _ => {
                    Ok(QueryResult {
                        success: false,
                        data: None,
                        duration: 0,
                        error: Some("Unexpected response".to_string()),
                        error_span: None,
                    })
                }
            }
        })
    })
    .await
    .map_err(|e| format!("Connection error."))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![test_connection, execute_query])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
