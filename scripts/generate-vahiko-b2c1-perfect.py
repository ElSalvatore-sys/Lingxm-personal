#!/usr/bin/env python3
"""
Generate perfect German B2-C1 sentences for Vahiko (urban planning professional)
540 sentences total (3 per word × 180 words)
"""

import json
import os
import re
from typing import List, Dict
from openai import OpenAI

# Configuration
VOCAB_FILE = "public/data/vahiko/de.json"
OUTPUT_FILE = "public/data/sentences/de/de-b2c1-sentences.json"
API_KEY = os.environ.get("OPENAI_API_KEY")
WORDS_PER_BATCH = 20
TOTAL_WORDS = 180

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY)

def validate_grammar(sentence: str) -> tuple[bool, str]:
    """
    Validate German grammar to catch common errors.
    Returns (is_valid, error_message)
    """
    # Check for article + adverb errors (ein niemals, der heute, etc.)
    adverbs = r'\b(niemals|immer|oft|selten|manchmal|gestern|heute|morgen|jetzt|bald|früher|später)\b'
    if re.search(rf'\b(ein|eine|der|die|das)\s+{adverbs}', sentence, re.IGNORECASE):
        return False, f"Article with adverb error: {sentence}"

    # Check for adjective as noun errors (ist wichtig., denke komplex ist, etc.)
    adjectives = r'\b(wichtig|komplex|strategisch|umfassend|gründlich|effektiv|nachhaltig|innovativ|modern|traditionell)\b'
    if re.search(rf'(ist|war|wird|denke|finde|meine)\s+{adjectives}\s*(ist|war|wird|\.)', sentence, re.IGNORECASE):
        return False, f"Adjective as noun error: {sentence}"

    # Check for standalone adjective at end (sentence ending with adjective only)
    if re.search(rf'{adjectives}\s*\.$', sentence, re.IGNORECASE):
        # Make sure it's not "Das Projekt ist wichtig." which is valid
        if not re.search(r'\b(ist|war|wird|sind|waren|werden)\s+\w+\s*\.$', sentence, re.IGNORECASE):
            return False, f"Standalone adjective error: {sentence}"

    return True, ""

def generate_sentences_batch(words: List[Dict], start_idx: int) -> List[Dict]:
    """Generate 3 sentences for each word in the batch"""

    prompt = f"""Generate exactly 3 perfect German B2-C1 sentences for EACH of the following {len(words)} German words.

TARGET USER: Vahiko - urban planning professional, Polish native, studying German

CRITICAL GRAMMAR RULES:
❌ NEVER: "ein niemals", "der heute" (article + adverb)
❌ NEVER: "ist wichtig." as standalone (adjective alone as noun)
❌ NEVER: "denke komplex ist" (adjective as noun)
✅ ALWAYS: "arbeite niemals am Sonntag" (adverb in context)
✅ ALWAYS: "Das Projekt ist wichtig" (adjective after Kopulaverb)
✅ ALWAYS: "das wichtige Projekt" (adjective before noun)

REQUIREMENTS:
- 12-18 words per sentence
- B2-C1 grammar: Konjunktiv II, Passiv, Nebensätze, Relativsätze
- Professional context: urban planning, architecture, city development
- Formal register appropriate for professional communication
- Natural German (nicht steif oder künstlich)
- Include English translation for each sentence

SENTENCE PATTERNS (3 per word):
1. Declarative statement (Präsens/Perfekt/Präteritum)
2. Professional context (work, projects, planning)
3. Question or conditional (Frage oder Bedingungssatz mit wenn/falls)

VOCABULARY TO USE:
{json.dumps(words, ensure_ascii=False, indent=2)}

OUTPUT FORMAT (JSON array):
[
  {{
    "targetWord": "word",
    "sentence": "German sentence 12-18 words using the word naturally",
    "translation": "English translation of the sentence"
  }},
  ...
]

Generate EXACTLY {len(words) * 3} sentences total. Each word must have EXACTLY 3 sentences.
Return ONLY the JSON array, no other text."""

    print(f"\n{'='*60}")
    print(f"Generating sentences for words {start_idx+1}-{start_idx+len(words)} of {TOTAL_WORDS}")
    print(f"{'='*60}")

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=1,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = response.choices[0].message.content.strip()

    # Extract JSON from response (handle markdown code blocks)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    sentences = json.loads(response_text)

    # Validate grammar
    print(f"\nValidating {len(sentences)} sentences...")
    valid_sentences = []
    errors = []

    for sent in sentences:
        is_valid, error = validate_grammar(sent["sentence"])
        if is_valid:
            valid_sentences.append(sent)
        else:
            errors.append(error)
            print(f"❌ GRAMMAR ERROR: {error}")

    if errors:
        print(f"\n⚠️  Found {len(errors)} grammar errors. Regenerating batch...")
        # Recursive retry with error feedback
        return generate_sentences_batch(words, start_idx)

    print(f"✅ All {len(valid_sentences)} sentences passed validation!")

    # Show sample sentences from this batch
    print(f"\nSample sentences from this batch:")
    for i, sent in enumerate(valid_sentences[:3]):
        print(f"  {i+1}. {sent['sentence']}")
        print(f"     → {sent['translation']}")

    return valid_sentences

def main():
    """Main generation pipeline"""
    print("="*60)
    print("GERMAN B2-C1 SENTENCE GENERATION - VAHIKO")
    print("="*60)

    # Load vocabulary
    print(f"\nLoading vocabulary from {VOCAB_FILE}...")
    with open(VOCAB_FILE, 'r', encoding='utf-8') as f:
        vocab = json.load(f)

    print(f"✅ Loaded {len(vocab)} words")

    # Generate sentences in batches
    all_sentences = []

    for i in range(0, len(vocab), WORDS_PER_BATCH):
        batch = vocab[i:i+WORDS_PER_BATCH]
        batch_words = [{"word": w["word"], "translation": w["translations"]["de"]} for w in batch]

        batch_sentences = generate_sentences_batch(batch_words, i)
        all_sentences.extend(batch_sentences)

        print(f"\n📊 Progress: {len(all_sentences)}/{TOTAL_WORDS * 3} sentences generated")

        # Save checkpoint every 60 sentences
        if (i + WORDS_PER_BATCH) % 60 == 0:
            print(f"💾 Checkpoint: Saving {len(all_sentences)} sentences...")
            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    # Final save
    print(f"\n{'='*60}")
    print("SAVING FINAL OUTPUT")
    print(f"{'='*60}")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated {len(all_sentences)} sentences")
    print(f"✅ Saved to: {OUTPUT_FILE}")

    # Final validation
    print(f"\n{'='*60}")
    print("FINAL QUALITY CHECK")
    print(f"{'='*60}")

    word_lengths = [len(s["sentence"].split()) for s in all_sentences]
    avg_length = sum(word_lengths) / len(word_lengths)

    print(f"📊 Total sentences: {len(all_sentences)}")
    print(f"📊 Average sentence length: {avg_length:.1f} words")
    print(f"📊 Min length: {min(word_lengths)} words")
    print(f"📊 Max length: {max(word_lengths)} words")

    # Grammar validation summary
    print(f"\n🔍 Running final grammar validation...")
    errors = []
    for sent in all_sentences:
        is_valid, error = validate_grammar(sent["sentence"])
        if not is_valid:
            errors.append(error)

    if errors:
        print(f"❌ Found {len(errors)} grammar errors:")
        for error in errors[:10]:
            print(f"   - {error}")
    else:
        print(f"✅ ALL SENTENCES PASSED GRAMMAR VALIDATION!")

    print(f"\n{'='*60}")
    print("GENERATION COMPLETE!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
