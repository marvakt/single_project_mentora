# 🚀 Quick Start with FREE HuggingFace API

## Step-by-Step Setup (5 minutes)

### 1️⃣ Get FREE API Key

1. **Sign up** (free, no credit card): https://huggingface.co/join
2. **Get token**: https://huggingface.co/settings/tokens
   - Click "New token"
   - Name: "mentora"
   - Type: "Read"
   - Click "Generate"
3. **Copy** your token (starts with `hf_...`)

### 2️⃣ Install Dependencies

```bash
cd backend/medical_service
# Use the updated requirements.txt which has fixed version conflicts
pip install -r requirements.txt
```

### 3️⃣ Setup Environment

**Windows:**
```cmd
setup_huggingface.bat hf_your_token_here
```

**Linux/Mac:**
```bash
chmod +x setup_huggingface.sh
./setup_huggingface.sh hf_your_token_here
```

**Manual Setup:**
```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
export LLM_PROVIDER="huggingface"
export LLM_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
export LLM_TEMPERATURE="0.3"
```

### 4️⃣ Test Setup

```bash
python test_huggingface_setup.py
```

You should see: ✅ ALL CHECKS PASSED!

### 5️⃣ Start Service

```bash
cd backend/medical_service
uvicorn app.main:app --port 8003 --reload
```

### 6️⃣ Test RAG

```bash
# In another terminal
python test_rag_severity.py
```

## ✅ What You Get (FREE)

- 🆓 **30,000 requests/month** (HuggingFace free tier)
- 🧠 **Mistral-7B** AI model (high quality)
- 💰 **$0 cost** for typical usage
- 🚀 **No credit card** required

## 📊 Example Usage

```bash
curl -X POST http://localhost:8003/api/v1/severity/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "Feeling anxious and having trouble sleeping",
    "duration": "2 weeks"
  }'
```

**Response:**
```json
{
  "severity": "Mild",
  "confidence": "High",
  "symptoms_detected": ["Anxiety", "Sleep disturbance"],
  "advice": [
    "Practice 4-7-8 breathing technique",
    "Maintain consistent sleep schedule",
    "Consider journaling thoughts"
  ],
  "recommended_specialist": "counselor",
  "reasoning": "Symptoms indicate mild anxiety with sleep issues...",
  "urgency": "Routine",
  "crisis_detected": false
}
```

## 🆘 Troubleshooting

**"No module named 'langchain'"**
```bash
pip install -r requirements.txt
```

**"HUGGINGFACE_API_KEY not configured"**
```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
```

**"Invalid API key"**
- Check token starts with `hf_`
- Regenerate at https://huggingface.co/settings/tokens

## 📚 Documentation

- Full walkthrough: `walkthrough.md`
- Detailed setup: `FREE_API_SETUP.md`
- API docs: `RAG_SETUP.md`

## 🎉 You're Ready!

Your RAG-powered severity analyzer is now running with a **completely free** AI model!
