#!/usr/bin/env python3
"""
Generate 540 German C1 Gastronomy Sentences for Jawad
======================================================

Requirements:
- 15-22 words per sentence
- C1 level complexity (haute cuisine, professional chef language)
- 3 sentences per word (180 words × 3 = 540 sentences):
  1. Technical aspect (preparation/technique)
  2. Sensory aspect (taste, aroma, presentation)
  3. Conceptual aspect (composition, philosophy, gastronomy)
- i+1 principle: 80% known words + 1 advanced culinary concept
"""

import json
import os
import sys
import time
from pathlib import Path
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def load_vocabulary(file_path):
    """Load German gastronomy vocabulary."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_c1_gastro_sentences(word_entry, word_index, total_words):
    """Generate 3 C1-level gastronomy sentences for a word."""

    word = word_entry['word']
    explanation = word_entry['explanation']['de']

    print(f"\n[{word_index + 1}/{total_words}] Generating for: {word}")

    prompt = f"""Generate EXACTLY 3 German C1-level gastronomy sentences using the word "{word}".

WORD: {word}
CONTEXT: {explanation}

REQUIREMENTS:
- C1 complexity: 15-22 words per sentence
- Haute cuisine/professional chef language
- Perfect German grammar (no nonsense!)
- i+1 principle: 80% known words + 1 advanced culinary concept

Generate 3 sentences covering these aspects:

1. TECHNICAL ASPECT (Zubereitung/Technik):
   - Focus on preparation methods, cooking techniques, timing
   - Use professional kitchen vocabulary
   - Example: "Die Reduktion der Sauce erfordert präzises Timing und konstante Temperaturkontrolle, um die gewünschte Konsistenz zu erreichen."

2. SENSORY ASPECT (Sensorik/Geschmack):
   - Focus on taste, aroma, texture, presentation
   - Describe sensory experiences
   - Example: "Das Aroma des {word} entfaltet sich harmonisch mit den begleitenden Komponenten und schafft ein ausgewogenes Geschmackserlebnis."

3. CONCEPTUAL ASPECT (Komposition/Philosophie):
   - Focus on menu composition, culinary philosophy, gastronomy concepts
   - Discuss balance, innovation, tradition
   - Example: "Die Komposition vereint klassische französische Techniken mit modernen Interpretationen der Molekulargastronomie."

CRITICAL QUALITY CHECKS:
❌ NO nonsense like "Das raffiniert muss bringen das exquisit"
❌ NO adjectives used as verbs: "sollte aromatisch das"
❌ NO adjectives used as nouns incorrectly: "die delikat ist"
✅ Perfect grammar, natural flow, professional vocabulary

Return ONLY a JSON array with exactly 3 sentences:
["sentence1", "sentence2", "sentence3"]

Each sentence must use "{word}" naturally and be 15-22 words long."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert German language teacher and professional chef specializing in haute cuisine. You create perfect C1-level German sentences with flawless grammar."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=800
        )

        content = response.choices[0].message.content.strip()

        # Extract JSON from potential markdown code blocks
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()

        sentences = json.loads(content)

        # Validate we got 3 sentences
        if not isinstance(sentences, list) or len(sentences) != 3:
            print(f"  ⚠️  Warning: Expected 3 sentences, got {len(sentences)}")
            return None

        # Validate sentence lengths (15-22 words)
        for i, sent in enumerate(sentences, 1):
            word_count = len(sent.split())
            status = "✅" if 15 <= word_count <= 22 else "⚠️"
            print(f"  {status} Sentence {i}: {word_count} words")

        return sentences

    except Exception as e:
        print(f"  ❌ Error generating sentences: {e}")
        return None

def validate_sentences(all_sentences):
    """Validate generated sentences for quality."""
    print("\n" + "="*70)
    print("QUALITY VALIDATION")
    print("="*70)

    issues = []

    # Check for common nonsense patterns
    nonsense_patterns = [
        r"Das (raffiniert|exquisit|delikat|aromatisch) (ist|muss)",
        r"sollte (aromatisch|raffiniert) das",
        r"die (delikat|exquisit)$",
        r"bringen das (exquisit|raffiniert)"
    ]

    import re

    for pattern in nonsense_patterns:
        for entry in all_sentences:
            for sent in entry['sentences']:
                if re.search(pattern, sent):
                    issues.append(f"Nonsense pattern '{pattern}' in: {sent}")

    # Check sentence lengths
    too_short = 0
    too_long = 0
    perfect = 0

    for entry in all_sentences:
        for sent in entry['sentences']:
            word_count = len(sent.split())
            if word_count < 15:
                too_short += 1
            elif word_count > 22:
                too_long += 1
            else:
                perfect += 1

    total = len(all_sentences) * 3

    print(f"\n📊 Sentence Length Distribution:")
    print(f"   Perfect (15-22 words): {perfect}/{total} ({perfect/total*100:.1f}%)")
    print(f"   Too short (<15 words): {too_short}/{total}")
    print(f"   Too long (>22 words): {too_long}/{total}")

    if issues:
        print(f"\n❌ Found {len(issues)} quality issues:")
        for issue in issues[:10]:  # Show first 10
            print(f"   - {issue}")
    else:
        print(f"\n✅ No nonsense patterns detected!")

    return len(issues) == 0

def save_sentences(sentences, output_path):
    """Save sentences to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {output_path}")

def main():
    # Paths
    vocab_path = Path("/Users/eldiaploo/Desktop/LingXM-Personal/public/data/jawad/de-gastro.json")
    output_path = Path("/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de-specialized/de-c1-gastro-sentences.json")

    print("="*70)
    print("GERMAN C1 GASTRONOMY SENTENCE GENERATION - JAWAD")
    print("="*70)
    print(f"Source: {vocab_path.name}")
    print(f"Target: 540 haute cuisine sentences (180 words × 3)")
    print(f"Level: C1 (15-22 words, professional chef language)")
    print("="*70)

    # Load vocabulary
    vocabulary = load_vocabulary(vocab_path)
    print(f"\n📚 Loaded {len(vocabulary)} gastronomy words")

    # Generate sentences
    all_sentences = []
    failed = 0

    for i, word_entry in enumerate(vocabulary):
        sentences = generate_c1_gastro_sentences(word_entry, i, len(vocabulary))

        if sentences:
            all_sentences.append({
                "word": word_entry['word'],
                "sentences": sentences
            })
        else:
            failed += 1
            print(f"  ⚠️  Skipping due to error")

        # Rate limiting
        time.sleep(0.5)

        # Progress checkpoint every 30 words
        if (i + 1) % 30 == 0:
            print(f"\n{'='*70}")
            print(f"CHECKPOINT: {i + 1}/{len(vocabulary)} words processed")
            print(f"Sentences generated: {len(all_sentences) * 3}")
            print(f"Failed: {failed}")
            print(f"{'='*70}")

    # Final statistics
    print("\n" + "="*70)
    print("GENERATION COMPLETE")
    print("="*70)
    print(f"Total words processed: {len(vocabulary)}")
    print(f"Successful: {len(all_sentences)}")
    print(f"Failed: {failed}")
    print(f"Total sentences: {len(all_sentences) * 3}")

    # Validate
    validate_sentences(all_sentences)

    # Save
    save_sentences(all_sentences, output_path)

    # Show random examples
    import random
    print("\n" + "="*70)
    print("20 RANDOM STERNEKÜCHE EXAMPLES")
    print("="*70)

    sample_entries = random.sample(all_sentences, min(20, len(all_sentences)))
    for entry in sample_entries:
        print(f"\n🔸 {entry['word']}")
        for i, sent in enumerate(entry['sentences'], 1):
            word_count = len(sent.split())
            print(f"   {i}. [{word_count}w] {sent}")

    print("\n" + "="*70)
    print("✅ GENERATION COMPLETE!")
    print("="*70)
    print(f"📁 File: {output_path}")
    print(f"📊 Sentences: {len(all_sentences) * 3}")
    print("="*70)

if __name__ == "__main__":
    main()
