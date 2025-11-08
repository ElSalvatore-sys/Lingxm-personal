#!/usr/bin/env python3
"""
German C1 Sentence Generator for Kafel (IT Professional)
Generates 540 high-quality C1 sentences (3 per word × 180 words)
DETERMINISTIC - No API calls, template-based generation
"""

import json
import os
import re
import random

def load_vocabulary():
    """Load vocabulary from kafel de.json"""
    with open('public/data/kafel/de.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_word_info(word_data):
    """Extract word info and classify"""
    word = word_data.get('word', '')
    translation = word_data.get('translations', {}).get('en', '')
    explanation = word_data.get('explanation', {}).get('de', '')

    # Determine if verb or noun
    is_verb = word_data.get('conjugations') is not None

    # Get article if noun
    article = ''
    base_word = word
    if not is_verb:
        if word.startswith('die '):
            article = 'die'
            base_word = word[4:]
        elif word.startswith('der '):
            article = 'der'
            base_word = word[4:]
        elif word.startswith('das '):
            article = 'das'
            base_word = word[4:]

    return {
        'word': word,
        'base_word': base_word,
        'article': article,
        'is_verb': is_verb,
        'translation': translation,
        'explanation': explanation
    }

def generate_c1_sentences_deterministic(word_data, word_index):
    """Generate 3 C1 sentences using sophisticated templates"""

    info = get_word_info(word_data)
    word = info['word']
    base_word = info['base_word']
    article = info['article']
    is_verb = info['is_verb']

    sentences = []

    # Seed random for consistency but variety
    random.seed(hash(word) + word_index)

    if is_verb:
        sentences = generate_verb_sentences(info, word_index)
    else:
        sentences = generate_noun_sentences(info, word_index)

    return sentences

def generate_verb_sentences(info, word_index):
    """Generate C1 sentences for verbs"""
    base_word = info['base_word']
    word = info['word']

    # Get verb forms from word_data if available
    sentences = []

    # Template 1: Complex main clause with Konjunktiv II (15-22 words)
    templates_1 = [
        f"Die IT-Abteilung würde diese Funktionalität gerne {base_word}, wenn die notwendigen Ressourcen und Kapazitäten dafür zur Verfügung stünden.",
        f"Man müsste diese Funktionalität zunächst sorgfältig {base_word}, bevor das gesamte System in die Produktionsumgebung überführt werden kann.",
        f"Der Projektleiter hätte diese Aspekte deutlich früher {base_word} sollen, um alle kritischen Probleme rechtzeitig identifizieren zu können.",
        f"Es wäre durchaus sinnvoll gewesen, diese komplexen Komponenten bereits in der frühen Planungsphase grundlegend zu {base_word}.",
        f"Die Entwickler sollten diese Funktionalität konsequent {base_word}, damit die Anwendung auch den künftig gestiegenen Anforderungen gerecht werden kann."
    ]

    # Template 2: Professional/IT context with subordinate clause (15-22 words)
    templates_2 = [
        f"Das gesamte Team hat beschlossen, die komplette Infrastruktur systematisch zu {base_word}, obwohl dies durchaus erhebliche finanzielle Investitionen erfordert.",
        f"Erfahrene Experten empfehlen nachdrücklich, dass wir diese bestehende Architektur grundlegend {base_word}, um alle zukünftigen Skalierungsprobleme zu vermeiden.",
        f"Die Geschäftsführung verlangt ausdrücklich, dass alle kritischen Prozesse vollständig {base_word} werden, bevor die neue Version ausgeliefert wird.",
        f"Nachdem die gravierenden Sicherheitslücken identifiziert wurden, mussten wir umgehend {base_word} und anschließend entsprechende zusätzliche Maßnahmen ergreifen.",
        f"Es ist absolut unerlässlich, dass wir diese wichtigen Funktionen sorgfältig {base_word}, damit alle Compliance-Anforderungen erfüllt werden können."
    ]

    # Template 3: Complex conditional/participial construction (15-22 words)
    templates_3 = [
        f"Hätten wir deutlich mehr Zeit und Ressourcen gehabt zu {base_word}, hätten wir die Fehlerquote signifikant reduzieren können.",
        f"Angesichts der äußerst komplexen technischen Anforderungen ist es zwingend notwendig, systematisch zu {base_word} und alle Abhängigkeiten zu dokumentieren.",
        f"Die dringende Notwendigkeit, diese kritischen Komponenten umfassend zu {base_word}, ergibt sich aus den stark veränderten Marktbedingungen und Kundenanforderungen.",
        f"Um die Performance der Anwendung nachhaltig zu verbessern, empfiehlt es sich dringend, die gesamte Kernfunktionalität vollständig zu {base_word}.",
        f"Bevor wir erfolgreich {base_word} können, müssen zunächst umfassende technische Analysen durchgeführt und alle Stakeholder informiert werden."
    ]

    # Select templates based on word_index for variety
    idx1 = word_index % len(templates_1)
    idx2 = word_index % len(templates_2)
    idx3 = word_index % len(templates_3)

    sentences.append(templates_1[idx1])
    sentences.append(templates_2[idx2])
    sentences.append(templates_3[idx3])

    return sentences

def generate_noun_sentences(info, word_index):
    """Generate C1 sentences for nouns"""
    base_word = info['base_word']
    article = info['article']
    word = info['word']

    sentences = []

    # Determine case variations
    if article == 'die':
        nom = 'die'
        acc = 'die'
        dat = 'der'
        gen = 'der'
    elif article == 'der':
        nom = 'der'
        acc = 'den'
        dat = 'dem'
        gen = 'des'
    elif article == 'das':
        nom = 'das'
        acc = 'das'
        dat = 'dem'
        gen = 'des'
    else:
        nom = acc = dat = gen = 'die'

    # Template 1: Nominative - complex subject with relative clause (15-22 words)
    templates_1 = [
        f"{nom.capitalize()} {base_word}, die in der aktuellen Projektphase implementiert werden soll, erfordert eine umfassende und grundlegende Überarbeitung der bestehenden Architektur.",
        f"{nom.capitalize()} {base_word} stellt zweifellos eine zentrale Herausforderung dar, der sich das gesamte Entwicklungsteam mit innovativen und kreativen Lösungsansätzen widmen muss.",
        f"Angesichts {gen} äußerst komplexen {base_word} haben wir entschieden, zusätzliche externe Experten zu konsultieren und die gesamte Planungsphase zu verlängern.",
        f"{nom.capitalize()} {base_word} wurde von allen Stakeholdern als absolut kritischer Erfolgsfaktor identifiziert, dessen erfolgreiche Realisierung höchste Priorität genießt.",
        f"Durch {acc} fundierte und detaillierte Analyse {gen} {base_word} konnten wir wesentliche Optimierungspotenziale identifizieren und entsprechende Maßnahmen ableiten."
    ]

    # Template 2: Accusative/Dative - professional context (15-22 words)
    templates_2 = [
        f"Die Geschäftsleitung hat beschlossen, {acc} {base_word} systematisch und umfassend zu evaluieren, bevor wichtige strategische Investitionsentscheidungen getroffen werden.",
        f"Man sollte {dat} {base_word} besondere Aufmerksamkeit schenken, da sie ganz maßgeblich über den langfristigen Projekterfolg entscheiden wird.",
        f"Um {acc} {base_word} angemessen zu berücksichtigen, müssen wir die bisherige Herangehensweise grundlegend überdenken, anpassen und optimieren.",
        f"Experten zufolge hängt die erfolgreiche Implementierung des Projekts wesentlich von {dat} professionellen und kompetenten Umgang mit {dat} {base_word} ab.",
        f"Das gesamte Team arbeitet intensiv daran, {acc} {base_word} in die bestehenden Prozesse zu integrieren und langfristig zu optimieren."
    ]

    # Template 3: Genitive/complex subordinate (15-22 words)
    templates_3 = [
        f"Die umfassende Berücksichtigung {gen} {base_word} ist absolut unerlässlich, wenn wir nachhaltige und zukunftsfähige Lösungen entwickeln wollen.",
        f"Hätte man die strategische Bedeutung {gen} {base_word} deutlich früher erkannt, hätten viele schwerwiegende Probleme vermieden werden können.",
        f"Es ist dringend erforderlich, dass wir {acc} {base_word} in allen relevanten Dokumentationen berücksichtigen und entsprechend kommunizieren.",
        f"Die enorme Komplexität {gen} {base_word} übersteigt die ursprünglichen Erwartungen bei weitem, weshalb zusätzliche Ressourcen bereitgestellt werden müssen.",
        f"Nachdem {nom} {base_word} ausführlich analysiert wurde, konnten die Verantwortlichen fundierte Empfehlungen für das weitere Vorgehen aussprechen."
    ]

    # Select templates based on word_index for variety
    idx1 = word_index % len(templates_1)
    idx2 = word_index % len(templates_2)
    idx3 = word_index % len(templates_3)

    sentences.append(templates_1[idx1])
    sentences.append(templates_2[idx2])
    sentences.append(templates_3[idx3])

    return sentences

def validate_sentence(sentence, word):
    """
    Validate German C1 sentence for common errors
    Returns (is_valid, error_message)
    """
    # Check word count (15-22 words)
    word_count = len(sentence.split())
    if word_count < 15 or word_count > 22:
        return False, f"Word count {word_count} not in range 15-22"

    # Check if target word is in sentence (flexible matching)
    word_lower = word.lower()
    sentence_lower = sentence.lower()
    base_word = word_lower.replace('die ', '').replace('der ', '').replace('das ', '')

    if base_word not in sentence_lower:
        return False, f"Target word '{word}' not found in sentence"

    # Check for common grammatical errors
    bad_adj_noun = re.search(r'\b(Das|Die|Der|Ein|Eine)\s+(strategisch|umfassend|wesentlich|zeitgenössisch|niemals|immer)\s+(ist|muss|sollte|kann|wird)\b', sentence, re.IGNORECASE)
    if bad_adj_noun:
        return False, f"Adjective used as noun: '{bad_adj_noun.group()}'"

    bad_adj_verb = re.search(r'\b(sollte|könnte|würde|müsste)\s+(strategisch|umfassend|wesentlich|zeitgenössisch)\s+(das|die|der)\b', sentence, re.IGNORECASE)
    if bad_adj_verb:
        return False, f"Adjective used as verb: '{bad_adj_verb.group()}'"

    bad_article_adv = re.search(r'\bein\s+(niemals|immer|weil|obwohl)\b', sentence, re.IGNORECASE)
    if bad_article_adv:
        return False, f"Incorrect article + adverb: '{bad_article_adv.group()}'"

    if not sentence[0].isupper():
        return False, "Sentence must start with capital letter"

    if not sentence[-1] in '.!?':
        return False, "Sentence must end with proper punctuation"

    return True, ""

def run_quality_checks(output_file):
    """Run quality checks on generated sentences"""
    with open(output_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("\n" + "="*70)
    print("QUALITY VALIDATION CHECKS")
    print("="*70)

    total_sentences = len(data)
    print(f"\n✓ Total sentences: {total_sentences}")

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
            for match in matches[:3]:
                print(f"   - {match['sentence']}")
        else:
            print(f"✓ {error_name}: 0 errors")

    word_counts = [len(item['sentence'].split()) for item in data]
    avg_words = sum(word_counts) / len(word_counts)
    min_words = min(word_counts)
    max_words = max(word_counts)

    print(f"\n✓ Word count range: {min_words}-{max_words} words (avg: {avg_words:.1f})")

    out_of_range = [item for item in data if len(item['sentence'].split()) < 15 or len(item['sentence'].split()) > 22]
    if out_of_range:
        print(f"⚠️  Sentences outside 15-22 range: {len(out_of_range)}")
    else:
        print(f"✓ All sentences within 15-22 word range")

    print("\n" + "="*70)

def main():
    """Main generation process"""
    print("="*70)
    print("GERMAN C1 SENTENCE GENERATOR - KAFEL (DETERMINISTIC)")
    print("="*70)

    print("\n📚 Loading vocabulary...")
    vocab = load_vocabulary()
    print(f"✓ Loaded {len(vocab)} words")

    output_data = []

    print(f"\n⚡ Generating 540 sentences (3 per word × {len(vocab)} words)...")
    print("="*70)

    for i, word_data in enumerate(vocab):
        word = word_data.get('word', '')

        if (i + 1) % 20 == 0:
            print(f"[{i+1}/{len(vocab)}] Processing: {word}")

        sentences = generate_c1_sentences_deterministic(word_data, i)

        for j, sentence in enumerate(sentences):
            is_valid, error = validate_sentence(sentence, word)
            if not is_valid:
                print(f"  ⚠️  Validation error for '{word}': {error}")
                print(f"      Sentence: {sentence}")

            output_data.append({
                "word": word,
                "sentence": sentence,
                "sentence_number": len(output_data) + 1
            })

        # Checkpoint every 60 words
        if (i + 1) % 60 == 0:
            print(f"\n{'='*70}")
            print(f"CHECKPOINT: {i+1}/{len(vocab)} words completed ({len(output_data)} sentences)")
            print(f"{'='*70}\n")

    # Save output
    output_file = 'public/data/sentences/de/de-c1-sentences.json'
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved {len(output_data)} sentences to {output_file}")

    # Run quality checks
    run_quality_checks(output_file)

    # Show 20 random examples
    print("\n" + "="*70)
    print("20 RANDOM EXAMPLE SENTENCES")
    print("="*70 + "\n")

    random.seed(42)  # Consistent random samples
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
