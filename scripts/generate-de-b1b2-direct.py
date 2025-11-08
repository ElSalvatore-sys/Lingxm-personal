#!/usr/bin/env python3
"""
Generate German B1-B2 sentences - Direct generation by Claude Code
This script creates the vocabulary structure and sentence template.
Claude will populate the actual sentences.
"""

import json
from datetime import datetime

# B1-B2 German Vocabulary (180 words)
VOCABULARY = [
    # WORKPLACE & PROFESSIONAL (32 nouns)
    "die Besprechung", "der Termin", "der Kollege", "das Projekt",
    "das Angebot", "die Rechnung", "der Kunde", "die Aufgabe",
    "die Stelle", "die Bewerbung", "der Vertrag", "das Gehalt",
    "die Abteilung", "der Chef", "die Erfahrung", "die Qualifikation",
    "das Büro", "die Firma", "das Unternehmen", "der Arbeitgeber",
    "der Mitarbeiter", "die Karriere", "die Verantwortung", "die Deadline",
    "das Meeting", "die Präsentation", "der Bericht", "die E-Mail",
    "das Telefon", "der Computer", "die Pause", "die Überstunde",

    # DAILY LIFE & HOME (28 nouns)
    "die Wohnung", "das Haus", "die Miete", "der Nachbar",
    "die Küche", "das Badezimmer", "das Zimmer", "die Möbel",
    "der Einkauf", "der Supermarkt", "das Lebensmittel", "das Rezept",
    "die Gesundheit", "der Arzt", "die Apotheke", "das Krankenhaus",
    "die Reise", "der Urlaub", "das Hotel", "der Flug",
    "die Stadt", "das Dorf", "die Straße", "der Verkehr",
    "das Auto", "die Bahn", "der Bus", "die U-Bahn",

    # SOCIAL & CULTURE (30 nouns)
    "die Familie", "der Freund", "die Beziehung", "das Fest",
    "die Kultur", "das Museum", "das Theater", "das Kino",
    "das Restaurant", "das Café", "die Party", "die Einladung",
    "das Hobby", "der Sport", "das Fitnessstudio", "der Verein",
    "die Schule", "die Universität", "der Kurs", "die Prüfung",
    "das Studium", "der Unterricht", "die Sprache", "das Lernen",
    "die Zeitung", "das Internet", "der Fernseher", "das Radio",
    "die Musik", "das Buch",

    # VERBS - PROFESSIONAL (20 verbs)
    "arbeiten", "besprechen", "vereinbaren", "erledigen",
    "präsentieren", "organisieren", "planen", "vorbereiten",
    "teilnehmen", "leiten", "koordinieren", "kontrollieren",
    "entwickeln", "erstellen", "bearbeiten", "überprüfen",
    "anrufen", "mailen", "informieren", "beraten",

    # VERBS - DAILY LIFE (40 verbs)
    "wohnen", "mieten", "kaufen", "einkaufen",
    "kochen", "essen", "trinken", "schmecken",
    "fahren", "reisen", "besuchen", "ankommen",
    "abfahren", "umsteigen", "reservieren", "buchen",
    "sprechen", "sagen", "erzählen", "fragen",
    "antworten", "erklären", "verstehen", "meinen",
    "denken", "glauben", "hoffen", "wünschen",
    "suchen", "finden", "brauchen", "bekommen",
    "geben", "nehmen", "bringen", "holen",
    "anfangen", "aufhören", "weitermachen", "schaffen",

    # ADJECTIVES & ADVERBS (30 words)
    "wichtig", "interessant", "schwierig", "einfach",
    "gut", "schlecht", "neu", "alt",
    "groß", "klein", "lang", "kurz",
    "schnell", "langsam", "früh", "spät",
    "teuer", "günstig", "kostenlos", "billig",
    "möglich", "unmöglich", "notwendig", "sicher",
    "gesund", "krank", "müde", "fertig",
    "zufrieden", "glücklich"
]

def create_sentence_template(word, sentence_num):
    """Create a template sentence entry"""
    word_clean = word.split()[-1] if word.startswith(("der ", "die ", "das ")) else word
    return {
        "id": f"de-b1b2-{word_clean.lower()}-{sentence_num:03d}",
        "sentence": "",  # To be filled by Claude
        "de": "",
        "en": "",
        "target_word": word,
        "blank": "",
        "blank_de": "",
        "translation": "",
        "difficulty": ["basic", "intermediate", "advanced"][sentence_num - 1],
        "target_index": sentence_num
    }

def main():
    print(f"Total vocabulary: {len(VOCABULARY)} words")
    print(f"Expected sentences: {len(VOCABULARY) * 3} = 540 sentences")

    # Create structure
    output = {
        "metadata": {
            "language": "de",
            "language_name": "German",
            "level": "B1-B2",
            "source_profile": "custom_b1b2",
            "source_vocabulary": "Generated B1-B2 vocabulary list",
            "total_words": len(VOCABULARY),
            "total_sentences": len(VOCABULARY) * 3,
            "version": "3.0",
            "generated_date": datetime.now().strftime("%Y-%m-%d"),
            "generator": "Claude Code",
            "translations": ["en"],
            "notes": "B1-B2 level sentences with practical vocabulary for workplace, daily life, and social contexts."
        },
        "sentences": {}
    }

    # Create templates for all words
    for word in VOCABULARY:
        output["sentences"][word] = [
            create_sentence_template(word, 1),
            create_sentence_template(word, 2),
            create_sentence_template(word, 3)
        ]

    # Save template
    output_path = "/tmp/de-b1b2-template.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✓ Template created: {output_path}")
    print(f"✓ Ready for Claude to populate with {len(VOCABULARY) * 3} sentences")

    return VOCABULARY

if __name__ == "__main__":
    vocab = main()
    print("\nVocabulary list:")
    for i, word in enumerate(vocab, 1):
        print(f"{i:3d}. {word}")
