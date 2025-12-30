# setup_huggingface.bat - Windows setup script for HuggingFace
@echo off
echo 🚀 Setting up RAG with FREE HuggingFace API
echo.

if "%1"=="" (
    echo ❌ Please provide your HuggingFace API key
    echo.
    echo Usage:
    echo    setup_huggingface.bat hf_your_token_here
    echo.
    echo 💡 Get free API key:
    echo    1. Sign up: https://huggingface.co/join
    echo    2. Get token: https://huggingface.co/settings/tokens
    exit /b 1
)

set HUGGINGFACE_API_KEY=%1
set LLM_PROVIDER=huggingface
set LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
set LLM_TEMPERATURE=0.3

echo ✅ Environment variables set:
echo    HUGGINGFACE_API_KEY: %HUGGINGFACE_API_KEY:~0,10%...
echo    LLM_PROVIDER: huggingface
echo    LLM_MODEL: mistralai/Mistral-7B-Instruct-v0.2
echo.

echo 🧪 Testing setup...
python test_huggingface_setup.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Setup complete! You can now:
    echo    1. Start service: cd backend\medical_service ^&^& uvicorn app.main:app --port 8003
    echo    2. Run tests: python test_rag_severity.py
) else (
    echo.
    echo ❌ Setup failed. Please check the errors above.
)
