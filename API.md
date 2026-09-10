# API Reference — MaterniFlow

## Overview

MaterniFlow exposes a single primary endpoint: `/api/chat`. This endpoint implements the Vercel AI SDK v5 Data Stream Protocol using Server-Sent Events (SSE) for streaming responses.

**Base URL:** 
- Local: `http://localhost:8000`
- Production: `https://materniflow-ai-agent.vercel.app`

---

## Authentication

Currently, the API is **unauthenticated**. In production, add:

```python
# Future: JWT token validation
if "Authorization" not in request.headers:
    return 401 Unauthorized
```

For local development and public demos, no auth is required.

---

## POST /api/chat

**Description:** Process a user message through the AI Agent and stream back the response.

### Request

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "How many patients are currently admitted?"
          }
        ]
      }
    ],
    "id": "conv-abc123",
    "trigger": "submit-message"
  }'
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Array | Yes | Conversation history |
| `messages[].id` | String | Yes | Unique message ID |
| `messages[].role` | String | Yes | "user" or "assistant" |
| `messages[].parts` | Array | Yes | Message content parts |
| `messages[].parts[].type` | String | Yes | "text" or "reasoning" |
| `messages[].parts[].text` | String | Yes | The message content |
| `id` | String | Yes | Unique conversation ID |
| `trigger` | String | No | "submit-message" or other |

### Response

**Content-Type:** `text/event-stream`

**Format:** Server-Sent Events (SSE)

```
event: 0
data: {"type":"0","index":0}

event: 1
data: {"type":"1","index":0,"text":"The query will involve counting the admission records...","content":"The query will involve..."}

event: 1
data: {"type":"1","index":1,"text":"There are currently 15 patients admitted, distributed across:","content":"There are currently 15 patients..."}

event: d
data: {}
```

### Response Event Types

| Event | Meaning | Example Data |
|-------|---------|--------------|
| `0` | Stream started | `{"type":"0","index":0}` |
| `1` | Text chunk | `{"type":"1","index":1,"text":"...","content":"..."}` |
| `2` | Reasoning chunk | `{"type":"2","index":0,"text":"..."}` |
| `d` | Stream done | `{}` |
| `e` | Error | `{"error":"..."}` |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | String | Event type ("0", "1", "2", "d", "e") |
| `index` | Number | Message index in conversation |
| `text` | String | Streamed text content |
| `content` | String | Full content accumulated so far |
| `error` | String | Error message (only in error events) |

---

## Example Workflows

### Query: "How many postpartum patients?"

**Request:**
```json
{
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "How many postpartum patients are currently hospitalized?"
      }]
    }
  ],
  "id": "conv-123"
}
```

**Agent Reasoning:**
1. Calls `get_database_schema()` → learns about admission table with status field
2. Calls `execute_sql_query("SELECT COUNT(*) FROM admission WHERE status = 'postpartum'")` → gets count
3. Generates response: "There are currently 8 postpartum patients"

**Response Stream:**
```
event: 1
data: {"type":"1","index":0,"text":"Checking current postpartum patient count..."}

event: 1
data: {"type":"1","index":1,"text":"There are currently 8 postpartum patients hospitalized"}

event: d
data: {}
```

---

### Write Operation: "Assign patient to bed"

**Request:**
```json
{
  "messages": [
    {
      "id": "msg-2",
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Move patient Alice Chen to bed 205-B"
      }]
    }
  ],
  "id": "conv-456"
}
```

**Agent Reasoning:**
1. Calls `execute_sql_query()` to find patient and admission
2. Calls `execute_sql_query()` to find bed 205-B
3. Calls `assign_bed(admission_id, bed_id)` → executes transfer with validation
4. Generates response: "Successfully moved Alice Chen to bed 205-B"

**Response Stream:**
```
event: 2
data: {"type":"2","index":0,"text":"I need to find Alice Chen's admission record and locate bed 205-B..."}

event: 1
data: {"type":"1","index":1,"text":"Found Alice Chen in admission ADM-789. Checking bed 205-B availability..."}

event: 1
data: {"type":"1","index":2,"text":"Bed 205-B is available. Completing transfer..."}

event: 1
data: {"type":"1","index":3,"text":"✓ Successfully moved Alice Chen to bed 205-B. Her previous bed (201-A) is now available."}

event: d
data: {}
```

---

## Agent Tools Reference

The Agent has access to these tools:

### Read-Only Tools

#### `get_database_schema()`
Returns the complete database schema in LLM-optimized format.

```python
schema = agent.tools["get_database_schema"]()
# Returns:
"""
Table patient(
  patient_id:str*PK,
  name:str*NN,
  age:int,
  ...
)
Table admission(
  admission_id:str*PK,
  patient_id:str*FK→patient,
  status:str*NN,
  ...
)
...
"""
```

#### `execute_sql_query(sql: str)`
Execute a SELECT query and return results as a formatted table.

```python
result = agent.tools["execute_sql_query"](
  "SELECT patient_id, name, status FROM admission WHERE status = 'in_labor'"
)
# Returns formatted markdown table
```

### Write Operation Tools

#### `assign_bed(admission_id: str, bed_id: str)`
Allocate or transfer a patient to a bed.

**Parameters:**
- `admission_id`: UUID of the admission record
- `bed_id`: UUID of the target bed

**Validation:**
- Bed must exist
- Bed must be available (status = 'available')
- Admission must exist

**Returns:**
```json
{
  "success": true,
  "message": "Patient Smith moved to bed 201-A",
  "old_bed_id": "102-C",
  "new_bed_id": "201-A"
}
```

#### `create_alert(admission_id: str, alert_type: str, severity: str, message: str)`
Create a high-risk patient alert.

**Parameters:**
- `admission_id`: UUID of admission
- `alert_type`: One of `"high_bp"`, `"abnormal_fhr"`, `"fever"`, `"preterm_risk"`
- `severity`: One of `"warning"`, `"critical"`
- `message`: Description (e.g., "BP trending upward: 130→138→145")

**Returns:**
```json
{
  "success": true,
  "alert_id": "ALERT-xyz789",
  "message": "Alert created for patient"
}
```

#### `update_prediction(admission_id: str, predicted_los_hours: int, predicted_discharge_time: str)`
Update discharge prediction for a patient.

**Parameters:**
- `admission_id`: UUID of admission
- `predicted_los_hours`: Length of stay in hours (must be 6-336)
- `predicted_discharge_time`: ISO datetime (e.g., "2024-01-15T10:00:00")

**Returns:**
```json
{
  "success": true,
  "message": "Discharge prediction updated",
  "previous_prediction": "2024-01-14T18:00:00",
  "new_prediction": "2024-01-15T10:00:00"
}
```

#### `create_order(admission_id: str, order_type: str, scheduled_time: str, assigned_provider_id: str, priority: str, assigned_room_id: str, notes: str)`
Create a medical order (procedure, lab test, medication, etc.).

**Parameters:**
- `admission_id`: UUID of admission
- `order_type`: One of `"c_section"`, `"induction"`, `"epidural"`, `"lab_test"`, `"medication"`, `"consult"`
- `scheduled_time`: ISO datetime
- `assigned_provider_id`: UUID of provider
- `priority`: One of `"routine"`, `"urgent"`, `"emergency"` (default: "routine")
- `assigned_room_id`: UUID of room (optional, required for surgeries)
- `notes`: Additional notes (optional)

**Returns:**
```json
{
  "success": true,
  "order_id": "ORD-abc123",
  "message": "C-section scheduled for patient Wang on 2024-01-15 at 09:00"
}
```

---

## Error Handling

### Common Errors

#### 500 Internal Server Error
Backend crashed. Check logs:

```bash
# Local development
tail -f logs/app.log

# Production (Vercel)
vercel logs --project materniflow-ai-agent
```

Common causes:
- Database connection failed
- AWS Bedrock credentials invalid
- Required environment variables missing

#### Agent Timeout
Agent took too long to respond (>30 seconds).

Causes:
- Complex query requiring multiple SQL statements
- Bedrock API latency (rare)

Solution: Simplify the question or increase timeout.

#### Invalid Request
Missing required fields in request JSON.

Check:
- `messages` array is not empty
- Each message has `id`, `role`, `parts`
- Each part has `type` and `text`

---

## Rate Limiting

Currently no rate limiting. In production, add:

```python
# Example: 100 requests per minute per IP
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)
app.state.limiter = limiter
```

---

## Debugging

### Enable Verbose Logging

Set environment variable:
```bash
DEBUG=true pytest run dev
```

This logs:
- All SQL queries executed
- Agent reasoning steps
- Tool calls and results
- Response streaming events

### Test Endpoint with curl

```bash
# Simple query
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "id": "1",
      "role": "user",
      "parts": [{"type": "text", "text": "Hello"}]
    }],
    "id": "test"
  }'
```

### Test with Python

```python
import requests
import json

response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "messages": [{
            "id": "1",
            "role": "user",
            "parts": [{"type": "text", "text": "How many patients?"}]
        }],
        "id": "test"
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(json.loads(line.decode('utf-8')))
```

---

## Deployment Notes

### Environment Variables Required

For `/api/chat` to work, ensure these are set:

```
DB_HOST=<neondb-host>
DB_PORT=5432
DB_USER=<neondb-user>
DB_PASS=<neondb-password>
DB_NAME=neondb
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_DEFAULT_REGION=us-east-1
```

### Monitoring Endpoints (Future)

Plan to add:
- `GET /health` — Returns `{"status": "ok"}`, used for load balancer checks
- `GET /metrics` — Prometheus metrics (response times, error counts, token usage)

---

## API Versions

Currently: **v0** (unstable, breaking changes may occur)

Future:
- **v1** — Stable API with backwards-compatibility guarantee
- **v2** — Multi-tenant support, advanced auth, batching

---

## Support

For API issues, check:
1. Environment variables are set correctly
2. Database connection is working (test with `pytest`)
3. AWS credentials are valid (test Bedrock access)
4. Vercel logs (production deployments)

File an issue: https://github.com/barryxinn-a11y/materniflow/issues
