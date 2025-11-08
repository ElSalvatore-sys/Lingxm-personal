#!/usr/bin/env python3
"""
Fill in [GENERATE] placeholders with contextual sentences.
Uses rule-based templates to create domain-appropriate sentences.
"""

import json
import random


# Sentence templates by domain
TEMPLATES = {
    "professional": {
        "ar": [
            ("المدير استخدم {word} لتطوير الشركة بشكل أفضل.", "The manager used {trans} to develop the company better."),
            ("تتطلب هذه الوظيفة {word} قوية للنجاح.", "This job requires strong {trans} to succeed."),
            ("الخبير قدم {word} ممتازة للمشروع.", "The expert provided excellent {trans} for the project."),
            ("نحن نعتمد على {word} في اتخاذ القرارات الاستراتيجية.", "We rely on {trans} in making strategic decisions."),
            ("هذا النهج يتطلب {word} شاملة ومتعمقة.", "This approach requires comprehensive and in-depth {trans}."),
        ],
    },
    "gastronomy": {
        "fr": [
            ("Le chef utilise {word} pour préparer ce plat spécial.", "The chef uses {trans} to prepare this special dish.", "الشيف يستخدم {trans} لإعداد هذا الطبق الخاص."),
            ("Dans la cuisine française, {word} est très important.", "In French cuisine, {trans} is very important.", "في المطبخ الفرنسي، {trans} مهم جداً."),
            ("J'ai besoin de {word} pour cuisiner ce repas.", "I need {trans} to cook this meal.", "أحتاج إلى {trans} لطهي هذه الوجبة."),
            ("Cette recette traditionnelle demande {word}.", "This traditional recipe requires {trans}.", "هذه الوصفة التقليدية تتطلب {trans}."),
            ("Le restaurant sert des plats avec {word} de qualité.", "The restaurant serves dishes with quality {trans}.", "المطعم يقدم أطباقاً مع {trans} عالي الجودة."),
        ],
    },
    "basic": {
        "it": [
            ("Ogni giorno uso {word} per comunicare.", "Every day I use {trans} to communicate."),
            ("Mi piace dire {word} agli amici.", "I like to say {trans} to friends."),
            ("In Italia, tutti dicono {word}.", "In Italy, everyone says {trans}."),
            ("Quando incontro qualcuno, dico {word}.", "When I meet someone, I say {trans}."),
            ("È importante imparare {word} in italiano.", "It's important to learn {trans} in Italian."),
        ],
    },
}


def get_translation(word_data, lang='en'):
    """Extract translation for a word."""
    trans = word_data.get('translations', {})
    if lang in trans:
        return trans[lang].split(',')[0].strip()
    # Fallback to any available translation
    for t in trans.values():
        return t.split(',')[0].strip()
    return word_data['word']


def generate_sentence(word_data, language, domain, translation_lang):
    """Generate a contextual sentence for a word."""

    word = word_data['word']

    # Get appropriate template based on language and domain
    if language == "ar" and domain == "professional":
        templates = TEMPLATES["professional"]["ar"]
        trans = get_translation(word_data, 'en')
        template = random.choice(templates)
        sentence = template[0].format(word=word, trans=trans)
        translation = template[1].format(word=word, trans=trans)
        return sentence, translation

    elif language == "fr" and domain == "gastronomy":
        templates = TEMPLATES["gastronomy"]["fr"]
        trans_en = get_translation(word_data, 'ar')
        template = random.choice(templates)
        sentence = template[0].format(word=word, trans=trans_en)
        if translation_lang == "ar":
            translation = template[2].format(word=word, trans=trans_en)
        else:
            translation = template[1].format(word=word, trans=trans_en)
        return sentence, translation

    elif language == "it" and domain == "basic":
        templates = TEMPLATES["basic"]["it"]
        trans = get_translation(word_data, 'en')
        template = random.choice(templates)
        sentence = template[0].format(word=word, trans=trans)
        translation = template[1].format(word=word, trans=trans)
        return sentence, translation

    # Fallback
    return f"Example sentence with {word}.", f"Translated sentence with {word}."


def process_file(filepath, language, domain):
    """Process a sentence file and fill in [GENERATE] placeholders."""

    print(f"\nProcessing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Get vocabulary for reference
    vocab_files = data['metadata']['source_files']
    vocab_map = {}

    for vfile in vocab_files:
        with open(vfile, 'r', encoding='utf-8') as f:
            vocab = json.load(f)
            for v in vocab:
                vocab_map[v['word']] = v

    generated_count = 0

    # Process each word's sentences
    for word, sentences in data['sentences'].items():
        for sent in sentences:
            if sent['sentence'] == "[GENERATE]":
                # Generate sentence
                word_data = vocab_map.get(word, {'word': word, 'translations': {}})
                translation_lang = sent['translation_language']

                sentence, translation = generate_sentence(
                    word_data, language, domain, translation_lang
                )

                sent['sentence'] = sentence
                sent['translation'] = translation

                # Update target index
                words_list = sentence.split()
                for i, w in enumerate(words_list):
                    clean_w = w.strip('.,!?;:"""()[]').lower()
                    clean_word = word.strip('.,!?;:"""()[]').lower()
                    if clean_word in clean_w or clean_w in clean_word:
                        sent['target_index'] = i
                        break

                generated_count += 1

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated {generated_count} sentences")


def main():
    """Main function."""
    base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences"

    files = [
        (f"{base_dir}/ar/ar-c1c2-sentences.json", "ar", "professional"),
        (f"{base_dir}/fr/fr-b1b2-gastro-sentences.json", "fr", "gastronomy"),
        (f"{base_dir}/it/it-a1-sentences.json", "it", "basic"),
    ]

    print("🚀 Filling generated sentences...")
    print("="*70)

    for filepath, language, domain in files:
        process_file(filepath, language, domain)

    print("\n" + "="*70)
    print("✅ All sentences generated!")
    print("="*70)


if __name__ == "__main__":
    main()
