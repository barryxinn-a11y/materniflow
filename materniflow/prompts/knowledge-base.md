This is the knowledge base:
<knowledge-base>
<document>
    <title>MaterniFlow System Overview</title>
    <markdown_content>
MaterniFlow is an AI-powered scheduling assistant designed for OB/GYN nurses. It helps manage maternity ward operations through natural language conversations.

## Core Capabilities

1. **Ward Status Query** - Real-time overview of patient census, bed occupancy, and room availability across labor, delivery, postpartum, and NICU units.

2. **Length-of-Stay Prediction** - AI-driven estimates of patient discharge times based on delivery method, complications, and clinical factors.

3. **Room Coordination** - Intelligent bed assignment recommendations considering patient acuity, room type requirements, and turnover predictions.

4. **High-Risk Alerts** - Proactive monitoring of vital signs trends (blood pressure, fetal heart rate, temperature) with automated severity classification.

5. **Order Assistance** - Help scheduling C-sections, inductions, lab tests, and consultations while checking provider availability and room conflicts.

## Architecture Highlights

- AI Agent has read-only database access for safety
- All write operations go through independent Lambda functions with business validation
- The AI can see and speak, but actions are verified before execution
- Full audit trail for AI-assisted orders (marked as "ai_assisted")

## Technical Stack

- Frontend: Next.js + TypeScript (Vercel)
- BFF Layer: FastAPI (Python)
- AI Agent: Strands Agents SDK + AWS Bedrock (Claude)
- Database: PostgreSQL (NeonDB)
- Infrastructure: AWS Lambda + S3 + CDK
    </markdown_content>
</document>
</knowledge-base>
