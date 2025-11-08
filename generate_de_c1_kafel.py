#!/usr/bin/env python3
"""
German C1 Sentence Generator for Kafel (IT Professional)
Generates 540 high-quality C1 sentences (3 per word × 180 words)
"""

import json
import os
import re
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def load_vocabulary():
    """Load vocabulary from kafel de.json"""
    with open('public/data/kafel/de.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_sentence(sentence, word):
    """
    Validate German C1 sentence for common errors
    Returns (is_valid, error_message)
    """
    # Check word count (15-22 words)
    word_count = len(sentence.split())
    if word_count < 15 or word_count > 22:
        return False, f"Word count {word_count} not in range 15-22"

    # Check if target word is in sentence
    word_lower = word.lower()
    sentence_lower = sentence.lower()

    # Extract base word (remove articles)
    base_word = word_lower.replace('die ', '').replace('der ', '').replace('das ', '')

    if base_word not in sentence_lower:
        return False, f"Target word '{word}' not found in sentence"

    # Check for common grammatical errors

    # Pattern 1: Adjectives used as nouns incorrectly (e.g., "Das strategisch ist")
    bad_adj_noun = re.search(r'\b(Das|Die|Der|Ein|Eine)\s+(strategisch|umfassend|wesentlich|zeitgenössisch|niemals|immer)\s+(ist|muss|sollte|kann|wird)\b', sentence, re.IGNORECASE)
    if bad_adj_noun:
        return False, f"Adjective used as noun: '{bad_adj_noun.group()}'"

    # Pattern 2: Adjectives used as verbs (e.g., "sollte strategisch das")
    bad_adj_verb = re.search(r'\b(sollte|könnte|würde|müsste)\s+(strategisch|umfassend|wesentlich|zeitgenössisch)\s+(das|die|der)\b', sentence, re.IGNORECASE)
    if bad_adj_verb:
        return False, f"Adjective used as verb: '{bad_adj_verb.group()}'"

    # Pattern 3: Incorrect article + adverb combinations
    bad_article_adv = re.search(r'\bein\s+(niemals|immer|weil|obwohl)\b', sentence, re.IGNORECASE)
    if bad_article_adv:
        return False, f"Incorrect article + adverb: '{bad_article_adv.group()}'"

    # Pattern 4: Check for sentence starting with verb (except questions/imperatives)
    if not sentence[0].isupper():
        return False, "Sentence must start with capital letter"

    # Pattern 5: Sentence must end with proper punctuation
    if not sentence[-1] in '.!?':
        return False, "Sentence must end with proper punctuation"

    return True, ""

def generate_c1_sentences(word, word_data, batch_num):
    """Generate 3 C1 sentences for a word"""

    word_text = word_data.get('word', word)
    explanation = word_data.get('explanation', {}).get('de', '')
    translation = word_data.get('translations', {}).get('en', '')

    prompt = f"""Generate EXACTLY 3 German C1-level sentences using the word "{word_text}".

REQUIREMENTS:
- Each sentence: 15-22 words
- Advanced grammar: Use Konjunktiv I/II, complex subordinate clauses, or participial constructions
- Professional/IT context suitable for an IT professional
- Sophisticated vocabulary and professional register
- i+1 principle: 80% known words, +1 advanced concept

WORD INFO:
- Word: {word_text}
- English: {translation}
- Explanation: {explanation}

SENTENCE VARIETY:
1. Complex main clause with advanced structure
2. IT/professional context with technical elements
3. Subordinate or conditional clause (wenn/falls/obwohl/dass)

CRITICAL GRAMMAR RULES:
✅ CORRECT German word order (Verb-Second in main clauses, Verb-Final in subordinate clauses)
✅ Proper case usage (Nominativ, Akkusativ, Dativ, Genitiv)
✅ Correct article agreement
✅ Natural German phrasing

❌ NEVER use adjectives as nouns incorrectly (e.g., "Das strategisch ist")
❌ NEVER use adjectives as verbs (e.g., "sollte strategisch das")
❌ NEVER use adverbs as nouns (e.g., "Die wesentlich muss")
❌ NEVER create unnatural phrases like "ein niemals" or "ein immer"

GOOD EXAMPLES:
✅ "Die Implementierung der neuen Infrastruktur erfordert eine umfassende Analyse der bestehenden Systeme und deren Abhängigkeiten."
✅ "Hätten wir mehr Ressourcen zur Verfügung gehabt, hätten wir das Projekt deutlich früher abschließen können."
✅ "Der leitende Architekt empfiehlt, dass wir die Datenbankstruktur grundlegend modernisieren und optimieren sollten."

BAD EXAMPLES (NEVER DO THIS):
❌ "Das strategisch ist für die umfassend wichtig." (adjectives as nouns!)
❌ "Sollte zeitgenössisch das System verbessern." (adjective as verb!)
❌ "Die wesentlich muss das bringen." (adverb as noun!)

Return ONLY a JSON array of 3 strings. NO explanations, NO markdown, NO additional text:
["sentence1", "sentence2", "sentence3"]"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                temperature=0.8,
                system="You are a German C1 language expert specializing in creating sophisticated, grammatically perfect German sentences for IT professionals. You ALWAYS follow German grammar rules precisely and NEVER make mistakes with word classes (nouns, verbs, adjectives, adverbs).",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            content = response.content[0].text.strip()

            # Remove markdown code blocks if present
            content = re.sub(r'^```json?\n?', '', content)
            content = re.sub(r'\n?```$', '', content)

            sentences = json.loads(content)

            if not isinstance(sentences, list) or len(sentences) != 3:
                print(f"  ⚠️  Attempt {attempt+1}: Invalid response format for '{word_text}'")
                continue

            # Validate each sentence
            all_valid = True
            for i, sentence in enumerate(sentences):
                is_valid, error = validate_sentence(sentence, word_text)
                if not is_valid:
                    print(f"  ⚠️  Attempt {attempt+1}: Sentence {i+1} invalid for '{word_text}': {error}")
                    print(f"      Sentence: {sentence}")
                    all_valid = False
                    break

            if all_valid:
                return sentences

        except json.JSONDecodeError as e:
            print(f"  ⚠️  Attempt {attempt+1}: JSON decode error for '{word_text}': {e}")
            continue
        except Exception as e:
            print(f"  ⚠️  Attempt {attempt+1}: Error for '{word_text}': {e}")
            continue

    print(f"  ❌ Failed to generate valid sentences for '{word_text}' after {max_retries} attempts")
    return None

def run_quality_checks(output_file):
    """Run quality checks on generated sentences"""
    with open(output_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("\n" + "="*70)
    print("QUALITY VALIDATION CHECKS")
    print("="*70)

    # Check 1: Count total sentences
    total_sentences = len(data)
    print(f"\n✓ Total sentences: {total_sentences}")

    # Check 2: Check for grammatical error patterns
    all_sentences = [item['sentence'] for item in data]

    error_patterns = {
        "Adjective as noun": r'\b(Das|Die|Der|Ein|Eine)\s+(strategisch|umfassend|wesentlich|zeitgenössisch|niemals|immer)\s+(ist|muss|sollte|kann|wird)\b',
        "Adjective as verb": r'\b(sollte|könnte|würde|müsste)\s+(strategisch|umfassend|wesentlich|zeitgenössisch)\s+(das|die|der)\b',
        "Bad article+adverb": r'\bein\s+(niemals|immer|weil|obwohl)\b'
    }

    for error_name, pattern in error_patterns.items():
        matches = []
        for item in data:
            if re.search(pattern, item['sentence'], re.IGNORECASE):
                matches.append(item)

        if matches:
            print(f"\n❌ {error_name}: {len(matches)} errors found")
            for match in matches[:3]:  # Show first 3
                print(f"   - {match['sentence']}")
        else:
            print(f"✓ {error_name}: 0 errors")

    # Check 3: Word count distribution
    word_counts = [len(item['sentence'].split()) for item in data]
    avg_words = sum(word_counts) / len(word_counts)
    min_words = min(word_counts)
    max_words = max(word_counts)

    print(f"\n✓ Word count range: {min_words}-{max_words} words (avg: {avg_words:.1f})")

    # Check 4: Sentences outside 15-22 range
    out_of_range = [item for item in data if len(item['sentence'].split()) < 15 or len(item['sentence'].split()) > 22]
    if out_of_range:
        print(f"⚠️  Sentences outside 15-22 range: {len(out_of_range)}")
    else:
        print(f"✓ All sentences within 15-22 word range")

    print("\n" + "="*70)

def main():
    """Main generation process"""
    print("="*70)
    print("GERMAN C1 SENTENCE GENERATOR - KAFEL")
    print("="*70)

    # Load vocabulary
    print("\n📚 Loading vocabulary...")
    vocab = load_vocabulary()
    print(f"✓ Loaded {len(vocab)} words")

    # Initialize output
    output_data = []

    # Generate sentences
    print(f"\n⚡ Generating 540 sentences (3 per word × {len(vocab)} words)...")
    print("="*70)

    for i, word_data in enumerate(vocab):
        word = word_data.get('word', '')

        print(f"\n[{i+1}/{len(vocab)}] Processing: {word}")

        sentences = generate_c1_sentences(word, word_data, i+1)

        if sentences:
            for j, sentence in enumerate(sentences):
                output_data.append({
                    "word": word,
                    "sentence": sentence,
                    "sentence_number": len(output_data) + 1
                })
            print(f"  ✅ Generated 3 sentences")
        else:
            print(f"  ❌ Failed to generate sentences")

        # Quality check every 60 words (180 sentences)
        if (i + 1) % 60 == 0:
            print(f"\n{'='*70}")
            print(f"CHECKPOINT: {i+1}/{len(vocab)} words completed ({len(output_data)} sentences)")
            print(f"{'='*70}")

    # Save output
    output_file = 'public/data/sentences/de/de-c1-sentences.json'
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved {len(output_data)} sentences to {output_file}")

    # Run quality checks
    run_quality_checks(output_file)

    # Show 20 random examples
    import random
    print("\n" + "="*70)
    print("20 RANDOM EXAMPLE SENTENCES")
    print("="*70 + "\n")

    random_samples = random.sample(output_data, min(20, len(output_data)))
    for i, item in enumerate(random_samples, 1):
        print(f"{i}. [{item['word']}]")
        print(f"   {item['sentence']}")
        print(f"   ({len(item['sentence'].split())} words)\n")

    print("="*70)
    print("✨ GENERATION COMPLETE!")
    print("="*70)
    print(f"📊 Total: {len(output_data)} sentences")
    print(f"📁 File: {output_file}")
    print("="*70)

if __name__ == "__main__":
    main()
