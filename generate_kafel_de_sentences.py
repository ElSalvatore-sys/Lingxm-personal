#!/usr/bin/env python3
"""
Generate B2-C1 level German sentences for Kafel's vocabulary.
Features: subjunctive, passive constructions, complex syntax, professional contexts.
"""

import json
from datetime import datetime

# Load vocabulary
with open('public/data/kafel/de.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

print(f"Loaded {len(vocab)} vocabulary entries")

def get_word_base(word: str) -> str:
    """Remove articles from German words."""
    for article in ['der ', 'die ', 'das ', 'zu ']:
        if word.startswith(article):
            return word[len(article):]
    return word

def normalize_word_for_id(word: str) -> str:
    """Normalize word for ID generation."""
    word = get_word_base(word).lower()
    replacements = {'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'}
    for old, new in replacements.items():
        word = word.replace(old, new)
    word = ''.join(c if c.isalnum() else '_' for c in word)
    return word

# B2-C1 sentence templates with professional contexts
# Level 1: Basic B2 - Passive + professional contexts
BASIC_TEMPLATES = [
    ("In der Geschäftsführung wird {word} als wesentlicher Faktor betrachtet.",
     "In management, {word_en} is considered an essential factor."),
    ("Die Analyse von {word} sollte systematisch durchgeführt werden.",
     "The analysis of {word_en} should be carried out systematically."),
    ("{word_cap} muss im strategischen Kontext berücksichtigt werden.",
     "{word_en_cap} must be considered in a strategic context."),
    ("Beim Projektmanagement spielt {word} eine wichtige Rolle.",
     "In project management, {word_en} plays an important role."),
    ("Die Implementierung erfordert eine gründliche Auseinandersetzung mit {word}.",
     "The implementation requires a thorough examination of {word_en}."),
    ("In modernen Unternehmen wird {word} zunehmend berücksichtigt.",
     "In modern companies, {word_en} is increasingly being considered."),
    ("Die Bedeutung von {word} kann nicht unterschätzt werden.",
     "The importance of {word_en} cannot be underestimated."),
    ("{word_cap} sollte in allen Geschäftsbereichen beachtet werden.",
     "{word_en_cap} should be observed in all business areas."),
]

# Level 2: Intermediate B2-C1 - Subjunctive II + complex syntax
INTERMEDIATE_TEMPLATES = [
    ("Falls {word} nicht ausreichend berücksichtigt würde, könnte dies zu erheblichen Problemen führen.",
     "If {word_en} were not sufficiently considered, this could lead to significant problems."),
    ("Es wäre ratsam, {word} in die Entscheidungsfindung einzubeziehen, obwohl dies zusätzliche Ressourcen erfordern würde.",
     "It would be advisable to include {word_en} in decision-making, although this would require additional resources."),
    ("Hätte man {word} früher erkannt, wären viele Schwierigkeiten vermeidbar gewesen.",
     "Had {word_en} been recognized earlier, many difficulties would have been avoidable."),
    ("Je gründlicher {word} analysiert wird, desto besser lassen sich fundierte Entscheidungen treffen.",
     "The more thoroughly {word_en} is analyzed, the better informed decisions can be made."),
    ("Unter der Voraussetzung, dass {word} verfügbar wäre, könnten wir die Effizienz erheblich steigern.",
     "Provided that {word_en} were available, we could significantly increase efficiency."),
    ("Wenn {word} konsequent umgesetzt würde, ließen sich bessere Ergebnisse erzielen.",
     "If {word_en} were consistently implemented, better results could be achieved."),
    ("Sollte {word} vernachlässigt werden, würde dies langfristige Konsequenzen haben.",
     "Should {word_en} be neglected, this would have long-term consequences."),
    ("Obwohl {word} komplex erscheint, wäre es mit der richtigen Strategie zu bewältigen.",
     "Although {word_en} appears complex, it would be manageable with the right strategy."),
]

# Level 3: Advanced C1 - Complex subordinate clauses + formal register
ADVANCED_TEMPLATES = [
    ("Die Tatsache, dass {word} zunehmend an Bedeutung gewinnt, lässt darauf schließen, dass ein Paradigmenwechsel stattfindet.",
     "The fact that {word_en} is increasingly gaining importance suggests that a paradigm shift is taking place."),
    ("Insofern {word} als Grundlage für weitere Entwicklungen dient, erweist es sich als unverzichtbar für den langfristigen Erfolg.",
     "Insofar as {word_en} serves as a basis for further developments, it proves indispensable for long-term success."),
    ("Es sei darauf hingewiesen, dass {word} nicht isoliert betrachtet werden darf, sondern im Zusammenhang mit dem Gesamtkonzept zu sehen ist.",
     "It should be pointed out that {word_en} must not be viewed in isolation, but must be seen in connection with the overall concept."),
    ("Angesichts der Komplexität, die {word} innewohnt, bedarf es einer interdisziplinären Herangehensweise.",
     "Given the complexity inherent in {word_en}, an interdisciplinary approach is required."),
    ("Sofern {word} konsequent implementiert wird, dürfte dies zu einer nachhaltigen Verbesserung der Prozesse beitragen.",
     "Provided {word_en} is consistently implemented, this should contribute to a sustainable improvement of processes."),
    ("Trotz der Herausforderungen, die {word} mit sich bringt, überwiegen die positiven Aspekte bei weitem.",
     "Despite the challenges that {word_en} brings with it, the positive aspects far outweigh them."),
    ("Insbesondere in Anbetracht dessen, dass {word} vielfältige Auswirkungen hat, muss eine sorgfältige Planung erfolgen.",
     "Particularly in view of the fact that {word_en} has diverse implications, careful planning must take place."),
    ("Während {word} in der Theorie klar erscheint, erfordert die praktische Umsetzung erhebliche Expertise.",
     "While {word_en} appears clear in theory, practical implementation requires considerable expertise."),
]

# Prepare sentence structure
output = {
    "metadata": {
        "language": "de",
        "language_name": "German",
        "source_profile": "kafel",
        "source_level": "B2-C1",
        "source_vocabulary": "public/data/kafel/de.json",
        "total_words": len(vocab),
        "total_sentences": len(vocab) * 3,
        "generated_date": datetime.now().strftime("%Y-%m-%d"),
        "version": "1.0",
        "generator": "Claude Code",
        "domain": "professional",
        "translations": ["en"],
        "notes": "B2-C1 level sentences featuring subjunctive mood, passive constructions, and complex syntax in professional contexts. Designed for Kafel's German learning with English translations."
    },
    "sentences": {}
}

# Generate sentences for each vocabulary word
for vocab_idx, vocab_item in enumerate(vocab):
    word = vocab_item['word']
    word_en = vocab_item['translations']['en']
    word_base = get_word_base(word)
    word_key = word

    # Initialize sentence array for this word
    output['sentences'][word_key] = []

    # Select templates (cycle through available templates for variety)
    basic_idx = vocab_idx % len(BASIC_TEMPLATES)
    intermediate_idx = vocab_idx % len(INTERMEDIATE_TEMPLATES)
    advanced_idx = vocab_idx % len(ADVANCED_TEMPLATES)

    templates = [
        ("basic", BASIC_TEMPLATES[basic_idx]),
        ("intermediate", INTERMEDIATE_TEMPLATES[intermediate_idx]),
        ("advanced", ADVANCED_TEMPLATES[advanced_idx])
    ]

    # Generate 3 sentences (one of each difficulty level)
    for sent_num, (difficulty, (de_template, en_template)) in enumerate(templates, 1):
        # Create sentences with proper word forms
        de_sentence = de_template.format(
            word=word_base,
            word_cap=word_base.capitalize()
        )

        en_sentence = en_template.format(
            word_en=word_en,
            word_en_cap=word_en.capitalize()
        )

        # Find target word position in German sentence
        words_de = de_sentence.split()
        target_index = -1

        for i, w in enumerate(words_de):
            clean_word = w.strip('.,;:!?')
            if word_base.lower() == clean_word.lower():
                target_index = i
                break

        if target_index == -1:
            # Fallback: look for partial match
            for i, w in enumerate(words_de):
                if word_base.lower() in w.lower():
                    target_index = i
                    break

        if target_index == -1:
            target_index = 0

        # Create blank version
        blank_words = []
        for w in words_de:
            clean_word = w.strip('.,;:!?')
            punct = ''.join(c for c in w if c in '.,;:!?')
            if clean_word.lower() == word_base.lower():
                blank_words.append('_____' + punct)
            else:
                blank_words.append(w)
        blank_de = ' '.join(blank_words)

        # Create ID
        word_id = normalize_word_for_id(word)
        sentence_id = f"de_{word_id}_{sent_num:03d}"

        sentence_obj = {
            "id": sentence_id,
            "de": de_sentence,
            "en": en_sentence,
            "blank_de": blank_de,
            "target_word": word,
            "target_index": target_index,
            "difficulty": difficulty,
            "domain": "professional"
        }

        output['sentences'][word_key].append(sentence_obj)

# Ensure output directory exists
import os
os.makedirs('public/data/sentences/de', exist_ok=True)

# Save output
output_path = 'public/data/sentences/de/de-b2c1-sentences.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generated {len(vocab) * 3} sentences for {len(vocab)} words")
print(f"Output saved to: {output_path}")
