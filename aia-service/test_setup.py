"""
Diagnostic script to verify AI service environment setup.
Checks Python version, dependencies, OpenAI API connectivity, and configuration.
"""
import sys
import os

print("Python version:", sys.version)
print("Current directory:", os.getcwd())

try:
    print("\n1. Checking dotenv...")
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ dotenv loaded")

    print("\n2. Checking OpenAI API Key...")
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"✅ API Key found: {api_key[:20]}...")
    else:
        print("❌ No API Key found")
        sys.exit(1)

    print("\n3. Checking OpenAI module...")
    import openai
    print("✅ OpenAI module imported")

    print("\n4. Creating OpenAI client...")
    client = openai.OpenAI(api_key=api_key)
    print("✅ Client created")

    print("\n5. Testing API connection...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "test"}],
        max_tokens=5
    )
    print("✅ API connection successful")

    print("\n6. Checking fine-tuned model...")
    model = os.getenv("FINE_TUNED_MODEL")
    print(f"Model: {model}")

    print("\n✅ ALL CHECKS PASSED - Service should work!")

except (ImportError, ValueError, ConnectionError) as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
