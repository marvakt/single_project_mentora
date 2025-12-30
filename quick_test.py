"""Quick test of HuggingFace API"""
import os

# Set API key
os.environ["HUGGINGFACE_API_KEY"] = "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"

print("Testing HuggingFace API...")
print(f"API Key: {os.getenv('HUGGINGFACE_API_KEY')[:15]}...")

try:
    from langchain_huggingface import HuggingFaceEndpoint
    print("✅ Import successful")
    
    llm = HuggingFaceEndpoint(
        repo_id="HuggingFaceH4/zephyr-7b-beta",
        huggingfacehub_api_token=os.getenv("HUGGINGFACE_API_KEY"),
        task="text-generation",
        temperature=0.3,
        max_new_tokens=50
    )
    print("✅ LLM initialized")
    
    response = llm.invoke("What is 2+2?")
    print(f"✅ Response: {response}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
