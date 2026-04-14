import os
import sys
from dotenv import load_dotenv
from google import genai


def mask_key(key: str) -> str:
    if not key:
        return "<missing>"
    if len(key) < 8:
        return "***"
    return f"{key[:6]}...{key[-4:]}"


def load_prompt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def collect_keys():
    raw = [
        ("GEMINI_API_KEY_CONTENT", os.getenv("GEMINI_API_KEY_CONTENT", "").strip()),
        ("GEMINI_API_KEY_DESIGN", os.getenv("GEMINI_API_KEY_DESIGN", "").strip()),
        ("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", "").strip()),
    ]
    keys = []
    seen = set()
    for name, key in raw:
        if key and key not in seen:
            seen.add(key)
            keys.append((name, key))
    return keys


def models_to_probe():
    raw = os.environ.get("GEMINI_FALLBACK_MODELS", "").strip()
    if raw:
        return [m.strip() for m in raw.split(",") if m.strip()]
    primary = os.environ.get("GEMINI_PRIMARY_MODEL", "").strip()
    chain = [
        primary,
        os.environ.get("GEMINI_CONTENT_MODEL", "").strip(),
        os.environ.get("GEMINI_DESIGN_MODEL", "").strip(),
        "gemini-3.1-pro-preview",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
    ]
    seen = set()
    out = []
    for m in chain:
        if m and m not in seen:
            seen.add(m)
            out.append(m)
    return out


def probe_key(name: str, key: str, prompt: str):
    print(f"\n--- Probing {name} ({mask_key(key)}) ---")
    models = models_to_probe()
    client = genai.Client(api_key=key)
    for model in models:
        print(f"  model: {model}")
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            text = (response.text or "").strip().replace("\n", " ")
            if len(text) > 140:
                text = text[:140] + "..."
            print("  STATUS: SUCCESS")
            print(f"  RESPONSE: {text}")
            return
        except Exception as e:
            err = str(e)
            print(f"  STATUS: FAILED — {err[:200]}")
            lowered = err.lower()
            if "permission_denied" in lowered or "403" in lowered:
                print("  HINT: Project blocked or lacks access.")
            elif "429" in lowered or "resource_exhausted" in lowered or "quota" in lowered:
                print("  HINT: Quota/rate limit.")
            elif "404" in lowered or "not found" in lowered:
                print("  HINT: Model id not available for this API — try another in GEMINI_FALLBACK_MODELS.")
            elif "key not valid" in lowered or "invalid" in lowered:
                print("  HINT: Invalid API key.")
    print("  All models failed for this key.")


def main():
    load_dotenv()
    prompt_file = sys.argv[1] if len(sys.argv) > 1 else "gemini_probe_input.txt"
    if not os.path.exists(prompt_file):
        print(f"Prompt file not found: {prompt_file}")
        sys.exit(1)

    prompt = load_prompt(prompt_file)
    if not prompt:
        print("Prompt file is empty.")
        sys.exit(1)

    keys = collect_keys()
    if not keys:
        print("No Gemini keys found in .env")
        sys.exit(1)

    print(f"Loaded prompt from: {prompt_file}")
    print(f"Testing {len(keys)} unique key(s)...")
    for name, key in keys:
        probe_key(name, key, prompt)


if __name__ == "__main__":
    main()
