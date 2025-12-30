# RAG Severity Analyzer - Quick Setup Guide

## Prerequisites

- Python 3.8+
- **FREE HuggingFace API key** (30K requests/month, no credit card)

## Setup Steps

### 1. Get FREE HuggingFace API Key

**Quick Steps:**
1. Sign up at https://huggingface.co/join (free)
2. Go to https://huggingface.co/settings/tokens
3. Click "New token" → Name: "mentora" → Type: "Read"
4. Copy your token (starts with `hf_...`)

**See `FREE_API_SETUP.md` for detailed instructions**

### 2. Install Dependencies

```bash
cd backend/medical_service
pip install -r requirements.txt
```

### 3. Configure Environment

**Option A: Environment Variables (Recommended)**
```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
export LLM_PROVIDER="huggingface"
export LLM_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
export LLM_TEMPERATURE="0.3"
```

### 3. Start Service

```bash
uvicorn app.main:app --port 8003 --reload
```

### 4. Test RAG Endpoint

```bash
# Run test script
python test_rag_severity.py

# Or use curl
curl -X POST http://localhost:8003/api/v1/severity/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "Feeling anxious and having trouble sleeping for 2 weeks",
    "duration": "2 weeks"
  }'
```

## API Endpoints

### Analyze Symptoms (New)
`POST /api/v1/severity/analyze-symptoms`

**Request:**
```json
{
  "symptoms": "Natural language description of symptoms",
  "duration": "2 weeks",
  "additional_context": "Optional context"
}
```

**Response:**
```json
{
  "severity": "Mild|Moderate|Severe",
  "confidence": "High|Medium|Low",
  "symptoms_detected": ["symptom1", "symptom2"],
  "advice": ["advice1", "advice2"],
  "recommended_specialist": "counselor|psychologist|psychiatrist",
  "reasoning": "Explanation of assessment",
  "urgency": "Routine|Within 1 week|Immediate",
  "crisis_detected": false,
  "sources": ["file1.txt", "file2.txt"],
  "analysis_id": "..."
}
```

### Analysis History
`GET /api/v1/severity/analysis-history?limit=10`

### Enhanced Questionnaire (Existing)
`POST /api/v1/questionnaire/submit?enable_rag=true`

## Troubleshooting

**"No module named 'langchain'"**
```bash
pip install -r requirements.txt
```

**"OPENAI_API_KEY not configured"**
- Set environment variable with your API key

**"Knowledge base file not found"**
- Ensure all 4 .txt files exist in `app/knowledge_base/`

## Files Created

- ✅ `app/knowledge_base/severity_guidelines.txt`
- ✅ `app/knowledge_base/coping_strategies.txt`
- ✅ `app/knowledge_base/doctor_specializations.txt`
- ✅ `app/knowledge_base/warning_signs.txt`
- ✅ `app/ai_engine/langchain_rag_engine.py`
- ✅ `app/routes/severity.py` (updated)
- ✅ `app/routes/questionnaire.py` (updated)
- ✅ `app/core/config.py` (updated)
- ✅ `requirements.txt` (updated)
- ✅ `test_rag_severity.py`

## Next Steps

1. Get API key (OpenAI or HuggingFace)
2. Install dependencies
3. Set environment variables
4. Start service
5. Run tests
6. Integrate with frontend (optional)

## Cost Estimate

**OpenAI GPT-3.5-turbo:**
- ~$0.003 per analysis
- ~$3/month for 1000 analyses

**HuggingFace:**
- Free tier: 30K requests/month
- $0 cost

## Support

See `walkthrough.md` for detailed documentation.
