#!/usr/bin/env python3
"""
Generate Complete English B1-B2 Sentences
Target: 1,080 sentences (6 per word × 180 words)
Quality: 95+ grammatically perfect, natural business English
"""

import json
import os
from anthropic import Anthropic

# Initialize Anthropic client
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Load Hassan vocabulary
with open('public/data/hassan/en.json', 'r', encoding='utf-8') as f:
    vocab_data = json.load(f)

print(f"📚 Loaded {len(vocab_data)} vocabulary entries")
print(f"🎯 Target: {len(vocab_data) * 6} sentences (6 per word)")
print("=" * 60)

# B1-B2 generation prompt with STRICT part-of-speech validation
SYSTEM_PROMPT = """You are an expert English language teacher specializing in B1-B2 level business English.

CRITICAL RULES FOR PART-OF-SPEECH:
1. VERBS (to do, to manage, to scrutinize):
   - MUST have a subject
   - Use in sentences: "She manages the team", "They scrutinize data"
   - NEVER as nouns: ❌ "The scrutinize is important"

2. ADJECTIVES (thorough, strategic, comprehensive):
   - Modify nouns: "a thorough analysis", "strategic planning"
   - After 'to be': "The review was thorough"
   - NEVER as nouns: ❌ "The thorough is essential"

3. NOUNS (strategy, analysis, stakeholder):
   - Can be subjects/objects: "The strategy worked well"
   - Use with articles: "a strategy", "the analysis"

4. ADVERBS (thoroughly, strategically):
   - Modify verbs: "She analyzed it thoroughly"
   - NEVER as subjects: ❌ "Thoroughly is important"

B1-B2 LEVEL REQUIREMENTS:
- Length: 10-15 words per sentence
- Grammar: present perfect, past perfect, conditionals, passive voice allowed
- Complexity: can have ONE dependent clause
- Context: business, work, professional situations
- Vocabulary: intermediate level (beyond basic 1000 words)
- Natural: how native business professionals actually speak

i+1 PRINCIPLE:
- 85% familiar vocabulary
- +1 new word (the target word)
- Clear context clues for meaning
- Natural collocations

QUALITY STANDARDS:
✅ GOOD: "I've been scrutinizing the budget for inconsistencies."
✅ GOOD: "If we had more data, we could make better decisions."
✅ GOOD: "The proposal was articulated clearly by the manager."

❌ BAD: "I think thorough is important." (adjective as noun!)
❌ BAD: "The scrutinize showed problems." (verb as noun!)
❌ BAD: "She is advocate for change." (verb as noun!)
❌ BAD: "I work." (Too simple - A1 level!)

Generate ONLY grammatically perfect, natural B1-B2 business English sentences."""

def generate_sentences_for_word(word_entry, word_index, total_words):
    """Generate 6 B1-B2 sentences for a single word using Claude API"""

    word = word_entry['word']
    translation = word_entry['translations']['en']
    explanation = word_entry['explanation']['en']

    print(f"\n[{word_index + 1}/{total_words}] Generating for: {word}")

    user_prompt = f"""Generate EXACTLY 6 B1-B2 level sentences for the word: "{word}"

Translation: {translation}
Explanation: {explanation}

REQUIREMENTS:
1. Each sentence must be 10-15 words
2. Use correct part-of-speech (check if verb/adjective/noun!)
3. Business/professional context
4. Natural, grammatically perfect English
5. Include variety:
   - Present perfect / Past perfect
   - Conditional sentences
   - Passive voice
   - Questions
   - Different business contexts

CRITICAL: Verify part-of-speech before generating!
- If verb (to X): use with subject → "She scrutinizes", "They manage"
- If adjective: modify nouns → "thorough analysis", "strategic plan"
- If noun: use as subject/object → "The strategy", "stakeholders"

Return ONLY a JSON array of 6 sentences in this exact format:
[
  {{"sentence": "First sentence here."}},
  {{"sentence": "Second sentence here."}},
  {{"sentence": "Third sentence here."}},
  {{"sentence": "Fourth sentence here."}},
  {{"sentence": "Fifth sentence here."}},
  {{"sentence": "Sixth sentence here."}}
]

NO explanations, NO markdown, ONLY the JSON array."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0.8,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": user_prompt
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

        # Validate we got 6 sentences
        if len(sentences_data) != 6:
            print(f"  ⚠️  WARNING: Got {len(sentences_data)} sentences, expected 6")

        # Extract just the sentence text
        sentences = [s['sentence'] for s in sentences_data]

        # Quick validation
        for i, sent in enumerate(sentences, 1):
            words_count = len(sent.split())
            if words_count < 10 or words_count > 15:
                print(f"  ⚠️  Sentence {i}: {words_count} words (target: 10-15)")

        print(f"  ✅ Generated 6 sentences")
        return sentences

    except Exception as e:
        print(f"  ❌ ERROR: {e}")
        return []

def main():
    all_sentences = []
    total_words = len(vocab_data)

    # Generate sentences for each word
    for idx, word_entry in enumerate(vocab_data):
        sentences = generate_sentences_for_word(word_entry, idx, total_words)

        if sentences:
            word_data = {
                "word": word_entry['word'],
                "translation": word_entry['translations']['en'],
                "sentences": sentences
            }
            all_sentences.append(word_data)

        # Progress update every 20 words
        if (idx + 1) % 20 == 0:
            total_generated = sum(len(w['sentences']) for w in all_sentences)
            print(f"\n{'='*60}")
            print(f"PROGRESS: {idx + 1}/{total_words} words | {total_generated} sentences generated")
            print(f"{'='*60}")

    # Final statistics
    total_generated = sum(len(w['sentences']) for w in all_sentences)

    print(f"\n{'='*60}")
    print(f"🎉 GENERATION COMPLETE!")
    print(f"{'='*60}")
    print(f"Total words processed: {len(all_sentences)}")
    print(f"Total sentences generated: {total_generated}")
    print(f"Target: {total_words * 6}")
    print(f"Average per word: {total_generated / len(all_sentences):.1f}")

    # Save to output file
    output_file = 'public/data/sentences/en/en-b1b2-sentences.json'
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved to: {output_file}")

    # Save backup
    backup_file = f'/tmp/en-b1b2-sentences-backup.json'
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, indent=2, ensure_ascii=False)
    print(f"✅ Backup saved to: {backup_file}")

if __name__ == "__main__":
    main()
