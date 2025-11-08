#!/usr/bin/env python3
"""
Generate 540 German C1 Gastronomy Sentences for Jawad (Programmatic)
=====================================================================

Requirements:
- 15-22 words per sentence
- C1 level complexity (haute cuisine, professional chef language)
- 3 sentences per word (180 words × 3 = 540 sentences):
  1. Technical aspect (preparation/technique)
  2. Sensory aspect (taste, aroma, presentation)
  3. Conceptual aspect (composition, philosophy, gastronomy)
- i+1 principle: 80% known words + 1 advanced culinary concept
- Perfect German grammar
"""

import json
import random
from pathlib import Path
from typing import Dict, List, Tuple

def load_vocabulary(file_path: Path) -> List[Dict]:
    """Load German gastronomy vocabulary."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def classify_word(word_entry: Dict) -> Tuple[str, str]:
    """
    Classify word by part of speech and return (pos, gender/info).
    Returns: (part_of_speech, additional_info)
    """
    word = word_entry['word'].lower()

    # Determine part of speech from word structure
    if word.startswith('das '):
        return ('noun_das', 'neuter')
    elif word.startswith('der '):
        return ('noun_der', 'masculine')
    elif word.startswith('die '):
        return ('noun_die', 'feminine')
    elif 'conjugations' in word_entry and word_entry['conjugations']:
        return ('verb', 'regular')
    elif word.endswith('lich') or word.endswith('ig') or word.endswith('isch'):
        return ('adjective', 'attributive')
    else:
        # Default classification based on explanation
        explanation = word_entry['explanation']['de'].lower()
        if any(verb_hint in explanation for verb_hint in ['zubereiten', 'machen', 'verkosten', 'servieren']):
            return ('verb', 'process')
        else:
            return ('noun_das', 'concept')

def generate_technical_sentence(word: str, pos: str, explanation: str) -> str:
    """Generate technical/preparation aspect sentence (15-22 words)."""

    # For verbs, use different templates
    if pos == 'verb':
        templates = [
            f"Beim {word} kommt es darauf an, jeden Arbeitsschritt zeitlich exakt zu koordinieren und die Temperatur präzise einzuhalten, um optimale Ergebnisse zu gewährleisten.",
            f"Erfahrene Köche beherrschen die Technik des {word} perfekt und können dadurch die Qualität und Konsistenz ihrer Gerichte auf höchstem Niveau garantieren.",
            f"In der Sterneküche ist {word} eine fundamentale Technik, die präzises Timing und ein tiefes Verständnis der Zutaten erfordert.",
            f"Um beim {word} professionelle Ergebnisse zu erzielen, müssen Köche die Temperatur konstant kontrollieren und die Arbeitsschritte sorgfältig koordinieren.",
            f"Die Kunst des {word} liegt in der perfekten Balance zwischen traditionellen französischen Techniken und modernen gastronomischen Innovationen.",
        ]
    else:
        # For nouns
        templates = [
            f"Die Zubereitung von {word} erfordert präzises Timing und professionelle Kenntnisse der klassischen französischen Kochtechniken, um höchste Qualität zu erreichen.",
            f"Bei der Herstellung von {word} müssen Köche die Temperatur konstant kontrollieren und jeden Arbeitsschritt präzise ausführen, um optimale Ergebnisse zu erzielen.",
            f"Um {word} fachgerecht herzustellen, sollte man zunächst alle Zutaten sorgfältig vorbereiten und die Arbeitsschritte systematisch planen und durchführen.",
            f"Die richtige Technik bei der Zubereitung von {word} entscheidet maßgeblich über die Qualität und Konsistenz des endgültigen Gerichts in der Sterneküche.",
            f"Erfahrene Köche wissen, dass {word} eine sorgfältige Vorbereitung und präzise Ausführung aller Arbeitsschritte erfordert, um höchste gastronomische Standards zu erreichen.",
        ]

    return random.choice(templates)

def generate_sensory_sentence(word: str, pos: str, explanation: str) -> str:
    """Generate sensory/taste aspect sentence (15-22 words)."""

    # For verbs, use different templates
    if pos == 'verb':
        templates = [
            f"Beim {word} entsteht ein harmonisches Zusammenspiel verschiedener Geschmackskomponenten, das höchsten gastronomischen Ansprüchen genügt und alle Sinne anspricht.",
            f"Durch fachgerechtes {word} kann man die sensorischen Qualitäten der Zutaten optimal zur Geltung bringen und ein unvergessliches Geschmackserlebnis schaffen.",
            f"Die Technik des {word} ermöglicht es, die natürlichen Aromen zu intensivieren und eine perfekt ausbalancierte Textur am Gaumen zu erzeugen.",
            f"Beim {word} offenbart sich die Komplexität der Aromen, während gleichzeitig eine harmonische Balance zwischen allen geschmacklichen Nuancen entsteht.",
            f"Durch präzises {word} gelingt es erfahrenen Köchen, die olfaktorischen und gustatorischen Eigenschaften der Zutaten perfekt zu entfalten.",
        ]
    else:
        # For nouns
        templates = [
            f"Das Aroma von {word} entfaltet sich harmonisch und bildet eine ausgewogene Komposition mit allen begleitenden Komponenten auf dem Teller.",
            f"Die Textur von {word} ist perfekt ausbalanciert und sorgt für ein außergewöhnliches sensorisches Erlebnis am Gaumen der anspruchsvollen Gäste.",
            f"Beim Degustieren von {word} offenbart sich eine komplexe Geschmacksvielfalt, die alle Sinne anspricht, begeistert und einen bleibenden Eindruck hinterlässt.",
            f"Die optische Präsentation von {word} unterstreicht die Raffinesse der gesamten Komposition und weckt sofort die Vorfreude und Neugier der Gäste.",
            f"Die sensorischen Qualitäten von {word} zeigen sich in der feinen Abstimmung aller geschmacklichen Nuancen, Texturen und aromatischen Komponenten.",
        ]

    return random.choice(templates)

def generate_conceptual_sentence(word: str, pos: str, explanation: str) -> str:
    """Generate conceptual/philosophy aspect sentence (15-22 words)."""

    # For verbs, use different templates
    if pos == 'verb':
        templates = [
            f"Die Kunst des {word} verkörpert die Balance zwischen klassischen französischen Einflüssen und avantgardistischen Ansätzen der modernen Molekulargastronomie perfekt.",
            f"Beim {word} zeigt sich die Philosophie der Sterneküche, traditionelle handwerkliche Techniken mit zeitgenössischen kulinarischen Innovationen zu verbinden.",
            f"Durch fachgerechtes {word} wird deutlich, wie wichtig die harmonische Abstimmung aller Komponenten für das vollständige gastronomische Erlebnis ist.",
            f"In der gehobenen Gastronomie repräsentiert {word} die Verschmelzung von technischem Können, handwerklicher Präzision und künstlerischem Ausdruck auf dem Teller.",
            f"Die Technik des {word} ist ein perfektes Beispiel dafür, wie nachhaltige Küche und höchste kulinarische Ansprüche sich gegenseitig bereichern können.",
        ]
    else:
        # For nouns
        templates = [
            f"Die Verwendung von {word} im Menü spiegelt die gastronomische Philosophie wider, traditionelle Techniken mit zeitgenössischen Interpretationen zu verbinden.",
            f"In der modernen Sterneküche wird {word} als Ausdruck kulinarischer Innovation verstanden, die klassische Tradition respektiert und kreativ weiterentwickelt.",
            f"Die Integration von {word} in die Menükomposition zeigt eindrucksvoll, wie regionale Produkte auf höchstem gastronomischem Niveau interpretiert werden können.",
            f"Bei der Konzeption eines Menüs mit {word} steht die harmonische Balance zwischen allen Gängen im Mittelpunkt der kulinarischen Überlegungen.",
            f"In der gehobenen Gastronomie repräsentiert {word} die perfekte Verschmelzung von handwerklichem Können und künstlerischem Ausdruck auf dem Teller.",
        ]

    return random.choice(templates)

def clean_sentence(sentence: str, word: str) -> str:
    """Clean up the sentence to ensure proper use of the target word."""
    # Remove article if word already contains it
    word_lower = word.lower()

    if word_lower.startswith('das '):
        clean_word = word_lower[4:]
        sentence = sentence.replace(f'von {word_lower}', f'von {clean_word}')
        sentence = sentence.replace(f'von das {clean_word}', f'von {clean_word}')
    elif word_lower.startswith('der '):
        clean_word = word_lower[4:]
        sentence = sentence.replace(f'von {word_lower}', f'vom {clean_word}')
        sentence = sentence.replace(f'von der {clean_word}', f'vom {clean_word}')
    elif word_lower.startswith('die '):
        clean_word = word_lower[4:]
        sentence = sentence.replace(f'von {word_lower}', f'von der {clean_word}')
        sentence = sentence.replace(f'von die {clean_word}', f'von der {clean_word}')

    return sentence

def generate_sentences_for_word(word_entry: Dict) -> List[str]:
    """Generate 3 C1-level sentences for a word."""
    word = word_entry['word']
    explanation = word_entry['explanation']['de']

    pos, info = classify_word(word_entry)

    sentences = [
        generate_technical_sentence(word, pos, explanation),
        generate_sensory_sentence(word, pos, explanation),
        generate_conceptual_sentence(word, pos, explanation)
    ]

    # Clean up sentences
    sentences = [clean_sentence(s, word) for s in sentences]

    return sentences

def validate_sentence(sentence: str, word: str) -> Tuple[bool, str]:
    """Validate sentence quality."""
    word_count = len(sentence.split())

    # Check word count (15-22 words)
    if word_count < 15 or word_count > 22:
        return False, f"Word count {word_count} (should be 15-22)"

    # Check for target word presence (handle articles)
    word_variants = [
        word.lower(),
        word.lower().replace('das ', ''),
        word.lower().replace('der ', ''),
        word.lower().replace('die ', '')
    ]

    sentence_lower = sentence.lower()
    if not any(variant in sentence_lower for variant in word_variants):
        return False, f"Target word '{word}' not found"

    # Check for catastrophic patterns
    catastrophic_patterns = [
        r'\bDas (raffiniert|exquisit|delikat|aromatisch) (ist|muss)\b',
        r'\bsollte (aromatisch|raffiniert) das\b',
        r'\bdie (delikat|exquisit)\s*\.\s*$',
    ]

    import re
    for pattern in catastrophic_patterns:
        if re.search(pattern, sentence):
            return False, f"Catastrophic pattern: {pattern}"

    # Must start with capital and end with period
    if not sentence[0].isupper():
        return False, "Must start with capital"
    if not sentence.endswith('.'):
        return False, "Must end with period"

    return True, ""

def main():
    # Paths
    vocab_path = Path("/Users/eldiaploo/Desktop/LingXM-Personal/public/data/jawad/de-gastro.json")
    output_path = Path("/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/de-specialized/de-c1-gastro-sentences.json")

    print("="*70)
    print("GERMAN C1 GASTRONOMY SENTENCE GENERATION - JAWAD")
    print("="*70)
    print(f"Source: {vocab_path.name}")
    print(f"Target: 540 haute cuisine sentences (180 words × 3)")
    print(f"Level: C1 (15-22 words, professional chef language)")
    print("="*70)

    # Load vocabulary
    vocabulary = load_vocabulary(vocab_path)
    print(f"\n📚 Loaded {len(vocabulary)} gastronomy words")

    # Generate sentences
    all_sentences = []
    failed = []
    perfect = 0
    too_short = 0
    too_long = 0

    for i, word_entry in enumerate(vocabulary):
        word = word_entry['word']
        print(f"\n[{i + 1}/{len(vocabulary)}] Generating for: {word}")

        try:
            sentences = generate_sentences_for_word(word_entry)

            # Validate each sentence
            validated_sentences = []
            for j, sent in enumerate(sentences, 1):
                word_count = len(sent.split())
                is_valid, error = validate_sentence(sent, word)

                if is_valid:
                    status = "✅"
                    validated_sentences.append(sent)
                    if 15 <= word_count <= 22:
                        perfect += 1
                    elif word_count < 15:
                        too_short += 1
                    else:
                        too_long += 1
                else:
                    status = "❌"
                    failed.append((word, sent, error))

                print(f"  {status} Sentence {j}: {word_count} words")

            all_sentences.append({
                "word": word,
                "sentences": validated_sentences
            })

        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed.append((word, "", str(e)))

        # Progress checkpoint every 30 words
        if (i + 1) % 30 == 0:
            print(f"\n{'='*70}")
            print(f"CHECKPOINT: {i + 1}/{len(vocabulary)} words processed")
            print(f"Sentences generated: {len(all_sentences) * 3}")
            print(f"Perfect length: {perfect}")
            print(f"{'='*70}")

    # Final statistics
    total_sentences = len(all_sentences) * 3
    print("\n" + "="*70)
    print("GENERATION COMPLETE")
    print("="*70)
    print(f"Total words processed: {len(vocabulary)}")
    print(f"Successful: {len(all_sentences)}")
    print(f"Failed: {len(failed)}")
    print(f"Total sentences: {total_sentences}")

    # Validation summary
    print("\n" + "="*70)
    print("QUALITY VALIDATION")
    print("="*70)
    print(f"\n📊 Sentence Length Distribution:")
    print(f"   Perfect (15-22 words): {perfect}/{total_sentences} ({perfect/total_sentences*100:.1f}%)")
    print(f"   Too short (<15 words): {too_short}/{total_sentences}")
    print(f"   Too long (>22 words): {too_long}/{total_sentences}")

    if failed:
        print(f"\n❌ Found {len(failed)} issues:")
        for word, sent, error in failed[:5]:
            print(f"   - {word}: {error}")
    else:
        print(f"\n✅ No quality issues detected!")

    # Save sentences
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_sentences, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {output_path}")

    # Show random examples
    print("\n" + "="*70)
    print("20 RANDOM STERNEKÜCHE EXAMPLES")
    print("="*70)

    sample_entries = random.sample(all_sentences, min(20, len(all_sentences)))
    for entry in sample_entries:
        print(f"\n🔸 {entry['word']}")
        for i, sent in enumerate(entry['sentences'], 1):
            word_count = len(sent.split())
            print(f"   {i}. [{word_count}w] {sent}")

    print("\n" + "="*70)
    print("✅ GENERATION COMPLETE!")
    print("="*70)
    print(f"📁 File: {output_path}")
    print(f"📊 Sentences: {total_sentences}")
    print(f"🎯 Quality: {perfect/total_sentences*100:.1f}% perfect length")
    print("="*70)

if __name__ == "__main__":
    main()
