#!/usr/bin/env python3
"""
Generate German B1-B2 General Sentences
Target: 540 sentences (180 words × 3 sentences each)
"""

import json
import anthropic
import os
from datetime import datetime

# B1-B2 German Vocabulary List (180 words)
VOCABULARY = {
    # WORKPLACE & PROFESSIONAL (60 words)
    "nouns_work": [
        "die Besprechung", "der Termin", "der Kollege", "das Projekt",
        "das Angebot", "die Rechnung", "der Kunde", "die Aufgabe",
        "die Stelle", "die Bewerbung", "der Vertrag", "das Gehalt",
        "die Abteilung", "der Chef", "die Erfahrung", "die Qualifikation",
        "das Büro", "die Firma", "das Unternehmen", "der Arbeitgeber",
        "der Mitarbeiter", "die Karriere", "die Verantwortung", "die Deadline",
        "das Meeting", "die Präsentation", "der Bericht", "die E-Mail",
        "das Telefon", "der Computer", "die Pause", "die Überstunde"
    ],

    # DAILY LIFE & HOME (28 nouns)
    "nouns_daily": [
        "die Wohnung", "das Haus", "die Miete", "der Nachbar",
        "die Küche", "das Badezimmer", "das Zimmer", "die Möbel",
        "der Einkauf", "der Supermarkt", "das Lebensmittel", "das Rezept",
        "die Gesundheit", "der Arzt", "die Apotheke", "das Krankenhaus",
        "die Reise", "der Urlaub", "das Hotel", "der Flug",
        "die Stadt", "das Dorf", "die Straße", "der Verkehr",
        "das Auto", "die Bahn", "der Bus", "die U-Bahn"
    ],

    # SOCIAL & CULTURE (30 nouns)
    "nouns_social": [
        "die Familie", "der Freund", "die Beziehung", "das Fest",
        "die Kultur", "das Museum", "das Theater", "das Kino",
        "das Restaurant", "das Café", "die Party", "die Einladung",
        "das Hobby", "der Sport", "das Fitnessstudio", "der Verein",
        "die Schule", "die Universität", "der Kurs", "die Prüfung",
        "das Studium", "der Unterricht", "die Sprache", "das Lernen",
        "die Zeitung", "das Internet", "der Fernseher", "das Radio",
        "die Musik", "das Buch"
    ],

    # VERBS - PROFESSIONAL (20 verbs)
    "verbs_work": [
        "arbeiten", "besprechen", "vereinbaren", "erledigen",
        "präsentieren", "organisieren", "planen", "vorbereiten",
        "teilnehmen", "leiten", "koordinieren", "kontrollieren",
        "entwickeln", "erstellen", "bearbeiten", "überprüfen",
        "anrufen", "mailen", "informieren", "beraten"
    ],

    # VERBS - DAILY LIFE (40 verbs)
    "verbs_daily": [
        "wohnen", "mieten", "kaufen", "einkaufen",
        "kochen", "essen", "trinken", "schmecken",
        "fahren", "reisen", "besuchen", "ankommen",
        "abfahren", "umsteigen", "reservieren", "buchen",
        "sprechen", "sagen", "erzählen", "fragen",
        "antworten", "erklären", "verstehen", "meinen",
        "denken", "glauben", "hoffen", "wünschen",
        "suchen", "finden", "brauchen", "bekommen",
        "geben", "nehmen", "bringen", "holen",
        "anfangen", "aufhören", "weitermachen", "schaffen"
    ],

    # ADJECTIVES & ADVERBS (30 words)
    "adjectives": [
        "wichtig", "interessant", "schwierig", "einfach",
        "gut", "schlecht", "neu", "alt",
        "groß", "klein", "lang", "kurz",
        "schnell", "langsam", "früh", "spät",
        "teuer", "günstig", "kostenlos", "billig",
        "möglich", "unmöglich", "notwendig", "sicher",
        "gesund", "krank", "müde", "fertig",
        "zufrieden", "glücklich"
    ]
}

def create_flat_vocabulary_list():
    """Create a flat list of 180 words"""
    vocab_list = []
    for category, words in VOCABULARY.items():
        vocab_list.extend(words)
    print(f"Total vocabulary: {len(vocab_list)} words")
    return vocab_list

def generate_sentences_for_word(word, word_index, client):
    """Generate 3 sentences for a given word using Claude API"""

    # Determine word type and context
    is_noun = word.startswith(("der ", "die ", "das "))
    word_clean = word.split()[-1] if is_noun else word

    prompt = f"""Generate exactly 3 German B1-B2 level sentences using the word "{word}".

Requirements:
- Length: 10-16 words per sentence
- Grammar: Use B1-B2 structures (Perfekt, Konjunktiv II, Passiv, Nebensätze)
- Context: Natural workplace, daily life, or social situations
- Each sentence must include the target word naturally
- Provide English translations
- Create 3 difficulty levels: basic, intermediate, advanced

Target word: {word}

Return ONLY a JSON array with exactly 3 sentences in this format:
[
  {{
    "sentence": "German sentence here.",
    "translation": "English translation here.",
    "difficulty": "basic"
  }},
  {{
    "sentence": "German sentence here.",
    "translation": "English translation here.",
    "difficulty": "intermediate"
  }},
  {{
    "sentence": "German sentence here.",
    "translation": "English translation here.",
    "difficulty": "advanced"
  }}
]

IMPORTANT:
- Use correct German grammar (articles, cases, verb conjugations)
- Make sentences natural and practical for B1-B2 learners
- Each sentence must contain the word "{word}"
- Return ONLY the JSON array, no explanations"""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text.strip()

        # Parse JSON response
        sentences_data = json.loads(response_text)

        # Format sentences with proper structure
        formatted_sentences = []
        for idx, sent_data in enumerate(sentences_data, 1):
            sentence_id = f"de-b1b2-{word_clean.lower()}-{idx:03d}"

            # Create blank version by replacing target word with _____
            blank_sentence = sent_data["sentence"].replace(word, "_____")
            # Also try without article for nouns
            if is_noun:
                article, noun = word.split()
                blank_sentence = sent_data["sentence"].replace(noun, "_____")

            formatted_sentence = {
                "id": sentence_id,
                "sentence": sent_data["sentence"],
                "de": sent_data["sentence"],
                "en": sent_data["translation"],
                "target_word": word,
                "blank": blank_sentence,
                "blank_de": blank_sentence,
                "translation": "",
                "difficulty": sent_data["difficulty"],
                "target_index": idx
            }
            formatted_sentences.append(formatted_sentence)

        return formatted_sentences

    except Exception as e:
        print(f"Error generating sentences for '{word}': {e}")
        return []

def main():
    """Main generation function"""
    print("=" * 60)
    print("German B1-B2 Sentence Generation")
    print("=" * 60)

    # Initialize Anthropic client
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable not set")
        return

    client = anthropic.Anthropic(api_key=api_key)

    # Create vocabulary list
    vocab_list = create_flat_vocabulary_list()
    print(f"\n✓ Created vocabulary list: {len(vocab_list)} words")
    print(f"  - Nouns: {sum(1 for w in vocab_list if w.startswith(('der ', 'die ', 'das ')))}")
    print(f"  - Verbs/Adjectives: {sum(1 for w in vocab_list if not w.startswith(('der ', 'die ', 'das ')))}")

    # Generate sentences
    all_sentences = {}
    total_generated = 0

    print(f"\n{'='*60}")
    print("Generating sentences...")
    print(f"{'='*60}\n")

    for idx, word in enumerate(vocab_list, 1):
        print(f"[{idx}/{len(vocab_list)}] {word}...", end=" ", flush=True)

        sentences = generate_sentences_for_word(word, idx, client)

        if sentences:
            all_sentences[word] = sentences
            total_generated += len(sentences)
            print(f"✓ ({len(sentences)} sentences)")
        else:
            print("✗ FAILED")

        # Progress checkpoint every 30 words
        if idx % 30 == 0:
            print(f"\n  → Progress: {total_generated}/{idx * 3} sentences generated\n")

    # Create final JSON structure
    output_data = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "level": "B1-B2",
            "source_profile": "custom_b1b2",
            "source_vocabulary": "Generated B1-B2 vocabulary list",
            "total_words": len(vocab_list),
            "total_sentences": total_generated,
            "version": "3.0",
            "generated_date": datetime.now().strftime("%Y-%m-%d"),
            "generator": "Claude Code",
            "translations": ["en"],
            "notes": "B1-B2 level sentences with practical vocabulary for workplace, daily life, and social contexts."
        },
        "sentences": all_sentences
    }

    # Save to file
    output_path = "/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de/de-b1b2-sentences.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print("✅ GENERATION COMPLETE!")
    print(f"{'='*60}")
    print(f"Total words: {len(vocab_list)}")
    print(f"Total sentences: {total_generated}")
    print(f"Output file: {output_path}")
    print(f"{'='*60}\n")

    return output_path, total_generated

if __name__ == "__main__":
    main()
