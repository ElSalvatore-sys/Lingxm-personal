#!/usr/bin/env python3
"""
Generate 540 Arabic C1-C2 Business Sentences for Hassan
Target: 180 words × 3 sentences = 540 sentences
"""

import json
import os
import time
import random
from pathlib import Path
from anthropic import Anthropic

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Paths
VOCAB_FILE = Path("public/data/hassan/ar.json")
OUTPUT_FILE = Path("public/data/sentences/ar/ar-c1c2-sentences.json")

# Ensure output directory exists
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

def generate_sentences_for_word(word_data, word_index, total_words):
    """Generate 3 high-quality Arabic C1-C2 sentences for a word."""

    word = word_data["word"]
    en_translation = word_data["translations"]["en"]
    ar_explanation = word_data["explanation"]["ar"]

    print(f"\n[{word_index}/{total_words}] Generating for: {word} ({en_translation})")

    prompt = f"""Generate exactly 3 perfect Arabic C1-C2 business sentences using the word "{word}" ({en_translation}).

REQUIREMENTS:
- 12-20 words per sentence in Arabic
- Professional business Arabic (فصحى)
- Complex grammar: conditional sentences, complex clauses
- Formal register appropriate for business contexts
- i+1 principles: 80% familiar business vocabulary + 1 advanced concept
- Perfect Arabic grammar: correct الجمل المعقدة، gender agreement, case endings
- RTL considerations: proper use of definite article "ال"

SENTENCE TYPES (exactly 3):
1. Declarative statement (past or present tense) - business context
2. Professional/strategic business context - analytical or advisory
3. Conditional sentence OR rhetorical question - strategic planning

CRITICAL RULES:
- NO adjectives used as nouns (e.g., "الاستراتيجي" as a noun)
- NO adjectives used as verbs
- NO adverbs used as nouns
- Use the word "{word}" naturally in professional business contexts
- Each sentence must be grammatically perfect and meaningful

Context: {ar_explanation}

Return ONLY valid JSON in this exact format:
{{
  "sentences": [
    {{"ar": "Arabic sentence 1", "en": "English translation 1"}},
    {{"ar": "Arabic sentence 2", "en": "English translation 2"}},
    {{"ar": "Arabic sentence 3", "en": "English translation 3"}}
  ]
}}"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                temperature=0.8,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()

            # Extract JSON from response (handle markdown code blocks)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            result = json.loads(response_text)
            sentences = result["sentences"]

            if len(sentences) != 3:
                raise ValueError(f"Expected 3 sentences, got {len(sentences)}")

            # Validate each sentence
            for i, sent in enumerate(sentences):
                if "ar" not in sent or "en" not in sent:
                    raise ValueError(f"Sentence {i+1} missing ar or en field")

                ar_words = sent["ar"].split()
                if len(ar_words) < 12 or len(ar_words) > 20:
                    print(f"  ⚠️  Sentence {i+1} has {len(ar_words)} words (target: 12-20)")

            print(f"  ✅ Generated 3 sentences successfully")
            return sentences

        except Exception as e:
            print(f"  ⚠️  Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                print(f"  ❌ Failed after {max_retries} attempts")
                raise

def main():
    print("🇸🇦 Arabic C1-C2 Business Sentence Generation")
    print("=" * 60)

    # Load vocabulary
    print(f"\n📖 Loading vocabulary from {VOCAB_FILE}")
    with open(VOCAB_FILE, "r", encoding="utf-8") as f:
        vocab = json.load(f)

    print(f"   Found {len(vocab)} words")
    print(f"   Target: {len(vocab) * 3} sentences")

    # Generate sentences
    all_sentences = []
    total_words = len(vocab)

    for idx, word_data in enumerate(vocab, 1):
        try:
            sentences = generate_sentences_for_word(word_data, idx, total_words)

            for sent in sentences:
                all_sentences.append({
                    "word": word_data["word"],
                    "sentence": sent["ar"],
                    "translation": sent["en"],
                    "level": "C1-C2",
                    "language": "ar"
                })

            # Progress checkpoint every 20 words
            if idx % 20 == 0:
                print(f"\n{'=' * 60}")
                print(f"📊 Progress: {idx}/{total_words} words | {len(all_sentences)} sentences")
                print(f"{'=' * 60}")

            # Rate limiting (be gentle with API)
            time.sleep(1)

        except Exception as e:
            print(f"❌ Error processing word {word_data['word']}: {e}")
            continue

    # Save output
    print(f"\n💾 Saving {len(all_sentences)} sentences to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    # Show random examples
    print(f"\n{'=' * 60}")
    print("📋 20 RANDOM EXAMPLES:")
    print(f"{'=' * 60}\n")

    sample = random.sample(all_sentences, min(20, len(all_sentences)))
    for i, sent in enumerate(sample, 1):
        print(f"{i}. [{sent['word']}]")
        print(f"   AR: {sent['sentence']}")
        print(f"   EN: {sent['translation']}")
        print()

    # Final stats
    print(f"{'=' * 60}")
    print("✅ GENERATION COMPLETE!")
    print(f"{'=' * 60}")
    print(f"Total sentences: {len(all_sentences)}")
    print(f"Target: 540")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
