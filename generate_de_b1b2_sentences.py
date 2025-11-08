#!/usr/bin/env python3
"""
Generate B1-B2 German sentences from combined vocabulary of Hassan, Salman, and Ameeno
"""

import json
from datetime import datetime

def load_vocabulary(filepath, translation_language='ar'):
    """Extract vocabulary words from a profile's language file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words = []
    for entry in data:
        # Determine part of speech from word or conjugations
        pos = 'noun'  # default
        word = entry['word']
        if entry.get('conjugations'):
            pos = 'verb'
        elif word.startswith(('der ', 'die ', 'das ')):
            pos = 'noun'

        # Get translation in the appropriate language
        translation_en = entry['translations'].get('en', '')
        translation_native = entry['translations'].get(translation_language, '')

        words.append({
            'word': word,
            'translation_en': translation_en,
            'translation_native': translation_native,
            'part_of_speech': pos
        })
    return words

def generate_b1b2_sentences():
    """Generate B1-B2 level German sentences for all vocabulary"""

    # Load vocabulary from all three profiles
    hassan_words = load_vocabulary('public/data/hassan/de.json', 'ar')
    salman_words = load_vocabulary('public/data/salman/de.json', 'ar')
    ameeno_words = load_vocabulary('public/data/ameeno/de.json', 'fa')

    # Combine all words with their source profile
    all_vocabulary = []
    for word in hassan_words:
        all_vocabulary.append({**word, 'profile': 'hassan'})
    for word in salman_words:
        all_vocabulary.append({**word, 'profile': 'salman'})
    for word in ameeno_words:
        all_vocabulary.append({**word, 'profile': 'ameeno'})

    print(f"Total vocabulary words: {len(all_vocabulary)}")

    # B1-B2 German sentence templates with subordinate clauses, modal verbs, reflexive verbs
    # These are example sentences - in a real implementation, you'd want more variety

    sentences_data = []

    for vocab in all_vocabulary:
        word = vocab['word']
        translation_en = vocab['translation_en']
        translation_native = vocab['translation_native']
        pos = vocab['part_of_speech']
        profile = vocab['profile']
        is_arabic = profile in ['hassan', 'salman']

        # Generate 3 contextual sentences per word
        # These templates create B1-B2 level complexity

        if pos == 'noun':
            examples = [
                {
                    'de': f'Ich muss zum Supermarkt gehen, weil ich {word} kaufen möchte.',
                    'en': f'I have to go to the supermarket because I want to buy {translation_en}.',
                    'translation': f'يجب أن أذهب إلى السوبر ماركت لأنني أريد شراء {translation_native}.' if is_arabic else f'باید به سوپرمارکت بروم چون می‌خواهم {translation_native} بخرم.'
                },
                {
                    'de': f'Können Sie mir sagen, wo ich {word} finden kann?',
                    'en': f'Can you tell me where I can find {translation_en}?',
                    'translation': f'هل يمكنك أن تخبرني أين يمكنني العثور على {translation_native}؟' if is_arabic else f'می‌توانید به من بگویید کجا می‌توانم {translation_native} پیدا کنم؟'
                },
                {
                    'de': f'Als ich gestern einkaufen war, habe ich {word} gekauft.',
                    'en': f'When I went shopping yesterday, I bought {translation_en}.',
                    'translation': f'عندما ذهبت للتسوق أمس، اشتريت {translation_native}.' if is_arabic else f'وقتی دیروز خرید کردم، {translation_native} خریدم.'
                }
            ]
        elif pos == 'verb':
            examples = [
                {
                    'de': f'Ich versuche jeden Tag zu {word}, weil es wichtig für mich ist.',
                    'en': f'I try to {translation_en} every day because it\'s important to me.',
                    'translation': f'أحاول {translation_native} كل يوم لأنه مهم بالنسبة لي.' if is_arabic else f'سعی می‌کنم هر روز {translation_native} چون برای من مهم است.'
                },
                {
                    'de': f'Kannst du mir helfen zu {word}? Ich weiß nicht genau, wie das geht.',
                    'en': f'Can you help me {translation_en}? I don\'t know exactly how to do that.',
                    'translation': f'هل يمكنك مساعدتي في {translation_native}؟ لا أعرف بالضبط كيف يتم ذلك.' if is_arabic else f'می‌توانی به من کمک کنی {translation_native}؟ دقیقا نمی‌دانم چطور این کار را انجام دهم.'
                },
                {
                    'de': f'Nachdem ich nach Hause gekommen bin, möchte ich {word}.',
                    'en': f'After I come home, I want to {translation_en}.',
                    'translation': f'بعد أن أعود إلى المنزل، أريد {translation_native}.' if is_arabic else f'بعد از اینکه به خانه برگردم، می‌خواهم {translation_native}.'
                }
            ]
        elif pos == 'adjective':
            examples = [
                {
                    'de': f'Das Wetter ist heute sehr {word}, deshalb bleibe ich zu Hause.',
                    'en': f'The weather is very {translation_en} today, so I\'m staying home.',
                    'translation': f'الطقس {translation_native} جداً اليوم، لذلك سأبقى في المنزل.' if is_arabic else f'هوا امروز خیلی {translation_native} است، به همین دلیل خانه می‌مانم.'
                },
                {
                    'de': f'Ich suche etwas {word}, das nicht zu teuer ist.',
                    'en': f'I\'m looking for something {translation_en} that isn\'t too expensive.',
                    'translation': f'أبحث عن شيء {translation_native} ليس باهظ الثمن.' if is_arabic else f'دنبال چیزی {translation_native} می‌گردم که خیلی گران نباشد.'
                },
                {
                    'de': f'Es ist wichtig, dass die Arbeit {word} und sorgfältig gemacht wird.',
                    'en': f'It\'s important that the work is done {translation_en} and carefully.',
                    'translation': f'من المهم أن يتم العمل بشكل {translation_native} وبعناية.' if is_arabic else f'مهم است که کار {translation_native} و با دقت انجام شود.'
                }
            ]
        else:  # other parts of speech
            examples = [
                {
                    'de': f'Ich habe {word} gesehen, als ich unterwegs war.',
                    'en': f'I saw {translation_en} when I was on my way.',
                    'translation': f'رأيت {translation_native} عندما كنت في الطريق.' if is_arabic else f'{translation_native} را دیدم وقتی در راه بودم.'
                },
                {
                    'de': f'Wir sollten {word} nicht vergessen, wenn wir einkaufen gehen.',
                    'en': f'We shouldn\'t forget {translation_en} when we go shopping.',
                    'translation': f'يجب ألا ننسى {translation_native} عندما نذهب للتسوق.' if is_arabic else f'نباید {translation_native} را فراموش کنیم وقتی خرید می‌رویم.'
                },
                {
                    'de': f'Ich freue mich darauf, {word} zu erleben.',
                    'en': f'I\'m looking forward to experiencing {translation_en}.',
                    'translation': f'أتطلع إلى تجربة {translation_native}.' if is_arabic else f'مشتاق تجربه {translation_native} هستم.'
                }
            ]

        # Add all three sentences for this word
        for i, example in enumerate(examples, 1):
            sentences_data.append({
                'id': f"{word}_{i}",
                'word': word,
                'sentence_de': example['de'],
                'sentence_en': example['en'],
                'sentence_native': example['translation'],
                'difficulty': 'B1-B2',
                'source_profile': profile
            })

    # Create final output structure
    output = {
        'metadata': {
            'language': 'de',
            'language_name': 'German',
            'level': 'B1-B2',
            'source_profiles': ['hassan', 'salman', 'ameeno'],
            'total_words': len(all_vocabulary),
            'total_sentences': len(sentences_data),
            'generated_date': datetime.now().strftime('%Y-%m-%d'),
            'difficulty': 'intermediate'
        },
        'sentences': sentences_data
    }

    # Write to output file
    output_path = 'public/data/sentences/de/de-b1b2-sentences.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(sentences_data)} sentences for {len(all_vocabulary)} words")
    print(f"Output written to {output_path}")

if __name__ == '__main__':
    generate_b1b2_sentences()
