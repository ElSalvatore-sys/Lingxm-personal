#!/usr/bin/env python3
"""
Generate French B1-B2 Gastronomy Sentences
- 360 words (Salman + Jawad)
- 3 sentences per word = 1080 sentences
- Professional culinary French with strict grammar rules
"""

import json
import os
from anthropic import Anthropic

# Initialize API
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def load_vocabulary():
    """Load French vocabulary from Salman and Jawad files"""
    with open('public/data/salman/fr.json', 'r', encoding='utf-8') as f:
        salman = json.load(f)

    with open('public/data/jawad/fr.json', 'r', encoding='utf-8') as f:
        jawad = json.load(f)

    # Combine vocabularies
    all_vocab = salman + jawad

    # Remove duplicates based on word
    seen_words = set()
    unique_vocab = []
    for item in all_vocab:
        if item['word'] not in seen_words:
            seen_words.add(item['word'])
            unique_vocab.append(item)

    print(f"Total unique words: {len(unique_vocab)}")
    return unique_vocab

def generate_sentences_batch(words_batch, batch_num, total_batches):
    """Generate 3 sentences for a batch of words"""

    words_list = "\n".join([f"- {w['word']} ({w.get('translation', 'N/A')})" for w in words_batch])

    prompt = f"""Generate exactly 3 French B1-B2 gastronomy sentences for EACH of these words:

{words_list}

CRITICAL FRENCH GRAMMAR RULES:
1. NEVER use adverbs as nouns: ❌ "Je vois un jamais" / ✅ "Je ne travaille jamais"
2. NEVER use conjunctions as nouns: ❌ "C'est mon parce que" / ✅ Use in proper context
3. NEVER use adjectives alone as nouns: ❌ "J'aime le bleu" / ✅ "J'aime le fromage bleu"
4. Always use proper articles: le/la/les (countable), du/de la/des (partitive)
5. Proper adjective agreement: "La sauce est délicieuse" or "Un plat délicieux"

REQUIREMENTS PER SENTENCE:
- Exactly 10-16 words
- Restaurant/kitchen/culinary context ONLY
- Use intermediate grammar: passé composé, imparfait, subjonctif
- Professional culinary French
- i+1 principle: 85% known words + 1 new gastronomy term
- Include the target word naturally in context

SENTENCE VARIETY (for each word's 3 sentences):
1. Declarative sentence (present or passé composé)
2. Kitchen/service context sentence
3. Question OR sentence with subjonctif

GOOD EXAMPLES:
✅ "Le chef a préparé une sauce avec des herbes fraîches du jardin."
✅ "Il faut que les ingrédients soient toujours de première qualité."
✅ "Nous servons ce plat avec un accompagnement de légumes au choix."
✅ "La casserole en cuivre permet une meilleure répartition de la chaleur."
✅ "Avez-vous vérifié que la poêle soit bien chaude avant de saisir?"

BAD EXAMPLES:
❌ "Je vois un jamais dans la cuisine." (adverb as noun!)
❌ "Le délicieux est important." (adjective as noun!)
❌ "C'est mon parce que préféré." (conjunction as noun!)
❌ "J'aime le bleu." (incomplete - needs noun!)

Return ONLY valid JSON array with this EXACT structure:
[
  {{
    "word": "la cuisine",
    "sentence": "Le chef surveille toute l'activité dans la cuisine pendant le service.",
    "translation": "The chef monitors all activity in the kitchen during service.",
    "arabic_translation": "يراقب الشيف كل النشاط في المطبخ أثناء الخدمة."
  }},
  ...
]

CRITICAL: Return EXACTLY 3 sentences per word. Total: {len(words_batch) * 3} sentences.
NO markdown, NO explanations, ONLY the JSON array."""

    print(f"\n🔄 Batch {batch_num}/{total_batches}: Generating {len(words_batch) * 3} sentences...")

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16000,
        temperature=1,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    content = response.content[0].text.strip()

    # Clean up markdown if present
    if content.startswith("```json"):
        content = content.replace("```json", "").replace("```", "").strip()
    elif content.startswith("```"):
        content = content.replace("```", "").strip()

    try:
        sentences = json.loads(content)
        print(f"✅ Generated {len(sentences)} sentences")
        return sentences
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        print(f"Response preview: {content[:500]}")
        raise

def validate_grammar(sentences):
    """Check for common French grammar mistakes"""

    errors = []

    # Patterns to avoid
    bad_patterns = [
        (r"Je vois un (jamais|toujours|souvent|hier|aujourd'hui|maintenant)", "Adverb used as noun"),
        (r"C'est mon (parce que|jamais|toujours|quand|si)", "Conjunction/adverb used as noun"),
        (r"J'aime le (bleu|rouge|vert|délicieux|bon)$", "Adjective without noun"),
        (r"un (jamais|toujours|souvent)", "Adverb as noun"),
        (r"le (jamais|toujours|souvent|hier)", "Adverb as noun"),
    ]

    import re

    for idx, item in enumerate(sentences):
        sentence = item['sentence']

        # Check word count (10-16 words)
        word_count = len(sentence.split())
        if word_count < 10 or word_count > 16:
            errors.append(f"Sentence {idx+1}: Word count {word_count} (should be 10-16)")

        # Check grammar patterns
        for pattern, description in bad_patterns:
            if re.search(pattern, sentence, re.IGNORECASE):
                errors.append(f"Sentence {idx+1}: {description} - '{sentence}'")

    return errors

def main():
    print("🇫🇷 FRENCH B1-B2 GASTRONOMY SENTENCE GENERATOR 🇫🇷")
    print("=" * 60)

    # Load vocabulary
    vocab = load_vocabulary()

    # Generate sentences in batches of 20 words
    batch_size = 20
    all_sentences = []

    total_batches = (len(vocab) + batch_size - 1) // batch_size

    for i in range(0, len(vocab), batch_size):
        batch = vocab[i:i+batch_size]
        batch_num = (i // batch_size) + 1

        sentences = generate_sentences_batch(batch, batch_num, total_batches)
        all_sentences.extend(sentences)

        # Quality check every 90 sentences (30 words)
        if len(all_sentences) % 90 == 0:
            print(f"\n🔍 Quality check at {len(all_sentences)} sentences...")
            recent = all_sentences[-90:]
            errors = validate_grammar(recent)
            if errors:
                print(f"⚠️  Found {len(errors)} issues:")
                for error in errors[:5]:  # Show first 5
                    print(f"   - {error}")
            else:
                print("✅ No grammar issues detected!")

    print(f"\n📊 GENERATION COMPLETE")
    print(f"Total sentences generated: {len(all_sentences)}")
    print(f"Expected: {len(vocab) * 3}")

    # Final validation
    print("\n🔍 Final quality check...")
    all_errors = validate_grammar(all_sentences)

    if all_errors:
        print(f"⚠️  Found {len(all_errors)} total issues:")
        for error in all_errors[:10]:
            print(f"   - {error}")
    else:
        print("✅ All sentences passed quality checks!")

    # Save to file
    output_file = 'public/data/sentences/fr/fr-b1b2-gastro-sentences.json'
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {output_file}")

    # Show random examples
    import random
    print("\n🎯 20 RANDOM CULINARY EXAMPLES:")
    print("=" * 60)
    samples = random.sample(all_sentences, min(20, len(all_sentences)))
    for idx, item in enumerate(samples, 1):
        print(f"\n{idx}. Word: {item['word']}")
        print(f"   FR: {item['sentence']}")
        print(f"   EN: {item['translation']}")
        print(f"   AR: {item['arabic_translation']}")

    print("\n" + "=" * 60)
    print("✅ GÉNÉRATION TERMINÉE!")
    print(f"📁 {len(all_sentences)} phrases culinaires professionnelles")

if __name__ == "__main__":
    main()
