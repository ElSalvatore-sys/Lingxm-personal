#!/usr/bin/env python3
"""
AI-Powered Polish A1 Vocabulary Generator
Uses Claude API to generate high-quality translations in 9 languages
"""

import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, List
import subprocess

# Check for anthropic package
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


def read_prompt_file(batch_num: int) -> List[str]:
    """Extract English words from prompt markdown file"""
    prompt_file = Path(f"prompts_batch2-25/pl_batch{batch_num:02d}.md")

    if not prompt_file.exists():
        print(f"❌ Prompt file not found: {prompt_file}")
        return []

    with open(prompt_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract numbered word list
    words = []
    for line in content.split('\n'):
        match = re.match(r'^\d+\.\s+(.+)$', line.strip())
        if match:
            words.append(match.group(1).strip())

    return words[:20]


def generate_with_claude(english_word: str, word_num: int, api_key: str) -> Dict:
    """Use Claude API to generate complete vocabulary entry"""

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Generate a complete A1 Polish vocabulary entry for the English word: "{english_word}"

Requirements:
1. Translate "{english_word}" to Polish (the main word)
2. Provide translations in 9 languages: English, German, Arabic, French, Italian, Russian, Spanish, Polish, Persian
3. Write a simple A1-level explanation in each of the 9 languages
4. Create 3 simple example sentences in each of the 9 languages
5. Determine the correct category (verbs, nouns, adjectives, adverbs, numbers, etc.)

Output as JSON with this EXACT structure:
{{
  "polish_word": "the Polish translation of '{english_word}'",
  "category": "verbs|nouns|adjectives|adverbs|numbers",
  "translations": {{
    "en": "English translation",
    "de": "German translation",
    "ar": "Arabic translation in Arabic script",
    "fr": "French translation",
    "it": "Italian translation",
    "ru": "Russian translation in Cyrillic",
    "es": "Spanish translation",
    "pl": "Polish translation",
    "fa": "Persian translation in Persian script"
  }},
  "explanation": {{
    "en": "Simple A1 explanation in English",
    "de": "Einfache A1-Erklärung auf Deutsch",
    "ar": "شرح بسيط بمستوى A1 بالعربية",
    "fr": "Explication simple de niveau A1 en français",
    "it": "Spiegazione semplice di livello A1 in italiano",
    "ru": "Простое объяснение уровня A1 на русском",
    "es": "Explicación simple de nivel A1 en español",
    "pl": "Proste wyjaśnienie na poziomie A1 po polsku",
    "fa": "توضیح ساده سطح A1 به فارسی"
  }},
  "examples": {{
    "en": ["Example 1", "Example 2", "Example 3"],
    "de": ["Beispiel 1", "Beispiel 2", "Beispiel 3"],
    "ar": ["مثال 1", "مثال 2", "مثال 3"],
    "fr": ["Exemple 1", "Exemple 2", "Exemple 3"],
    "it": ["Esempio 1", "Esempio 2", "Esempio 3"],
    "ru": ["Пример 1", "Пример 2", "Пример 3"],
    "es": ["Ejemplo 1", "Ejemplo 2", "Ejemplo 3"],
    "pl": ["Przykład 1", "Przykład 2", "Przykład 3"],
    "fa": ["مثال 1", "مثال 2", "مثال 3"]
  }}
}}

IMPORTANT:
- All examples must use simple A1-level grammar
- Arabic and Persian must use proper RTL scripts
- Russian must use Cyrillic
- Polish must include proper diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Return ONLY valid JSON, no extra text"""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text

        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            word_data = json.loads(json_match.group(0))

            # Build complete entry
            entry = {
                "id": f"universal_a1_{word_num:03d}_pl",
                "word": word_data["polish_word"],
                "category": word_data["category"],
                "frequency_rank": word_num,
                "level": "a1",
                "translations": word_data["translations"],
                "explanation": word_data["explanation"],
                "examples": word_data["examples"],
                "conjugations": None,
                "cefrLevel": "A1"
            }

            return entry

        else:
            raise ValueError("Could not extract JSON from Claude response")

    except Exception as e:
        print(f"❌ Error with Claude API: {e}")
        return None


def generate_batch_with_ai(batch_num: int, start_word: int, api_key: str) -> List[Dict]:
    """Generate complete batch using AI"""

    print(f"\n🤖 Generating Batch {batch_num} with AI (words {start_word}-{start_word+19})...")

    english_words = read_prompt_file(batch_num)

    if len(english_words) != 20:
        print(f"⚠️  Warning: Expected 20 words, got {len(english_words)}")
        english_words = (english_words + ["placeholder"] * 20)[:20]

    batch_data = []

    for i, english_word in enumerate(english_words):
        word_num = start_word + i
        print(f"  [{i+1}/20] Translating: {english_word}...", end=" ", flush=True)

        entry = generate_with_claude(english_word, word_num, api_key)

        if entry:
            batch_data.append(entry)
            print("✅")
        else:
            print("❌")
            # Fallback: create placeholder
            batch_data.append(create_placeholder_entry(english_word, word_num))

    return batch_data


def create_placeholder_entry(english_word: str, word_num: int) -> Dict:
    """Create placeholder entry when AI generation fails"""
    return {
        "id": f"universal_a1_{word_num:03d}_pl",
        "word": f"[TODO: {english_word}]",
        "category": "verbs",
        "frequency_rank": word_num,
        "level": "a1",
        "translations": {lang: f"[TODO: {english_word}]" for lang in ["en", "de", "ar", "fr", "it", "ru", "es", "pl", "fa"]},
        "explanation": {lang: f"[TODO: Explanation]" for lang in ["en", "de", "ar", "fr", "it", "ru", "es", "pl", "fa"]},
        "examples": {lang: ["[TODO]", "[TODO]", "[TODO]"] for lang in ["en", "de", "ar", "fr", "it", "ru", "es", "pl", "fa"]},
        "conjugations": None,
        "cefrLevel": "A1"
    }


def save_batch(batch_num: int, batch_data: List[Dict]) -> Path:
    """Save batch to JSON file"""
    output_file = Path(f"public/data/universal/pl-a1-batch{batch_num}.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)

    return output_file


def validate_batch(batch_file: Path) -> bool:
    """Validate batch file"""
    try:
        with open(batch_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if len(data) != 20:
            print(f"❌ Expected 20 entries, got {len(data)}")
            return False

        # Check for TODO placeholders
        has_todos = False
        for entry in data:
            if "[TODO" in json.dumps(entry):
                has_todos = True

        if has_todos:
            print(f"⚠️  Contains TODO placeholders")

        print(f"✅ Valid JSON with {len(data)} entries")
        return True

    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False


def main():
    """Main execution"""

    print("=" * 80)
    print("🤖 AI-Powered Polish A1 Vocabulary Generator")
    print("=" * 80)

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print("\n❌ ANTHROPIC_API_KEY environment variable not set!")
        print("\n📝 To use this script:")
        print("   export ANTHROPIC_API_KEY='your-api-key-here'")
        print("   python3 scripts/generate-polish-vocab-ai.py")
        print("\n💡 Get your API key at: https://console.anthropic.com/")
        return 1

    if not HAS_ANTHROPIC:
        print("\n❌ anthropic package not installed!")
        print("\n📦 Install it with:")
        print("   pip install anthropic")
        return 1

    # Check directory
    if not Path("prompts_batch2-25").exists():
        print("\n❌ prompts_batch2-25 directory not found!")
        print("Run from project root directory.")
        return 1

    print(f"\n✅ API Key configured")
    print(f"✅ Anthropic package installed")
    print(f"✅ Prompt files found")

    # Confirm before starting
    print("\n" + "=" * 80)
    print("📋 About to generate batches 7-25 (380 words)")
    print("⏱️  Estimated time: ~45-60 minutes")
    print("💰 Estimated cost: ~$2-4 (Claude API usage)")
    print("=" * 80)

    response = input("\n▶️  Continue? [y/N]: ")

    if response.lower() != 'y':
        print("❌ Cancelled by user")
        return 0

    # Generate batches
    generated_batches = []
    failed_batches = []

    for batch_num in range(7, 26):
        start_word = 120 + ((batch_num - 7) * 20) + 1

        try:
            batch_data = generate_batch_with_ai(batch_num, start_word, api_key)
            batch_file = save_batch(batch_num, batch_data)

            if validate_batch(batch_file):
                generated_batches.append(batch_num)
                print(f"✅ Batch {batch_num} complete: {batch_file}")
            else:
                failed_batches.append(batch_num)

        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user!")
            break
        except Exception as e:
            print(f"\n❌ Error in batch {batch_num}: {e}")
            failed_batches.append(batch_num)

    # Summary
    print("\n" + "=" * 80)
    print("📊 GENERATION COMPLETE")
    print("=" * 80)
    print(f"✅ Successfully generated: {len(generated_batches)} batches")
    print(f"❌ Failed: {len(failed_batches)} batches")

    if generated_batches:
        print(f"\n✅ Generated batches: {generated_batches}")
        print(f"\n📁 Files created in: public/data/universal/")

    if failed_batches:
        print(f"\n❌ Failed batches: {failed_batches}")

    print("\n🎯 Next steps:")
    print("1. Review generated files for quality")
    print("2. Validate with: jq . public/data/universal/pl-a1-batch*.json")
    print("3. Commit with: git add public/data/universal/pl-a1-batch*.json")
    print("4. Push to branch: git push origin generation/pl-a1")

    return 0 if not failed_batches else 1


if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user")
        exit(130)
