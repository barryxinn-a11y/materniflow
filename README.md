# MaterniFlow — AI-Powered Obstetric Ward Management System

![Status](https://img.shields.io/badge/status-production-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

MaterniFlow is a full-stack AI Agent system designed to streamline obstetric ward operations. It combines large language models (Claude 3.5 Sonnet via AWS Bedrock) with a real-time database and intelligent tool-calling architecture to enable nurses and administrators to query patient data, predict discharge times, create medical orders, and manage bed assignments through natural language conversation.

**Live Demo:** https://materniflow-ai-agent.vercel.app/chat

---

## Key Features

### 🤖 AI Agent Capabilities

- **Smart Query Engine** — Ask questions in natural language, Agent automatically writes optimized SQL
  - "How many postpartum patients are currently admitted?"
  - "What's the bed occupancy rate by room type?"
  
- **Write Operations** — Agent can perform actions, not just read data
  - `assign_bed()` — Allocate or transfer patients to available beds
  - `create_alert()` — Flag high-risk patients automatically
  - `create_order()` — Schedule procedures (C-section, induction, etc.)
  - `update_prediction()` — Adjust discharge time estimates

- **Transparent Reasoning** — Collapsible "Thinking" blocks show Agent's step-by-step logic
  - Users see which queries ran, what data was found, why decisions were made
  - Builds trust in AI recommendations

### 🏗️ Architecture Highlights

- **Dual Database Strategy**
  - Local SQLite for rapid development and testing
  - Remote PostgreSQL (NeonDB) for production and scaling
  - Seamless switching via configuration

- **Secure Tool Calling**
  - Parameterized SQL prevents injection attacks
  - ACID transactions ensure data consistency
  - Audit trail for all operations (`created_by: "ai_assisted"`)

- **Smart Schema Handling**
  - Auto-generated LLM-optimized database schema representation
  - Reduces token usage by ~70% vs. verbose DDL
  - Encodes constraints and relationships compactly

- **Type-Safe Data Sync**
  - Handles SQLite ↔ PostgreSQL type mismatches (DATETIME → TIMESTAMP, etc.)
  - Solves circular foreign key dependencies (admission ↔ bed)
  - Idempotent sync — run multiple times safely

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 16 + React | Chat UI with real-time streaming |
| **Backend** | FastAPI + Python | Agent orchestration, API endpoints |
| **AI Model** | Claude 3.5 Sonnet | Query understanding, decision-making |
| **Database** | PostgreSQL (NeonDB) | Production data store |
| **Deployment** | Vercel | Serverless hosting with auto-scaling |
| **Agent Framework** | Strands Agents | Tool calling, multi-turn reasoning |

---

## Getting Started

### Local Development

```bash
# Clone and setup
git clone https://github.com/barryxinn-a11y/materniflow.git
cd materniflow

# Install dependencies
mise run inst  # Python + Node.js

# Configure environment
cp .env.example .env
# Add your NeonDB and AWS credentials

# Start dev servers
mise run dev  # Next.js + FastAPI
```

Then visit: http://localhost:3000/chat

### Cloud Deployment

Already deployed on Vercel — just visit: https://materniflow-ai-agent.vercel.app/chat

---

## How It Works

### Query Flow

```
User: "Which patients can be discharged today?"
   ↓
Agent reads database schema
   ↓
Agent writes SQL: SELECT * FROM admission WHERE ...
   ↓
Agent executes query, gets results
   ↓
Agent formats response in natural language
   ↓
User sees answer + "Thinking" block with reasoning
```

### Write Operation Flow

```
User: "Assign patient Smith to bed 201-A"
   ↓
Agent validates: Is bed available? Is patient real?
   ↓
Agent calls assign_bed(admission_id, bed_id)
   ↓
Database transaction: Update admission + bed tables
   ↓
Agent confirms: "Patient Smith moved to bed 201-A"
   ↓
Audit log recorded automatically
```

---

## Key Design Decisions

### Why PostgreSQL + NeonDB?

- **Serverless Scale-to-Zero** — Costs ~$0 when idle (auto-sleep after 5 min)
- **100% PostgreSQL Compatible** — No vendor lock-in
- **Production-Grade** — ACID transactions, full SQL support
- Alternative considered: SQLite (can't scale to multi-user)

### Why Dual Database (Local SQLite + Remote PostgreSQL)?

- **Development Speed** — SQLite is instant, zero-config
- **Production Safety** — PostgreSQL handles real concurrency
- **Testing Isolation** — Tests use local DB, don't touch production
- Both seamlessly switched via one configuration value

### Why Parameterized SQL + Type-Safe Transactions?

- **Security** — Every query uses parameterized format, prevents SQL injection
- **Consistency** — ACID transactions with automatic rollback on errors
- **Auditability** — Every write recorded with `created_by`, timestamp

### Why LLM-Optimized Schema Format?

Standard SQL DDL wastes tokens explaining constraints that could be encoded compactly. Custom encoder:
```
Table admission(
  admission_id:str*PK,
  patient_id:str*FK→patient,
  current_bed_id:str*FK→bed,
  status:str*NN,
  predicted_discharge:ts
)
```

Reduces token usage 70% → saves API costs, faster responses.

---

## Project Statistics

- **11 database tables** with complex relationships
- **4 write operation tools** for Agent
- **50+ test patients** in dataset
- **~2,942 characters** optimized schema representation
- **Deployed** on Vercel with auto-scaling
- **Transparent AI** — Every decision visible to users

---

## What Makes This Production-Ready?

✅ **Data Integrity**
- Parameterized queries (no injection)
- ACID transactions
- Audit trails

✅ **Reliability**
- Idempotent data sync
- Handles edge cases (circular FK dependencies)
- Error recovery

✅ **Security**
- Environment variables for credentials (no hardcoding)
- AWS IAM for Bedrock access control
- Database connection pooling

✅ **Scalability**
- Serverless deployment (auto-scale)
- Stateless API design
- Connection pooling

✅ **Maintainability**
- Clear separation: agent logic, write operations, schema handling
- Type hints throughout
- Comprehensive error handling

---

## Architecture & Implementation Details

### Singleton + Cached Property Pattern

The system uses Python's `@cached_property` decorator for lazy initialization:

```python
class One(ConfigMixin, DbMixin, AgentMixin):
    pass

one = One()  # Global singleton
```

Benefits:
- Expensive resources (DB connections) created on first access
- Subsequent accesses return cached instance
- Efficient in serverless environments (cold starts matter)

### Mixin Design for Separation of Concerns

```python
class ConfigMixin:
    @cached_property
    def config(self) -> Config:
        # Loads from .env or Vercel environment variables
        
class DbMixin:
    @cached_property
    def local_sqlite_engine(self) -> Engine:
        # Connection to development database
    
    @cached_property
    def remote_postgres_engine(self) -> Engine:
        # Connection to production database
    
    @cached_property
    def engine(self) -> Engine:
        # Intelligently selects which database to use

class AgentMixin:
    @cached_property
    def agent(self) -> Agent:
        # Strands Agent with 7 tools
```

### Tool-Based Agent Architecture

The Agent has access to 7 tools:

**Read-Only Tools:**
1. `get_database_schema` — Returns LLM-optimized schema
2. `execute_sql_query` — Runs SELECT queries
3. `write_debug_report` — Documents reasoning

**Write Operation Tools:**
4. `assign_bed` — Manages bed allocations with validation
5. `update_prediction` — Adjusts discharge predictions
6. `create_alert` — Creates high-risk patient alerts
7. `create_order` — Schedules medical procedures

Each tool:
- Has comprehensive docstring for Agent understanding
- Uses parameterized SQL to prevent injection
- Runs within ACID transactions
- Records audit trail

---

## Future Enhancements

- [ ] Multi-hospital deployment with tenant isolation
- [ ] Real-time alerts for critical patient changes
- [ ] Integration with EHR systems (HL7/FHIR)
- [ ] Advanced analytics dashboard
- [ ] Voice interface for hands-free operations

---

## License

MIT — Feel free to use this as reference or base for your own projects.

---

## Contact

**Barry Xin** — barry.xin@easyscalecloud.com

Questions about the architecture or tech choices? Happy to discuss!
