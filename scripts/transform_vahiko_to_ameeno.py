#!/usr/bin/env python3
"""
Transform Vahiko's en.json to Ameeno's en.json format
Transforms interface languages: pl→fa, de→en
Requires translation of Polish to Persian and German to English
"""

import json
import sys
from anthropic import Anthropic
import os

def translate_text(client, text, source_lang, target_lang):
    """Translate text using Claude API"""
    prompt = f"Translate the following text from {source_lang} to {target_lang}. Return ONLY the translation, no explanations:\n\n{text}"

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text.strip()

def transform_entry(client, entry, index, total):
    """Transform a single vocabulary entry from Vahiko to Ameeno format"""
    print(f"Processing {index}/{total}: {entry['word']}", file=sys.stderr)

    transformed = {
        "word": entry["word"],
        "translations": {},
        "explanation": {},
        "conjugations": entry.get("conjugations"),
        "examples": {}
    }

    # Transform translations: pl→fa, de→en
    if "pl" in entry.get("translations", {}):
        pl_text = entry["translations"]["pl"]
        transformed["translations"]["fa"] = translate_text(client, pl_text, "Polish", "Persian/Farsi")

    if "de" in entry.get("translations", {}):
        de_text = entry["translations"]["de"]
        transformed["translations"]["en"] = translate_text(client, de_text, "German", "English")

    # Transform explanations: pl→fa, de→en
    if "pl" in entry.get("explanation", {}):
        pl_text = entry["explanation"]["pl"]
        transformed["explanation"]["fa"] = translate_text(client, pl_text, "Polish", "Persian/Farsi")

    if "de" in entry.get("explanation", {}):
        de_text = entry["explanation"]["de"]
        transformed["explanation"]["en"] = translate_text(client, de_text, "German", "English")

    # Transform examples: pl→fa, de→en
    if "pl" in entry.get("examples", {}):
        pl_examples = entry["examples"]["pl"]
        fa_examples = []
        for ex in pl_examples:
            fa_examples.append(translate_text(client, ex, "Polish", "Persian/Farsi"))
        transformed["examples"]["fa"] = fa_examples

    if "de" in entry.get("examples", {}):
        de_examples = entry["examples"]["de"]
        en_examples = []
        for ex in de_examples:
            en_examples.append(translate_text(client, ex, "German", "English"))
        transformed["examples"]["en"] = en_examples

    return transformed

def main():
    # Initialize Anthropic client
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    client = Anthropic(api_key=api_key)

    input_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/vahiko/en.json"
    output_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/ameeno/en.json"

    # Read Vahiko's en.json
    print(f"Reading {input_file}...", file=sys.stderr)
    with open(input_file, 'r', encoding='utf-8') as f:
        vahiko_data = json.load(f)

    total = len(vahiko_data)
    print(f"Loaded {total} words from Vahiko's en.json", file=sys.stderr)

    # Transform each entry
    ameeno_data = []
    for i, entry in enumerate(vahiko_data, 1):
        try:
            transformed = transform_entry(client, entry, i, total)
            ameeno_data.append(transformed)
        except Exception as e:
            print(f"Error processing {entry.get('word', 'unknown')}: {e}", file=sys.stderr)
            continue

    # Write to Ameeno's en.json
    print(f"Writing {len(ameeno_data)} words to {output_file}...", file=sys.stderr)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(ameeno_data, f, ensure_ascii=False, indent=2)

    print(f"✓ Successfully created Ameeno en.json with {len(ameeno_data)} words", file=sys.stderr)

if __name__ == "__main__":
    main()
