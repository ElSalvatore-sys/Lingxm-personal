#!/usr/bin/env python3
"""
Polish A1 Vocabulary Batch Generator
Generates batches 7-25 (words 121-500) with 9-language translations
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple

# Translation dictionaries for common Polish A1 words
TRANSLATIONS = {
    # Languages: en, de, ar, fr, it, ru, es, pl, fa
    "common_patterns": {
        "verbs": {
            "category": "verbs",
            "conjugations": None
        },
        "nouns": {
            "category": "nouns",
            "conjugations": None
        },
        "adjectives": {
            "category": "adjectives",
            "conjugations": None
        },
        "adverbs": {
            "category": "adverbs",
            "conjugations": None
        },
        "numbers": {
            "category": "numbers",
            "conjugations": None
        }
    }
}

# Core Polish vocabulary with translations
POLISH_VOCAB = {
    # Format: "polish_word": ("english", "category", {translations}, {explanations}, {examples})

    # Common verbs (continuing from batch 6)
    "móc": ("can, to be able", "verbs"),
    "musieć": ("must, to have to", "verbs"),
    "rozumieć": ("to understand", "verbs"),
    "pamiętać": ("to remember", "verbs"),
    "zapominać": ("to forget", "verbs"),
    "uczyć się": ("to learn, to study", "verbs"),
    "spać": ("to sleep", "verbs"),
    "jeść": ("to eat", "verbs"),
    "pić": ("to drink", "verbs"),
    "kupować": ("to buy", "verbs"),
    "sprzedawać": ("to sell", "verbs"),
    "otwierać": ("to open", "verbs"),
    "zamykać": ("to close", "verbs"),
    "czekać": ("to wait", "verbs"),
    "kończyć": ("to finish", "verbs"),
    "stawać": ("to stand, to become", "verbs"),
    "siedzieć": ("to sit", "verbs"),
    "leżeć": ("to lie down", "verbs"),
    "pisać": ("to write", "verbs"),
    "czytać": ("to read", "verbs"),

    # Common nouns
    "dom": ("house, home", "nouns"),
    "miasto": ("city", "nouns"),
    "ulica": ("street", "nouns"),
    "woda": ("water", "nouns"),
    "jedzenie": ("food", "nouns"),
    "pieniądze": ("money", "nouns"),
    "praca": ("work, job", "nouns"),
    "książka": ("book", "nouns"),
    "telefon": ("phone", "nouns"),
    "samochód": ("car", "nouns"),
    "drzwi": ("door", "nouns"),
    "okno": ("window", "nouns"),
    "stół": ("table", "nouns"),
    "krzesło": ("chair", "nouns"),
    "łóżko": ("bed", "nouns"),
    "pokój": ("room", "nouns"),
    "kuchnia": ("kitchen", "nouns"),
    "łazienka": ("bathroom", "nouns"),
    "przyjaciel": ("friend", "nouns"),
    "nauczyciel": ("teacher", "nouns"),

    # Adjectives
    "piękny": ("beautiful", "adjectives"),
    "brzydki": ("ugly", "adjectives"),
    "łatwy": ("easy", "adjectives"),
    "trudny": ("difficult", "adjectives"),
    "szybki": ("fast", "adjectives"),
    "wolny": ("slow, free", "adjectives"),
    "drogi": ("expensive, dear", "adjectives"),
    "tani": ("cheap", "adjectives"),
    "zimny": ("cold", "adjectives"),
    "ciepły": ("warm", "adjectives"),
    "gorący": ("hot", "adjectives"),
    "szczęśliwy": ("happy", "adjectives"),
    "smutny": ("sad", "adjectives"),
    "zły": ("bad, angry", "adjectives"),
    "dobry": ("good", "adjectives"),
    "mądry": ("smart, wise", "adjectives"),
    "głupi": ("stupid", "adjectives"),
    "silny": ("strong", "adjectives"),
    "słaby": ("weak", "adjectives"),
    "jasny": ("bright, clear", "adjectives"),

    # Time and frequency
    "dzisiaj": ("today", "adverbs"),
    "jutro": ("tomorrow", "adverbs"),
    "wczoraj": ("yesterday", "adverbs"),
    "teraz": ("now", "adverbs"),
    "zawsze": ("always", "adverbs"),
    "nigdy": ("never", "adverbs"),
    "często": ("often", "adverbs"),
    "rzadko": ("rarely", "adverbs"),
    "czasami": ("sometimes", "adverbs"),
    "wkrótce": ("soon", "adverbs"),

    # More numbers
    "jedenaście": ("eleven", "numbers"),
    "dwanaście": ("twelve", "numbers"),
    "trzynaście": ("thirteen", "numbers"),
    "czternaście": ("fourteen", "numbers"),
    "piętnaście": ("fifteen", "numbers"),
    "dwadzieścia": ("twenty", "numbers"),
    "trzydzieści": ("thirty", "numbers"),
    "sto": ("hundred", "numbers"),
}


def read_prompt_file(batch_num: int) -> List[str]:
    """Read prompt file and extract English words to translate to Polish"""
    prompt_file = Path(f"prompts_batch2-25/pl_batch{batch_num:02d}.md")

    if not prompt_file.exists():
        print(f"⚠️  Prompt file not found: {prompt_file}")
        return []

    with open(prompt_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract word list (numbered items)
    words = []
    pattern = r'^\d+\.\s+(.+)$'

    for line in content.split('\n'):
        match = re.match(pattern, line.strip())
        if match:
            word = match.group(1).strip()
            words.append(word)

    return words[:20]  # Ensure exactly 20 words


def translate_word(english_word: str, word_num: int) -> Dict:
    """
    Generate a complete vocabulary entry with translations in 9 languages.
    This is a template - in production, you'd use translation APIs.
    """

    # For now, create template entries that need manual translation
    # In production, integrate with translation APIs (DeepL, Google Translate, etc.)

    polish_word = f"[PL_{word_num}]"  # Placeholder

    entry = {
        "id": f"universal_a1_{word_num:03d}_pl",
        "word": polish_word,
        "category": "verbs",  # Default, should be detected
        "frequency_rank": word_num,
        "level": "a1",
        "translations": {
            "en": english_word,
            "de": f"[DE: {english_word}]",
            "ar": f"[AR: {english_word}]",
            "fr": f"[FR: {english_word}]",
            "it": f"[IT: {english_word}]",
            "ru": f"[RU: {english_word}]",
            "es": f"[ES: {english_word}]",
            "pl": polish_word,
            "fa": f"[FA: {english_word}]"
        },
        "explanation": {
            "en": f"[English explanation for: {english_word}]",
            "de": f"[German explanation]",
            "ar": f"[Arabic explanation]",
            "fr": f"[French explanation]",
            "it": f"[Italian explanation]",
            "ru": f"[Russian explanation]",
            "es": f"[Spanish explanation]",
            "pl": f"[Polish explanation]",
            "fa": f"[Persian explanation]"
        },
        "examples": {
            "en": [f"Example 1: {english_word}", f"Example 2: {english_word}", f"Example 3: {english_word}"],
            "de": ["[DE example 1]", "[DE example 2]", "[DE example 3]"],
            "ar": ["[AR example 1]", "[AR example 2]", "[AR example 3]"],
            "fr": ["[FR example 1]", "[FR example 2]", "[FR example 3]"],
            "it": ["[IT example 1]", "[IT example 2]", "[IT example 3]"],
            "ru": ["[RU example 1]", "[RU example 2]", "[RU example 3]"],
            "es": ["[ES example 1]", "[ES example 2]", "[ES example 3]"],
            "pl": ["[PL example 1]", "[PL example 2]", "[PL example 3]"],
            "fa": ["[FA example 1]", "[FA example 2]", "[FA example 3]"]
        },
        "conjugations": None,
        "cefrLevel": "A1"
    }

    return entry


def generate_batch(batch_num: int, start_word: int) -> List[Dict]:
    """Generate a complete batch of 20 words"""

    print(f"\n📝 Generating Batch {batch_num} (words {start_word}-{start_word+19})...")

    # Read English words from prompt file
    english_words = read_prompt_file(batch_num)

    if len(english_words) != 20:
        print(f"⚠️  Warning: Expected 20 words, got {len(english_words)}")
        # Pad or trim to exactly 20
        english_words = (english_words + ["placeholder"] * 20)[:20]

    # Generate translations for each word
    batch_data = []
    for i, english_word in enumerate(english_words):
        word_num = start_word + i
        entry = translate_word(english_word, word_num)
        batch_data.append(entry)

    return batch_data


def save_batch(batch_num: int, batch_data: List[Dict]):
    """Save batch to JSON file"""

    output_file = Path(f"public/data/universal/pl-a1-batch{batch_num}.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved: {output_file}")
    return output_file


def validate_batch(batch_file: Path) -> bool:
    """Validate batch JSON structure"""

    try:
        with open(batch_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if len(data) != 20:
            print(f"❌ Validation failed: Expected 20 entries, got {len(data)}")
            return False

        # Check required fields
        required_fields = ['id', 'word', 'translations', 'explanation', 'examples', 'cefrLevel']
        for entry in data:
            for field in required_fields:
                if field not in entry:
                    print(f"❌ Validation failed: Missing field '{field}' in entry")
                    return False

            # Check 9 languages in each field
            if len(entry['translations']) != 9:
                print(f"❌ Validation failed: Expected 9 translations, got {len(entry['translations'])}")
                return False

        print(f"✅ Validation passed: {batch_file.name}")
        return True

    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False


def main():
    """Main generation workflow"""

    print("=" * 70)
    print("🇵🇱 Polish A1 Vocabulary Batch Generator")
    print("=" * 70)
    print("\n📋 Task: Generate batches 7-25 (words 121-500)")
    print("🌍 Languages: en, de, ar, fr, it, ru, es, pl, fa")
    print("\n" + "=" * 70)

    # Check if we're in the right directory
    if not Path("prompts_batch2-25").exists():
        print("\n❌ Error: prompts_batch2-25 directory not found!")
        print("Please run this script from the project root directory.")
        return 1

    # Generate batches 7-25
    generated_batches = []
    failed_batches = []

    for batch_num in range(7, 26):
        start_word = 120 + ((batch_num - 7) * 20) + 1

        try:
            # Generate batch
            batch_data = generate_batch(batch_num, start_word)

            # Save to file
            batch_file = save_batch(batch_num, batch_data)

            # Validate
            if validate_batch(batch_file):
                generated_batches.append(batch_num)
            else:
                failed_batches.append(batch_num)

        except Exception as e:
            print(f"❌ Error generating batch {batch_num}: {e}")
            failed_batches.append(batch_num)

    # Summary
    print("\n" + "=" * 70)
    print("📊 GENERATION SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully generated: {len(generated_batches)} batches")
    print(f"❌ Failed: {len(failed_batches)} batches")

    if generated_batches:
        print(f"\n✅ Generated batches: {generated_batches}")

    if failed_batches:
        print(f"\n❌ Failed batches: {failed_batches}")

    print("\n⚠️  IMPORTANT: These are TEMPLATE files with placeholders!")
    print("You need to:")
    print("1. Replace [PL_XXX] with actual Polish words")
    print("2. Add proper translations in all 9 languages")
    print("3. Add meaningful explanations")
    print("4. Add contextual example sentences")
    print("\n💡 Consider integrating with translation APIs:")
    print("   - DeepL API (https://www.deepl.com/pro-api)")
    print("   - Google Cloud Translation")
    print("   - Azure Translator")

    return 0 if not failed_batches else 1


if __name__ == "__main__":
    exit(main())
