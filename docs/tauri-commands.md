# Tauri Commands

## Overview

The Rust backend (src-tauri) exposes two Tauri commands invoked from the frontend via `@tauri-apps/api/core`.

---

## `test_connection`

**Signature**: `invoke('test_connection', { address: string })`

**Input**: `address` — `"host:port"` format (e.g., `"localhost:19191"`).

**Response**:
```json
{ "success": true, "error": null }
```
or
```json
{ "success": false, "error": "Connection refused" }
```

**Called by**:
- App mount (test default connection).
- `useConnections.addConnection()` before adding a new connection.
- `useConnections.testConnection()` for manual re-test.

**Behavior**: Establishes a TCP session to the LykiaDB server. Returns success/failure.

---

## `execute_query`

**Signature**: `invoke('execute_query', { address: string, query: string })`

**Input**:
- `address` — `"host:port"` format.
- `query` — Lykia query string (untrimmed, as entered by user).

**Success response**:
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "Alice" } ],
  "duration": 123,
  "error": null,
  "error_span": null
}
```

**Error response** (query/parse error):
```json
{
  "success": false,
  "data": null,
  "duration": 45,
  "error": "Unexpected token 'FROM': Expected expression",
  "error_span": { "from": 5, "to": 10 }
}
```

**Error response** (communication failure):
```json
{
  "success": false,
  "data": null,
  "duration": 0,
  "error": "Communication error",
  "error_span": null
}
```

**Called by**: `useQueryExecution.executeQuery()` on Execute button click.

**Behavior**:
1. Opens TCP session to `address`.
2. Sends `Request::Run(query)`.
3. On `Response::Value(bson, duration)` → success with BSON data and timing.
4. On `Response::Error(err, duration)` → error with message, optional hint appended (`: hint`), and optional `error_span`.
5. On timeout/connection drop → "Communication error".

### `error_span`

- Present on parse/syntax errors. Absent on runtime/communication errors.
- `from`/`to` are character offsets into the query string.
- Used by `CodeEditor` to highlight the error location with a wavy underline.

### `data` Format

- Serialized from Rust BSON. Arrives as JavaScript values.
- Typically an array of objects (table rows) for SELECT-like queries.
- Can be a single value, object, or null depending on the query type.

---

## WASM Tokenizer

**Module**: `src-wasm/pkg` (compiled from `src-wasm/src/lib.rs`)

**Function**: `tokenize(source: string) → TokenizeResult`

**Response**:
```json
{
  "tree": {
    "name": "Program",
    "children": [
      {
        "name": "Keyword",
        "children": null,
        "span": { "start": 0, "end": 6, "line": 1, "line_end": 1 }
      }
    ],
    "span": { "start": 0, "end": 50, "line": 1, "line_end": 1 }
  },
  "errors": [
    { "from": 20, "to": 25, "message": "Unexpected character '@'" }
  ]
}
```

**Used by**: `CodeEditor` on mount and on every document change for:
- Syntax highlighting (tree → CodeMirror Lezer tree).
- Parse error detection (errors → `parseError` event + error highlighting).

**Token node names**: `Keyword`, `SqlKeyword`, `String`, `Number`, `Boolean`, `Identifier`, `Variable` (dollar-prefixed), `Symbol`, `Null`, `Undefined`, `Eof`.

**Error types**: `UnexpectedCharacter`, `UnterminatedString`, `MalformedNumberLiteral` (scan errors); `UnexpectedToken`, `MissingToken`, `InvalidAssignmentTarget` (parse errors).
