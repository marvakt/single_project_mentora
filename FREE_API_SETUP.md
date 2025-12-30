# FREE API Setup Guide - HuggingFace

## Get Your FREE HuggingFace API Key

### Step 1: Create Account (Free)
1. Go to https://huggingface.co/join
2. Sign up with email (free account)
3. Verify your email

### Step 2: Get API Token
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it: "mentora-rag"
4. Type: "Read"
5. Click "Generate"
6. Copy your token (starts with `hf_...`)

### Step 3: Configure Environment

Add to your `.env` file or export:

```bash
# HuggingFace Configuration (FREE)
HUGGINGFACE_API_KEY="hf_your_token_here"
LLM_PROVIDER="huggingface"
LLM_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
LLM_TEMPERATURE="0.3"
```

Or export directly:
```bash
export HUGGINGFACE_API_KEY="hf_your_token_here"
export LLM_PROVIDER="huggingface"
export LLM_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
```

### Step 4: Install Dependencies

```bash
cd backend/medical_service
pip install -r requirements.txt
```

### Step 5: Test

```bash
# Start service
uvicorn app.main:app --port 8003 --reload

# In another terminal, test
python test_rag_severity.py
```

## FREE Tier Limits

✅ **30,000 requests/month**
✅ **No credit card required**
✅ **Good quality responses**

For 1,000 analyses/month = **$0 cost**

## Alternative: Completely Free Local Model (Ollama)

If you want unlimited usage with no API key:

### Install Ollama
```bash
# Download from https://ollama.ai
# Then run:
ollama pull mistral
```

### Update Code
I can modify the RAG engine to support Ollama if you prefer this option.

## Which Option Do You Want?

1. **HuggingFace** (easiest, cloud-based, free tier)
2. **Ollama** (unlimited, local, requires modification)
3. **Google Gemini** (free tier, good quality)

Let me know and I'll help you set it up!
