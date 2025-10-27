#!/usr/bin/env python3
"""
Batch transform Vahiko's en.json to Ameeno's en.json format
Processes multiple entries at once for efficiency
"""

import json
import sys
import os
from anthropic import Anthropic

def create_batch_translation_prompt(entries, source_lang, target_lang):
    """Create a prompt for batch translation"""
    items = []
    for i, entry in enumerate(entries):
        items.append(f"{i}: {entry}")

    items_text = "\n".join(items)

    prompt = f"""Translate the following texts from {source_lang} to {target_lang}.
Return ONLY a JSON object mapping each number to its translation. No explanations.

Texts to translate:
{items_text}

Return format: {{"0": "translation", "1": "translation", ...}}"""

    return prompt

def batch_translate(client, texts, source_lang, target_lang, batch_size=10):
    """Translate multiple texts in batches"""
    all_translations = {}

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        batch_dict = {str(j): text for j, text in enumerate(batch)}

        prompt = f"""Translate these texts from {source_lang} to {target_lang}.
Return a JSON object with the same keys and translated values.

Input:
{json.dumps(batch_dict, ensure_ascii=False, indent=2)}

Return ONLY the JSON object with translations, nothing else."""

        try:
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = message.content[0].text.strip()
            # Remove markdown code blocks if present
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
                result_text = result_text.strip()

            translations = json.loads(result_text)

            # Map back to original indices
            for j, text in enumerate(batch):
                all_translations[i + j] = translations[str(j)]

        except Exception as e:
            print(f"Error in batch {i}-{i+batch_size}: {e}", file=sys.stderr)
            # Fallback: return original text
            for j, text in enumerate(batch):
                all_translations[i + j] = f"[ERROR] {text}"

    return [all_translations[i] for i in range(len(texts))]

def transform_data(client, vahiko_data):
    """Transform all entries from Vahiko to Ameeno format"""

    # Collect all texts that need translation
    pl_translations = [entry["translations"].get("pl", "") for entry in vahiko_data]
    de_translations = [entry["translations"].get("de", "") for entry in vahiko_data]

    pl_explanations = [entry["explanation"].get("pl", "") for entry in vahiko_data]
    de_explanations = [entry["explanation"].get("de", "") for entry in vahiko_data]

    pl_examples_all = []
    de_examples_all = []
    pl_example_counts = []
    de_example_counts = []

    for entry in vahiko_data:
        pl_ex = entry.get("examples", {}).get("pl", [])
        de_ex = entry.get("examples", {}).get("de", [])
        pl_examples_all.extend(pl_ex)
        de_examples_all.extend(de_ex)
        pl_example_counts.append(len(pl_ex))
        de_example_counts.append(len(de_ex))

    print(f"Translating {len(pl_translations)} Polish translations to Persian...", file=sys.stderr)
    fa_translations = batch_translate(client, pl_translations, "Polish", "Persian/Farsi", batch_size=15)

    print(f"Translating {len(de_translations)} German translations to English...", file=sys.stderr)
    en_translations = batch_translate(client, de_translations, "German", "English", batch_size=15)

    print(f"Translating {len(pl_explanations)} Polish explanations to Persian...", file=sys.stderr)
    fa_explanations = batch_translate(client, pl_explanations, "Polish", "Persian/Farsi", batch_size=10)

    print(f"Translating {len(de_explanations)} German explanations to English...", file=sys.stderr)
    en_explanations = batch_translate(client, de_explanations, "German", "English", batch_size=10)

    print(f"Translating {len(pl_examples_all)} Polish examples to Persian...", file=sys.stderr)
    fa_examples_all = batch_translate(client, pl_examples_all, "Polish", "Persian/Farsi", batch_size=20)

    print(f"Translating {len(de_examples_all)} German examples to English...", file=sys.stderr)
    en_examples_all = batch_translate(client, de_examples_all, "German", "English", batch_size=20)

    # Reconstruct the data
    result = []
    fa_ex_idx = 0
    en_ex_idx = 0

    for i, entry in enumerate(vahiko_data):
        transformed = {
            "word": entry["word"],
            "translations": {
                "fa": fa_translations[i],
                "en": en_translations[i]
            },
            "explanation": {
                "fa": fa_explanations[i],
                "en": en_explanations[i]
            },
            "conjugations": entry.get("conjugations"),
            "examples": {
                "fa": fa_examples_all[fa_ex_idx:fa_ex_idx + pl_example_counts[i]],
                "en": en_examples_all[en_ex_idx:en_ex_idx + de_example_counts[i]]
            }
        }

        fa_ex_idx += pl_example_counts[i]
        en_ex_idx += de_example_counts[i]

        result.append(transformed)
        print(f"Processed {i+1}/{len(vahiko_data)}: {entry['word']}", file=sys.stderr)

    return result

def main():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    client = Anthropic(api_key=api_key)

    input_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/vahiko/en.json"
    output_file = "/Users/eldiaploo/Desktop/LingXM-Personal/data/ameeno/en.json"

    print(f"Reading {input_file}...", file=sys.stderr)
    with open(input_file, 'r', encoding='utf-8') as f:
        vahiko_data = json.load(f)

    print(f"Loaded {len(vahiko_data)} words", file=sys.stderr)

    ameeno_data = transform_data(client, vahiko_data)

    print(f"Writing {len(ameeno_data)} words to {output_file}...", file=sys.stderr)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(ameeno_data, f, ensure_ascii=False, indent=2)

    print(f"✓ Successfully created Ameeno en.json with {len(ameeno_data)} words", file=sys.stderr)
    print(f"File size: {os.path.getsize(output_file)} bytes", file=sys.stderr)

if __name__ == "__main__":
    main()
