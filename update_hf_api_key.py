#!/usr/bin/env python3
"""
Script to update Hugging Face API key in the environment files
"""
import os
import sys
from pathlib import Path

def update_hf_api_key():
    print("🔧 Hugging Face API Key Updater")
    print("=" * 40)
    
    # Get new API key from user
    new_api_key = input("Enter your Hugging Face API key (starts with 'hf_'): ").strip()
    
    if not new_api_key:
        print("❌ No API key provided. Exiting.")
        return
    
    if not new_api_key.startswith("hf_"):
        print("❌ Invalid API key format. Hugging Face API keys must start with 'hf_'.")
        return
    
    # Define file paths
    backend_env_path = Path("backend/.env")
    medical_env_path = Path("backend/medical_service/.env")
    
    # Update backend/.env
    if backend_env_path.exists():
        with open(backend_env_path, 'r') as f:
            content = f.read()
        
        # Replace or add HUGGINGFACE_API_KEY
        if "HUGGINGFACE_API_KEY=" in content:
            # Update existing
            lines = content.split('\n')
            updated_lines = []
            for line in lines:
                if line.startswith('HUGGINGFACE_API_KEY='):
                    updated_lines.append(f'HUGGINGFACE_API_KEY={new_api_key}')
                else:
                    updated_lines.append(line)
            content = '\n'.join(updated_lines)
        else:
            # Add new line
            content += f'\nHUGGINGFACE_API_KEY={new_api_key}'
        
        with open(backend_env_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated {backend_env_path}")
    
    # Update medical_service/.env
    if medical_env_path.exists():
        with open(medical_env_path, 'r') as f:
            content = f.read()
        
        # Replace or add HUGGINGFACE_API_KEY
        if "HUGGINGFACE_API_KEY=" in content:
            # Update existing
            lines = content.split('\n')
            updated_lines = []
            for line in lines:
                if line.startswith('HUGGINGFACE_API_KEY='):
                    updated_lines.append(f'HUGGINGFACE_API_KEY={new_api_key}')
                else:
                    updated_lines.append(line)
            content = '\n'.join(updated_lines)
        else:
            # Add new line
            content += f'\nHUGGINGFACE_API_KEY={new_api_key}'
        
        with open(medical_env_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated {medical_env_path}")
    
    print("\n✅ Hugging Face API key updated successfully!")
    print("\n📝 To apply changes:")
    print("   1. Restart your Docker containers: docker-compose down && docker-compose up")
    print("   2. The system will now use cloud-based LLM for enhanced responses")

if __name__ == "__main__":
    # Change to the project root directory
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    update_hf_api_key()