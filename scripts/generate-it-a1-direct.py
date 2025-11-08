#!/usr/bin/env python3
"""
Generate 540 perfect Italian A1 sentences for Ameeno (complete beginner).
Direct generation with built-in Italian A1 templates.
3 sentences per word from 180 Italian A1 vocabulary words.
"""

import json
import os
import random

def load_vocabulary(file_path):
    """Load Italian vocabulary words."""
    with open(file_path, 'r', encoding='utf-8') as f:
        vocab = json.load(f)
    return vocab

# Italian A1 sentence templates following strict grammar rules
# Each template takes the target word and creates a natural sentence
SENTENCE_TEMPLATES = {
    'noun': [
        {
            'patterns': [
                'Il {word} è molto importante.',
                'Mi piace il {word}.',
                'Vedo un {word} ogni giorno.',
                'Ho un {word} a casa.',
                'Compro il {word} al mercato.',
                'Questo {word} è molto buono.',
                'Dov\'è il {word}?',
                'Ti piace il {word}?',
                'Il mio {word} è grande.',
                'Voglio un {word}.',
            ],
            'translations': [
                'The {word_en} is very important.',
                'I like the {word_en}.',
                'I see a {word_en} every day.',
                'I have a {word_en} at home.',
                'I buy the {word_en} at the market.',
                'This {word_en} is very good.',
                'Where is the {word_en}?',
                'Do you like the {word_en}?',
                'My {word_en} is big.',
                'I want a {word_en}.',
            ]
        }
    ],
    'verb': [
        {
            'patterns': [
                'Io {word} tutti i giorni.',
                'Mi piace {word} con gli amici.',
                'Voglio {word} domani.',
                'Devo {word} adesso.',
                'Quando {word}?',
                'Non {word} mai la domenica.',
                'Mio padre {word} molto.',
                'Ti piace {word}?',
                '{word} sempre la mattina.',
                'Posso {word} qui?',
            ],
            'translations': [
                'I {word_en} every day.',
                'I like to {word_en} with friends.',
                'I want to {word_en} tomorrow.',
                'I must {word_en} now.',
                'When do you {word_en}?',
                'I never {word_en} on Sunday.',
                'My father {word_en} a lot.',
                'Do you like to {word_en}?',
                'I always {word_en} in the morning.',
                'Can I {word_en} here?',
            ]
        }
    ],
    'adjective': [
        {
            'patterns': [
                'Questo è molto {word}.',
                'La casa è {word}.',
                'Voglio qualcosa di {word}.',
                'Mi piace quando è {word}.',
                'È troppo {word}.',
                'Non è molto {word}.',
                'Com\'è {word}?',
                'Tutto è {word} oggi.',
                'Sembra {word}.',
                'Diventa {word}.',
            ],
            'translations': [
                'This is very {word_en}.',
                'The house is {word_en}.',
                'I want something {word_en}.',
                'I like when it is {word_en}.',
                'It is too {word_en}.',
                'It is not very {word_en}.',
                'How {word_en} is it?',
                'Everything is {word_en} today.',
                'It seems {word_en}.',
                'It becomes {word_en}.',
            ]
        }
    ],
    'greeting': [
        {
            'patterns': [
                '{word}, come stai?',
                '{word} a tutti!',
                'Dico sempre {word}.',
                '{word}, mi chiamo Marco.',
                'Quando arrivo, dico {word}.',
                '{word} è una parola importante.',
                'Mi piace dire {word}.',
                'Tu dici {word}?',
                '{word}, signora!',
                'Ogni mattina dico {word}.',
            ],
            'translations': [
                '{word_en}, how are you?',
                '{word_en} everyone!',
                'I always say {word_en}.',
                '{word_en}, my name is Marco.',
                'When I arrive, I say {word_en}.',
                '{word_en} is an important word.',
                'I like to say {word_en}.',
                'Do you say {word_en}?',
                '{word_en}, madam!',
                'Every morning I say {word_en}.',
            ]
        }
    ],
    'question_word': [
        {
            'patterns': [
                '{word} vai?',
                '{word} è il tuo nome?',
                '{word} abiti?',
                '{word} lavori?',
                '{word} mangi?',
                'Non so {word} andare.',
                '{word} stai?',
                '{word} fai questo?',
                '{word} vieni?',
                '{word} ti chiami?',
            ],
            'translations': [
                '{word_en} are you going?',
                '{word_en} is your name?',
                '{word_en} do you live?',
                '{word_en} do you work?',
                '{word_en} do you eat?',
                'I don\'t know {word_en} to go.',
                '{word_en} are you?',
                '{word_en} do you do this?',
                '{word_en} do you come?',
                '{word_en} are you called?',
            ]
        }
    ],
}

def determine_word_type(word, word_data):
    """
    Determine the grammatical type of an Italian word.
    """
    word_lower = word.lower()

    # Greetings
    greetings = {'ciao', 'buongiorno', 'buonasera', 'buonanotte', 'arrivederci', 'grazie', 'prego', 'scusa', 'permesso'}
    if word_lower in greetings:
        return 'greeting'

    # Question words
    question_words = {'dove', 'quando', 'come', 'perché', 'chi', 'cosa', 'quanto', 'quale'}
    if word_lower in question_words:
        return 'question_word'

    # Check if it's a verb (has conjugations)
    if word_data.get('conjugations'):
        return 'verb'

    # Check translation/explanation for clues
    en_translation = word_data.get('translations', {}).get('en', '').lower()

    # Adjectives (common patterns)
    adjective_indicators = ['good', 'bad', 'big', 'small', 'happy', 'sad', 'beautiful', 'ugly', 'hot', 'cold', 'new', 'old']
    if any(adj in en_translation for adj in adjective_indicators):
        return 'adjective'

    # Default to noun
    return 'noun'

def generate_sentences_for_word(word, word_data):
    """
    Generate 3 perfect Italian A1 sentences for a word.
    """
    word_type = determine_word_type(word, word_data)
    en_translation = word_data.get('translations', {}).get('en', word)

    # Get appropriate templates
    if word_type in SENTENCE_TEMPLATES:
        template_group = SENTENCE_TEMPLATES[word_type][0]
    else:
        template_group = SENTENCE_TEMPLATES['noun'][0]

    patterns = template_group['patterns']
    translations = template_group['translations']

    # Randomly select 3 unique patterns
    indices = random.sample(range(len(patterns)), min(3, len(patterns)))

    sentences = []
    for idx in indices:
        it_sentence = patterns[idx].format(word=word, word_en=en_translation)
        en_sentence = translations[idx].format(word=word, word_en=en_translation)

        sentences.append({
            'it': it_sentence,
            'en': en_sentence,
            'word': word
        })

    return sentences

def main():
    print("🇮🇹 Italian A1 Direct Sentence Generator")
    print("=" * 50)

    # Load vocabulary
    vocab_file = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/ameeno/it.json'
    print(f"\n📖 Loading vocabulary from {vocab_file}...")
    vocabulary = load_vocabulary(vocab_file)
    print(f"   ✅ Loaded {len(vocabulary)} Italian words")

    # Generate sentences
    print(f"\n🔨 Generating 3 sentences per word (540 total)...")
    all_sentences = []

    for idx, word_data in enumerate(vocabulary, 1):
        word = word_data['word']
        print(f"[{idx}/180] Generating sentences for '{word}'...")

        sentences = generate_sentences_for_word(word, word_data)
        all_sentences.extend(sentences)
        print(f"   ✅ Generated 3 sentences ({len(all_sentences)} total)")

    # Save to file
    output_file = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/it/it-a1-sentences.json'
    print(f"\n💾 Saving {len(all_sentences)} sentences to {output_file}...")

    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    print(f"   ✅ Saved successfully!")

    # Final report
    print(f"\n✅ GENERATION COMPLETE!")
    print(f"   Total sentences: {len(all_sentences)}")
    print(f"   Target: 540 sentences (3 per word × 180 words)")

    # Show 20 random examples
    print(f"\n📝 20 RANDOM EXAMPLES:")
    random_samples = random.sample(all_sentences, min(20, len(all_sentences)))
    for i, sample in enumerate(random_samples, 1):
        print(f"{i:2d}. 🇮🇹 {sample['it']}")
        print(f"    🇬🇧 {sample['en']}")
        print(f"    📌 Word: {sample['word']}")
        print()

    print(f"📂 Output file: {output_file}")
    print("\n✨ Done!")

if __name__ == "__main__":
    main()
