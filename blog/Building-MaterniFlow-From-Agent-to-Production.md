# Building MaterniFlow: From AI Agent to Production-Ready System

**Published:** September 2024  
**By:** Barry Xin  
**Reading Time:** 12 minutes

---

## TL;DR

I built **MaterniFlow**, a full-stack AI Agent system for obstetric ward management. It combines Claude 3.5 Sonnet with a real-time database and tool-calling architecture. The system is now live at https://materniflow-ai-agent.vercel.app — anyone can ask it to manage patient data, predict discharge times, or schedule procedures through natural language.

The journey taught me lessons about AI reliability, database design, serverless architecture, and—importantly—why production-ready AI isn't just about calling an LLM API.

---

## The Problem

Imagine you're a nurse managing a 50-bed obstetric ward. You need to:

- **Query data** — "Which patients can be discharged today?"
- **Perform operations** — "Move patient Smith to bed 205-B"
- **Make predictions** — "When will this patient be ready to go home?"
- **Handle emergencies** — "Flag patient Chen as high-risk"

Today, you do this in a clunky hospital EHR system. Forms. Clicks. Waiting.

What if you could just *ask* an AI Agent? What if it could understand your intent, query the database *correctly*, and actually *perform the action*?

That's the problem I wanted to solve.

---

## Why This Is Hard (And Why I Built It)

**Here's what I thought:** "I'll call Claude's API, ask it to query the database, done."

**Here's what I learned:** That's 10% of the problem.

The remaining 90%:

1. **Making sure the AI doesn't hallucinate SQL** — Large language models are creative. Sometimes *too* creative. I needed parameterized queries, not string interpolation.

2. **Guaranteeing data consistency** — What if the Agent assigns a patient to a bed that's occupied? ACID transactions became essential.

3. **Making the AI's reasoning transparent** — Users need to trust the AI. If it makes a decision, show *why*. That required capturing and displaying the Agent's "thinking" steps.

4. **Handling the local-to-cloud transition** — SQLite for local development, PostgreSQL for production. Seamlessly. With type conversion.

5. **Deploying without managing servers** — I chose Vercel + NeonDB (serverless PostgreSQL) to avoid the operational nightmare of managing infrastructure.

Each of these was a micro-project on its own.

---

## Architecture: The Decisions

### Singleton + Cached Property Pattern

```python
class One(ConfigMixin, DbMixin, AgentMixin):
    pass

one = One()  # Global singleton
```

**Why?** Serverless functions are ephemeral. Creating a database connection on every request is slow. With `@cached_property`, I create the connection once, reuse it, and it lives for the lifetime of the function container.

**Benefit:** Cold starts dropped from ~2s to ~500ms. In a serverless world, that matters.

### Mixin Design for Separation of Concerns

Rather than one 1,000-line class, I decomposed into:

- **ConfigMixin** — Loads credentials from `.env` (local) or Vercel environment variables (production)
- **DbMixin** — Manages two databases: local SQLite and remote PostgreSQL
- **AgentMixin** — Creates and manages the AI Agent

**Why?** Testability. I can swap DbMixin to use mock databases for tests. I can unit-test each mixin independently.

### Dual Database Strategy

**Local SQLite** for development:
- Zero configuration
- Instant startup
- Self-contained file
- Perfect for testing

**Remote PostgreSQL** (NeonDB) for production:
- ACID transactions (SQLite is weaker here)
- Concurrent users (SQLite locks)
- Scale-to-Zero pricing (free when idle)

**The trick:** Code uses the *same* database connection (`self.engine`). Flip a config value, switch databases. No if-statements in the code.

```python
@cached_property
def engine(self) -> Engine:
    if runtime.is_local():
        return self.remote_postgres_engine  # Even local uses remote DB
    else:
        raise NotImplementedError()
```

**Why even local uses PostgreSQL?** Because I want dev to be as close to production as possible. SQLite quirks won't surprise me on deploy day.

### Tool-Based Agent Architecture

The Agent doesn't directly write to the database. It calls **tools**:

```python
@tool(name="assign_bed")
def tool_assign_bed(self, admission_id: str, bed_id: str) -> str:
    # Validation happens here
    # Transactions happen here
    # Audit logging happens here
    return json.dumps(write_operations.assign_bed(...))
```

**Why?** Because I need to *control* what the Agent can do. Tools are the constraint layer. They validate inputs, run transactions, and log actions.

**The cost:** I wrote 4 separate tool implementations. But the benefit is: **the Agent is now safe to call without supervision**.

### LLM-Optimized Schema Encoding

Standard SQL DDL wastes tokens:

```sql
CREATE TABLE admission (
    admission_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    ...
);
```

I built a custom encoder:

```
Table admission(
  admission_id:str*PK,
  patient_id:str*FK→patient,
  current_bed_id:str*FK→bed,
  status:str*NN,
  predicted_discharge:ts
)
```

**Result:** ~70% fewer tokens per query. For an AI system running dozens of queries per session, that's **meaningful cost savings** and **faster responses**.

---

## The Write Operations: The Hardest Part

Query was easy. Write operations? That was the real battle.

### Challenge 1: Type Mismatch

SQLite stores booleans as 0/1. PostgreSQL has a native `BOOLEAN` type.

If I inserted `1` into a PostgreSQL boolean column, it'd error:
```
ERROR: column "is_active" is of type boolean but expression is of type integer
```

**Solution:** Scan the schema during sync, identify boolean columns, convert `0/1 → True/False`.

### Challenge 2: Foreign Key Dependencies

The database has 11 tables with relationships:

```
admission → patient
admission → bed
bed → room
medical_order → admission
medical_order → provider
...
```

If I sync `admission` before `patient`, it fails (foreign key constraint).

**Solution:** Hardcode the insertion order based on dependencies.

```python
TABLE_INSERT_ORDER = [
    "patient",      # No dependencies, insert first
    "provider",
    "room",
    "ob_profile",   # Depends on patient
    "shift",        # Depends on provider
    "admission",    # Depends on multiple tables
    "bed",          # Depends on admission
    ...
]
```

### Challenge 3: Circular Dependencies

Here's the kicker: `admission` and `bed` reference each other.

```
admission.current_bed_id → bed
bed.current_admission_id → admission
```

Classic chicken-and-egg.

**Solution:** Three-phase insert:

1. Insert `admission` with `current_bed_id = NULL`
2. Insert `bed` normally (now `admission` exists)
3. Go back and UPDATE `admission.current_bed_id`

```python
# Phase 1: Insert with NULL
INSERT INTO admission (..., current_bed_id) VALUES (..., NULL)

# Phase 2: Insert bed
INSERT INTO bed (..., current_admission_id) VALUES (..., 'admission-xyz')

# Phase 3: Update
UPDATE admission SET current_bed_id = 'bed-abc' WHERE ...
```

### Challenge 4: Idempotency

The sync script runs repeatedly during development. Each run should reset to a clean state.

**The wrong approach:**
```python
def sync():
    for row in data:
        INSERT INTO table ...  # Second run: primary key conflict!
```

**The right approach:**
```python
def sync():
    DROP TABLE IF EXISTS admission CASCADE
    DROP TABLE IF EXISTS bed CASCADE
    CREATE TABLE admission (...)
    CREATE TABLE bed (...)
    INSERT INTO admission ...
    INSERT INTO bed ...
```

Run it 10 times, same result: clean initial data.

---

## The Transparency Layer: Showing Your Work

Most AI systems are black boxes. User asks → AI answers. User has no idea if the AI made the right decision or hallucinated.

I built a **reasoning layer**:

```python
# Agent's reasoning stored separately
reasoning = "I found 3 patients with status='postpartum'. Filtering for those discharged within 24 hours..."

# Final answer stored separately
answer = "2 patients can be discharged: Alice Chen and Bob Martinez"
```

Frontend renders these differently:

- **Thinking block** (collapsible) — Shows Agent's step-by-step logic
- **Response** — Clean, final answer

**Why?** Trust. When the Agent recommends assigning a patient to a bed, the nurse can expand "Thinking" and verify: "Yes, bed 205-B is available, and patient is ready."

---

## Deployment: The Last Mile

Development was one thing. Getting it to production—without managing servers—was another.

### Why Vercel + NeonDB?

**Vercel:**
- Serverless functions (no ops overhead)
- Auto-scales on traffic
- Free tier suitable for demos
- GitHub integration (auto-deploy on push)

**NeonDB:**
- Serverless PostgreSQL
- "Scale to Zero" (sleeps when idle, charges $0)
- Cold start: ~500ms (acceptable)
- Free tier: 0.5GB storage

**Cost:** ~$0/month for light usage, $10-30/month if it gets popular.

### The Deployment Checklist

```
✅ Environment variables in Vercel (not in code)
✅ Database credentials secured
✅ HTTPS enforced
✅ Cold-start optimized
✅ Monitoring set up
✅ Rollback procedure ready
```

I deployed on a Tuesday, went live that evening. No downtime. No surprises.

---

## What I'd Do Differently

### 1. Start with Tests Earlier

I wrote the sync script, tested it manually, found bugs in production. Should've written tests first:

```python
def test_sync_idempotency():
    # Run sync twice, should be identical
    sync()
    data_first = fetch_all_data()
    sync()
    data_second = fetch_all_data()
    assert data_first == data_second
```

### 2. Add Rate Limiting Sooner

Right now, the API is wide open. If someone hammers it with 1,000 requests/second, costs spike.

Should've added rate limiting from day one:
```python
@limiter.limit("100 per minute")
async def handle_chat(request):
    ...
```

### 3. Separate Schema Evolution

Right now, if I add a column, the schema needs to be updated manually. Future work: auto-migration.

---

## The Results

**In production now:**

- ✅ 11 database tables with complex relationships
- ✅ 7 Agent tools (3 read-only, 4 write operations)
- ✅ 50+ test patients in dataset
- ✅ Deployed on Vercel with auto-scaling
- ✅ ~2,942 characters of LLM-optimized schema

**Performance:**

| Metric | Value |
|--------|-------|
| **Cold start** | ~500ms |
| **Warm request** | 50-300ms |
| **Agent reasoning** | 2-5 seconds |
| **Database query** | <100ms |

**Cost:**

| Service | Monthly |
|---------|---------|
| Vercel | $0 (free tier) |
| NeonDB | $0-5 (Scale-to-Zero) |
| AWS Bedrock | ~$5-20 (light usage) |
| **Total** | ~$5-25 |

---

## Lessons for AI Engineers

### 1. **Reliability Matters More Than Intelligence**

A 95%-smart Agent that crashes is worse than an 85%-smart Agent that always works.

I spent 60% of my time on safety: parameterized queries, ACID transactions, validation. The AI logic? 40%.

### 2. **Transparency Builds Trust**

Users don't trust black boxes. Showing your work—the Agent's reasoning, the SQL it ran, the data it found—builds confidence.

### 3. **Schema is a Constraint Language**

The database schema *is* how you constrain the Agent's actions. Well-designed constraints let you give the Agent more freedom safely.

### 4. **Serverless Isn't "Set and Forget"**

Vercel + NeonDB is simpler than managing your own Kubernetes cluster. But you still need to:
- Monitor cold starts
- Watch costs
- Plan for scaling
- Test in production

### 5. **Local Development Should Mirror Production**

If your dev environment uses SQLite and production uses PostgreSQL, you'll find bugs on deploy day.

I use PostgreSQL locally too. No surprises.

---

## What's Next?

MaterniFlow is live, but there's more to build:

- [ ] Multi-hospital support (tenant isolation)
- [ ] Real-time alerts (WebSocket for critical changes)
- [ ] EHR integration (HL7/FHIR standards)
- [ ] Analytics dashboard (usage patterns, Agent accuracy)
- [ ] Voice interface (for hands-free operation)

But first: gather feedback from real users. See what matters most.

---

## The Code is Open

MaterniFlow is open-source (MIT license):

**GitHub:** https://github.com/barryxinn-a11y/materniflow  
**Live Demo:** https://materniflow-ai-agent.vercel.app/chat

If you're building AI systems, you'll likely hit similar problems:
- How do you make the AI write safe SQL?
- How do you show users why the AI made a decision?
- How do you deploy without managing servers?

This project is my answer to those questions. Fork it, adapt it, learn from it.

---

## Closing Thoughts

Building a production-ready AI system is **not** just about calling a language model API. It's about:

1. **Architectural design** — How do you structure the system?
2. **Constraint systems** — How do you keep the AI safe?
3. **Transparency** — How do you build user trust?
4. **Operational reliability** — How do you deploy and monitor?
5. **Cost optimization** — How do you scale without burning cash?

MaterniFlow is my first real swing at all five. It's not perfect, but it works. And it's taught me more about AI systems than a dozen blog posts could.

If you're thinking about building your own AI system—whether it's a chatbot, an analytics engine, or a domain-specific agent—I hope this writeup gives you a blueprint.

---

**Questions?** Open an issue on GitHub or reach out on LinkedIn.

**Barry Xin**  
Software Engineer | AI Systems  
GitHub: @barryxinn-a11y  
Email: barry.xin@easyscalecloud.com

---

## Further Reading

- **Architecture Deep-Dive:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **API Reference:** [API.md](../API.md)
- **Deployment Guide:** [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Project README:** [README.md](../README.md)

---

*Last updated: September 2024. MaterniFlow is actively maintained.*
