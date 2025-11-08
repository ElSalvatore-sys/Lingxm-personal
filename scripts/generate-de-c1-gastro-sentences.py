#!/usr/bin/env python3
"""
Generate 540 professional German C1 gastronomy sentences with Arabic translations.
180 words × 3 sentences each (technical, sensory, conceptual aspects)
"""

import json
import anthropic
import os
from datetime import datetime

# Load vocabulary
with open('/Users/eldiaploo/Desktop/LingXM-Personal/public/data/jawad/de-gastro.json', 'r', encoding='utf-8') as f:
    vocabulary = json.load(f)

print(f"Loaded {len(vocabulary)} German gastronomy words")

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def generate_sentences_for_word(word_data, start_id):
    """Generate 3 sentences for a single word with Arabic translations"""

    word = word_data['word']
    ar_translation = word_data['translations']['ar']
    de_explanation = word_data['explanation']['de']

    prompt = f"""Generate exactly 3 professional German C1-level gastronomy sentences for the word: {word}

Arabic translation: {ar_translation}
Meaning: {de_explanation}

CRITICAL GRAMMAR RULES:
- NO adjectives as verbs (e.g., "sollte aromatisch" is WRONG)
- NO adjectives as nouns (e.g., "das delikat" is WRONG)
- Use proper German verb conjugations and syntax
- Natural, professional culinary German only

Requirements for each sentence:
- Length: 15-22 words
- Level: C1 complexity (subordinate clauses, sophisticated structures)
- Context: Professional gastronomy (haute cuisine, Sterneküche, molecular gastronomy)
- Must include the target word: {word}

Generate 3 sentences covering these aspects:
1. TECHNICAL: Preparation techniques, kitchen procedures, professional methods
2. SENSORY: Taste, aroma, presentation, texture descriptions
3. CONCEPTUAL: Menu composition, food philosophy, culinary pairing concepts

For each sentence provide:
- German sentence (full)
- Arabic translation (full and accurate)
- Difficulty level: basic, intermediate, or advanced
- Context category: haute_cuisine, wine_pairing, molecular_gastronomy, menu_composition, professional_kitchen, sensory_analysis, culinary_technique, or ingredient_selection

Return ONLY a JSON array with 3 objects, each with this structure:
{{
  "de_full": "German sentence here",
  "ar_full": "Arabic translation here",
  "difficulty": "basic|intermediate|advanced",
  "context": "context_category"
}}

Example of GOOD German sentences (C1 level, natural syntax):
- "Die Reduktion der Sauce erfordert präzises Timing und konstante Temperaturkontrolle, um die gewünschte Konsistenz zu erreichen."
- "Der Sommelier empfiehlt einen burgundischen Pinot Noir, dessen erdige Noten perfekt mit dem Wild harmonieren."
- "Die Komposition des Gerichts vereint klassische französische Techniken mit Elementen der modernen Molekulargastronomie."

NO adjectives as verbs! NO adjectives as nouns! Proper syntax only!"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            temperature=1.0,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract JSON from response
        content = response.content[0].text.strip()

        # Remove markdown code blocks if present
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()

        sentences_data = json.loads(content)

        # Process the 3 sentences
        result = []
        for i, sent_data in enumerate(sentences_data[:3]):
            sentence_id = f"de_c1_gastro_{start_id + i:04d}"

            de_full = sent_data['de_full']
            ar_full = sent_data['ar_full']

            # Extract target word for blank version
            target_word = word.split()[-1] if ' ' in word else word

            # Create blank versions
            de_blank = de_full.replace(word, '_____')
            # For Arabic, replace the translation
            ar_blank = ar_full.replace(ar_translation, '_____')

            # Find target index in German
            de_words = de_full.split()
            target_index = -1
            for idx, w in enumerate(de_words):
                if target_word.lower() in w.lower():
                    target_index = idx
                    break

            # Find target index in Arabic
            ar_words = ar_full.split()
            ar_target_index = -1
            ar_target_word = ar_translation.split()[0] if ' ' in ar_translation else ar_translation
            for idx, w in enumerate(ar_words):
                if ar_target_word in w:
                    ar_target_index = idx
                    break

            sentence_obj = {
                "id": sentence_id,
                "de": {
                    "full": de_full,
                    "blank": de_blank,
                    "target_word": target_word,
                    "target_index": max(0, target_index)
                },
                "ar": {
                    "full": ar_full,
                    "blank": ar_blank,
                    "target_word": ar_translation,
                    "target_index": max(0, ar_target_index)
                },
                "vocabulary_used": [word],
                "difficulty": sent_data.get('difficulty', 'intermediate'),
                "context": sent_data.get('context', 'professional_kitchen'),
                "domain": "gastronomy"
            }

            result.append(sentence_obj)

        return result

    except Exception as e:
        print(f"Error generating sentences for '{word}': {e}")
        return None

# Generate sentences for all words
all_sentences = {}
sentence_counter = 1

print("\nGenerating sentences...")
print("=" * 60)

for idx, word_data in enumerate(vocabulary, 1):
    word = word_data['word']
    print(f"\n[{idx}/180] Processing: {word}")

    sentences = generate_sentences_for_word(word_data, sentence_counter)

    if sentences:
        all_sentences[word] = sentences
        sentence_counter += 3
        print(f"  ✓ Generated 3 sentences (IDs: {sentences[0]['id']} - {sentences[2]['id']})")
    else:
        print(f"  ✗ Failed to generate sentences")

    # Progress indicator
    if idx % 10 == 0:
        print(f"\nProgress: {idx}/180 words ({idx*3} sentences)")
        print("=" * 60)

# Create final output structure
output = {
    "metadata": {
        "language": "de",
        "language_name": "German",
        "source_profile": "jawad",
        "source_level": "C1",
        "source_vocabulary": "public/data/jawad/de-gastro.json",
        "total_words": len(vocabulary),
        "total_sentences": len(all_sentences) * 3,
        "generated_date": datetime.now().strftime("%Y-%m-%d"),
        "version": "1.0",
        "generator": "Claude Code",
        "model": "claude-sonnet-4-5-20250929",
        "domain": "gastronomy",
        "translations": ["ar", "de"],
        "notes": "Professional German C1-level gastronomy sentences with Arabic translations. Covers haute cuisine, wine pairing, molecular gastronomy, and culinary techniques."
    },
    "sentences": all_sentences
}

# Save to file
output_path = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de-specialized/de-c1-gastro-sentences.json'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 60)
print(f"✓ Generation complete!")
print(f"✓ Output saved to: {output_path}")
print(f"✓ Total words: {len(all_sentences)}")
print(f"✓ Total sentences: {len(all_sentences) * 3}")
print("=" * 60)

# Display random examples
import random
print("\n20 Random Examples:")
print("=" * 60)

all_sentence_list = []
for word, sentences in all_sentences.items():
    for sent in sentences:
        all_sentence_list.append((word, sent))

random_samples = random.sample(all_sentence_list, min(20, len(all_sentence_list)))

for word, sent in random_samples:
    print(f"\nWord: {word}")
    print(f"ID: {sent['id']}")
    print(f"DE: {sent['de']['full']}")
    print(f"AR: {sent['ar']['full']}")
    print(f"Context: {sent['context']} | Difficulty: {sent['difficulty']}")
    print("-" * 60)
