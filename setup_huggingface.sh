#!/bin/bash
# setup_huggingface.sh - Quick setup script for HuggingFace

echo "🚀 Setting up RAG with FREE HuggingFace API"
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your HuggingFace API key"
    echo ""
    echo "Usage:"
    echo "   ./setup_huggingface.sh hf_your_token_here"
    echo ""
    echo "💡 Get free API key:"
    echo "   1. Sign up: https://huggingface.co/join"
    echo "   2. Get token: https://huggingface.co/settings/tokens"
    exit 1
fi

API_KEY=$1

# Set environment variables
export HUGGINGFACE_API_KEY="$API_KEY"
export LLM_PROVIDER="huggingface"
export LLM_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
export LLM_TEMPERATURE="0.3"

echo "✅ Environment variables set:"
echo "   HUGGINGFACE_API_KEY: ${API_KEY:0:10}...${API_KEY: -5}"
echo "   LLM_PROVIDER: huggingface"
echo "   LLM_MODEL: mistralai/Mistral-7B-Instruct-v0.2"
echo ""

# Test setup
echo "🧪 Testing setup..."
python test_huggingface_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! You can now:"
    echo "   1. Start service: cd backend/medical_service && uvicorn app.main:app --port 8003"
    echo "   2. Run tests: python test_rag_severity.py"
else
    echo ""
    echo "❌ Setup failed. Please check the errors above."
fi
