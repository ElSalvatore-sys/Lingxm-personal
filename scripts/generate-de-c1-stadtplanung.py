#!/usr/bin/env python3
"""
Generate 540 German C1 Urban Planning Sentences
Vahiko's specialized vocabulary for German urban planning (Stadtplanung)
"""

import json
import os
import re
import time
from datetime import datetime
from anthropic import Anthropic

# Configuration
VOCAB_FILE = "public/data/vahiko/de.json"
OUTPUT_FILE = "public/data/sentences/de-specialized/de-c1-stadtplanung-sentences.json"
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-20250514"

# Quality requirements
MIN_WORDS = 15
MAX_WORDS = 22
SENTENCES_PER_WORD = 3
DIFFICULTY_LEVELS = ["basic", "intermediate", "advanced"]

# Anti-patterns to detect (adjectives used as nouns/verbs)
BAD_PATTERNS = [
    r'\bDas (nachhaltig|ganzheitlich|infrastrukturell|urbanisiert)\b',
    r'\bsollte (nachhaltig|infrastrukturell|ganzheitlich)\b',
    r'\bdie (urbanisiert|ganzheitlich)\s+(ist|muss|sollte)\b',
    r'\b(nachhaltig|ganzheitlich|infrastrukturell|urbanisiert) (ist|muss|sollte|wird)\s+(sein|werden)\b',
]

class SentenceGenerator:
    def __init__(self):
        self.client = Anthropic(api_key=API_KEY)
        self.vocab = []
        self.sentences = {}
        self.generated_count = 0

    def load_vocabulary(self):
        """Load vocabulary from JSON file"""
        print(f"📚 Loading vocabulary from {VOCAB_FILE}...")
        with open(VOCAB_FILE, 'r', encoding='utf-8') as f:
            self.vocab = json.load(f)
        print(f"✅ Loaded {len(self.vocab)} urban planning words\n")

    def validate_sentence(self, sentence, word):
        """Validate sentence quality"""
        # Check word count
        words = sentence.split()
        if len(words) < MIN_WORDS or len(words) > MAX_WORDS:
            return False, f"Word count {len(words)} not in range {MIN_WORDS}-{MAX_WORDS}"

        # Check for bad patterns (adjectives as nouns/verbs)
        for pattern in BAD_PATTERNS:
            if re.search(pattern, sentence, re.IGNORECASE):
                return False, f"Bad pattern detected: {pattern}"

        # Check if target word is present
        if word not in sentence:
            return False, f"Target word '{word}' not found in sentence"

        return True, "OK"

    def generate_sentence(self, word_data, difficulty):
        """Generate a single sentence using Claude API"""
        word = word_data['word']
        translation_pl = word_data['translations']['pl']
        translation_de = word_data['translations']['de']
        explanation_de = word_data['explanation']['de']

        # Context based on difficulty
        contexts = {
            "basic": "planning concept or basic definition",
            "intermediate": "infrastructure implementation or practical application",
            "advanced": "policy, regulation, or professional/academic usage"
        }

        prompt = f"""Generate ONE perfect German C1 sentence for the urban planning word "{word}".

WORD: {word}
Polish translation: {translation_pl}
German meaning: {translation_de}
Explanation: {explanation_de}

REQUIREMENTS:
- C1 level: 15-22 words
- Context: {contexts[difficulty]} in urban planning/Stadtplanung
- Professional planner-level language
- i+1 principle: 80% bekannte Wörter + 1 neues stadtplanerisches Konzept
- Natural, grammatically perfect German
- Include the word "{word}" naturally in the sentence

CRITICAL - AVOID THESE ERRORS:
- ❌ DO NOT use adjectives as nouns: "Das nachhaltig ist...", "Die ganzheitlich muss..."
- ❌ DO NOT use adjectives as verbs: "sollte infrastrukturell", "die urbanisiert"
- ✅ USE CORRECT FORMS: "Die nachhaltige Entwicklung ist...", "sollte infrastrukturell gestaltet werden"

TOPICS: Stadtentwicklung, Raumordnung, Infrastruktur, Verkehrsplanung, Nachhaltigkeit, Bürgerbeteiligung, Bebauungspläne, Regulierung

Return ONLY valid JSON:
{{"de": "German sentence here", "pl": "Polish translation here"}}"""

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.messages.create(
                    model=MODEL,
                    max_tokens=500,
                    temperature=0.7,
                    messages=[{"role": "user", "content": prompt}]
                )

                # Extract JSON from response
                content = response.content[0].text.strip()

                # Remove markdown code blocks if present
                if content.startswith('```'):
                    content = re.sub(r'^```(?:json)?\s*', '', content)
                    content = re.sub(r'\s*```$', '', content)

                result = json.loads(content)

                # Validate
                is_valid, msg = self.validate_sentence(result['de'], word)
                if is_valid:
                    return result
                else:
                    print(f"  ⚠️  Validation failed (attempt {attempt + 1}): {msg}")
                    if attempt == max_retries - 1:
                        print(f"  ❌ Failed after {max_retries} attempts: {result['de']}")
                        return None

            except Exception as e:
                print(f"  ⚠️  Error (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    return None
                time.sleep(1)

        return None

    def find_word_index(self, sentence, word):
        """Find the index of the target word in the sentence"""
        words = sentence.split()
        for i, w in enumerate(words):
            # Remove punctuation for comparison
            clean_w = re.sub(r'[^\w\u00C0-\u017F-]', '', w)
            clean_target = re.sub(r'[^\w\u00C0-\u017F-]', '', word)
            if clean_w.lower() == clean_target.lower():
                return i
        return 0

    def create_sentence_entry(self, word_data, difficulty, sentence_data, sentence_id):
        """Create a complete sentence entry"""
        word = word_data['word']
        de_sentence = sentence_data['de']
        pl_sentence = sentence_data['pl']

        # Find word index
        target_index = self.find_word_index(de_sentence, word)

        # Create blank versions
        de_blank = de_sentence.replace(word, "_____", 1)
        pl_word = word_data['translations']['pl']
        pl_blank = pl_sentence.replace(pl_word, "_____", 1)

        return {
            "id": sentence_id,
            "de": {
                "full": de_sentence,
                "blank": de_blank,
                "target_word": word,
                "target_index": target_index
            },
            "pl": {
                "full": pl_sentence,
                "blank": pl_blank,
                "target_word": pl_word,
                "target_index": 0  # Could be improved
            },
            "vocabulary_used": [word],
            "difficulty": difficulty,
            "domain": "urban_planning"
        }

    def generate_all_sentences(self):
        """Generate all sentences for all words"""
        print(f"🏗️  Generating {len(self.vocab) * SENTENCES_PER_WORD} sentences...\n")

        sentence_counter = 1

        for idx, word_data in enumerate(self.vocab, 1):
            word = word_data['word']
            print(f"[{idx}/{len(self.vocab)}] {word}")

            word_sentences = []

            for difficulty in DIFFICULTY_LEVELS:
                sentence_data = self.generate_sentence(word_data, difficulty)

                if sentence_data:
                    sentence_id = f"de_c1_stadt_{sentence_counter:04d}"
                    entry = self.create_sentence_entry(
                        word_data, difficulty, sentence_data, sentence_id
                    )
                    word_sentences.append(entry)
                    sentence_counter += 1
                    self.generated_count += 1
                    print(f"  ✅ {difficulty}: {sentence_data['de'][:60]}...")
                else:
                    print(f"  ❌ Failed to generate {difficulty} sentence")

                # Rate limiting
                time.sleep(0.5)

            self.sentences[word] = word_sentences

            # Progress checkpoint every 60 words
            if idx % 60 == 0:
                print(f"\n📊 Checkpoint: {self.generated_count} sentences generated so far\n")

        print(f"\n✅ Generation complete! Total: {self.generated_count} sentences\n")

    def save_output(self):
        """Save sentences to JSON file"""
        print(f"💾 Saving to {OUTPUT_FILE}...")

        output = {
            "metadata": {
                "language": "de",
                "language_name": "German",
                "source_profile": "vahiko",
                "source_level": "C1",
                "source_vocabulary": VOCAB_FILE,
                "total_words": len(self.vocab),
                "total_sentences": self.generated_count,
                "generated_date": datetime.now().strftime("%Y-%m-%d"),
                "version": "1.0",
                "generator": "Claude Code",
                "domain": "urban_planning",
                "translations": ["pl", "de"],
                "notes": "Generated from Vahiko's C1 German urban planning vocabulary. 3 sentences per word (basic, intermediate, advanced). Focuses on professional Stadtplanung language with i+1 principles."
            },
            "sentences": self.sentences
        }

        # Ensure directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

        # Save with proper formatting
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved {self.generated_count} sentences to {OUTPUT_FILE}\n")

    def validate_output(self):
        """Final validation of output"""
        print("🔍 Running final validation...\n")

        # Check for bad patterns in all sentences
        bad_count = 0
        for word, sentences in self.sentences.items():
            for sentence in sentences:
                for pattern in BAD_PATTERNS:
                    if re.search(pattern, sentence['de']['full'], re.IGNORECASE):
                        print(f"⚠️  Bad pattern in: {sentence['de']['full']}")
                        bad_count += 1

        if bad_count == 0:
            print("✅ No bad patterns detected!")
        else:
            print(f"⚠️  Found {bad_count} potential issues")

        print()

    def show_random_examples(self, count=20):
        """Show random sentence examples"""
        import random

        print(f"📝 {count} Random Examples:\n")

        all_sentences = []
        for word, sentences in self.sentences.items():
            all_sentences.extend(sentences)

        samples = random.sample(all_sentences, min(count, len(all_sentences)))

        for i, sentence in enumerate(samples, 1):
            print(f"{i}. [{sentence['difficulty']}] {sentence['de']['full']}")
            print(f"   → {sentence['pl']['full']}\n")

def main():
    """Main execution"""
    print("🇩🇪 GERMAN C1 URBAN PLANNING SENTENCE GENERATOR\n")
    print("=" * 60)
    print()

    generator = SentenceGenerator()
    generator.load_vocabulary()
    generator.generate_all_sentences()
    generator.save_output()
    generator.validate_output()
    generator.show_random_examples(20)

    print("=" * 60)
    print(f"✅ COMPLETE! {generator.generated_count} sentences generated")
    print(f"📁 Output: {OUTPUT_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()
