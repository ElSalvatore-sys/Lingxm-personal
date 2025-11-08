#!/usr/bin/env python3
"""
Generate Russian A1-B1 Vocabulary for Dmitri Profile

Creates 180 Russian words with bilingual structure:
- Translations (Russian and English)
- Explanations (Russian and English)
- Examples (Russian and English)
- Conjugations where applicable
"""

import anthropic
import json
import os
from pathlib import Path

# Configuration
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set")

client = anthropic.Anthropic(api_key=API_KEY)
OUTPUT_FILE = Path(__file__).parent.parent / "public/data/dmitri/ru.json"

# Russian A1-B1 vocabulary categories and target words
VOCABULARY_CATEGORIES = {
    "Greetings & Basic Phrases": [
        "привет", "здравствуйте", "до свидания", "пока", "спасибо",
        "пожалуйста", "извините", "да", "нет", "как дела"
    ],
    "Numbers & Time": [
        "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь",
        "девять", "десять", "сегодня", "завтра", "вчера", "утро", "день",
        "вечер", "ночь", "час", "минута", "неделя"
    ],
    "Family & People": [
        "семья", "мать", "отец", "брат", "сестра", "сын", "дочь",
        "муж", "жена", "друг", "человек", "люди", "ребёнок", "дети"
    ],
    "Food & Drink": [
        "еда", "вода", "чай", "кофе", "молоко", "хлеб", "мясо", "рыба",
        "овощи", "фрукты", "яблоко", "картофель", "суп", "завтрак",
        "обед", "ужин", "ресторан", "кафе"
    ],
    "Common Verbs": [
        "быть", "иметь", "делать", "говорить", "знать", "хотеть", "мочь",
        "идти", "ходить", "видеть", "смотреть", "слушать", "слышать",
        "читать", "писать", "работать", "учиться", "жить", "есть", "пить",
        "спать", "любить", "думать", "понимать", "помнить"
    ],
    "Home & Objects": [
        "дом", "квартира", "комната", "кухня", "ванная", "стол", "стул",
        "кровать", "окно", "дверь", "книга", "компьютер", "телефон",
        "телевизор", "часы", "одежда", "обувь"
    ],
    "Places & Directions": [
        "город", "улица", "магазин", "школа", "университет", "работа",
        "больница", "аптека", "парк", "музей", "театр", "кино", "банк",
        "почта", "метро", "автобус", "машина", "такси"
    ],
    "Adjectives & Descriptions": [
        "большой", "маленький", "новый", "старый", "хороший", "плохой",
        "красивый", "важный", "интересный", "трудный", "лёгкий", "быстрый",
        "медленный", "горячий", "холодный", "молодой", "белый", "чёрный",
        "красный", "синий"
    ],
    "Weather & Nature": [
        "погода", "солнце", "дождь", "снег", "ветер", "облако", "небо",
        "море", "река", "лес", "гора", "дерево", "цветок"
    ],
    "Body & Health": [
        "голова", "рука", "нога", "глаз", "ухо", "нос", "здоровье",
        "врач", "болезнь", "температура"
    ],
    "Common Words": [
        "время", "год", "месяц", "страна", "язык", "имя", "вопрос",
        "ответ", "место", "дело", "жизнь", "мир", "слово", "число",
        "раз", "процесс", "результат", "проблема", "решение", "цель"
    ]
}

def generate_batch(words, batch_num, total_batches):
    """Generate vocabulary for a batch of Russian words using Claude API."""

    words_str = ", ".join(words)

    prompt = f"""Generate Russian A1-B1 vocabulary entries for Dmitri's language learning profile.

**Words to generate (Batch {batch_num}/{total_batches})**: {words_str}

**CRITICAL FORMAT REQUIREMENTS**:
1. Each word must have BILINGUAL structure with BOTH Russian (ru) and English (en)
2. Use PLURAL "translations" (not singular "translation")
3. All fields must be OBJECTS with language keys, not plain strings

**Required JSON structure for EACH word**:
```json
{{
  "word": "привет",
  "translations": {{
    "ru": "приветствие, здравствуй, здорово",
    "en": "hello, hi, greeting"
  }},
  "explanation": {{
    "ru": "Неформальное приветствие, используемое с друзьями и знакомыми в повседневном общении",
    "en": "Informal greeting used with friends and acquaintances in everyday communication"
  }},
  "examples": {{
    "ru": [
      "Привет! Как дела?",
      "Привет, друзья! Рад вас видеть!"
    ],
    "en": [
      "Hello! How are you?",
      "Hi, friends! Nice to see you!"
    ]
  }},
  "conjugations": null
}}
```

**For VERBS**, include conjugations array (present tense: я, ты, он/она, мы, вы, они):
```json
{{
  "word": "говорить",
  "translations": {{
    "ru": "сказать, разговаривать, беседовать",
    "en": "to speak, to talk, to say"
  }},
  "explanation": {{
    "ru": "Выражать мысли словами, вести разговор или беседу с кем-либо",
    "en": "To express thoughts in words, to have a conversation or discussion with someone"
  }},
  "examples": {{
    "ru": [
      "Я говорю по-русски и по-английски.",
      "Мы говорили о работе весь вечер."
    ],
    "en": [
      "I speak Russian and English.",
      "We talked about work all evening."
    ]
  }},
  "conjugations": ["говорю", "говоришь", "говорит", "говорим", "говорите", "говорят"]
}}
```

**Quality Guidelines**:
1. Translations (ru): Include synonyms and related forms in Russian
2. Translations (en): Include all common English equivalents
3. Explanation (ru): Clear, natural Russian explanation (30-60 words)
4. Explanation (en): Clear, natural English explanation (30-60 words)
5. Examples (ru): 2 authentic, natural Russian sentences showing real usage
6. Examples (en): 2 English translations matching the Russian examples
7. Conjugations: Include for verbs only (6 forms for present tense), null for non-verbs

**Return ONLY valid JSON array** - no markdown, no explanation, just the array:
[
  {{ word 1 }},
  {{ word 2 }},
  ...
]

Generate vocabulary for: {words_str}"""

    print(f"  📡 Sending batch {batch_num}/{total_batches} to Claude API ({len(words)} words)...")

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        response_text = message.content[0].text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text

        vocabulary = json.loads(response_text)

        print(f"  ✅ Batch {batch_num}/{total_batches} completed ({len(vocabulary)} words generated)")
        return vocabulary

    except json.JSONDecodeError as e:
        print(f"  ❌ JSON parsing error in batch {batch_num}: {e}")
        print(f"  Response: {response_text[:500]}...")
        raise
    except Exception as e:
        print(f"  ❌ Error in batch {batch_num}: {e}")
        raise

def main():
    """Generate complete Russian A1-B1 vocabulary."""

    print("🇷🇺 Generating Russian A1-B1 Vocabulary for Dmitri")
    print("=" * 60)

    # Flatten all words from categories
    all_words = []
    for category, words in VOCABULARY_CATEGORIES.items():
        all_words.extend(words)

    print(f"\n📊 Total words to generate: {len(all_words)}")
    print(f"📦 Categories: {len(VOCABULARY_CATEGORIES)}")

    # Generate in batches of 20 words
    batch_size = 20
    all_vocabulary = []
    batches = [all_words[i:i + batch_size] for i in range(0, len(all_words), batch_size)]
    total_batches = len(batches)

    print(f"🔄 Processing in {total_batches} batches...\n")

    for batch_num, batch in enumerate(batches, 1):
        vocabulary = generate_batch(batch, batch_num, total_batches)
        all_vocabulary.extend(vocabulary)

        if batch_num < total_batches:
            print(f"  ⏳ Waiting 2 seconds before next batch...\n")
            import time
            time.sleep(2)

    print(f"\n✅ All batches completed! Total words generated: {len(all_vocabulary)}")

    # Save to file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_vocabulary, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {OUTPUT_FILE}")
    print(f"📏 File size: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")

    # Validation
    print("\n🔍 Validating structure...")
    errors = []

    for idx, word in enumerate(all_vocabulary):
        if "translations" not in word or not isinstance(word["translations"], dict):
            errors.append(f"Word {idx}: Missing or invalid 'translations' object")
        elif "ru" not in word["translations"] or "en" not in word["translations"]:
            errors.append(f"Word {idx}: Missing 'ru' or 'en' in translations")

        if "explanation" not in word or not isinstance(word["explanation"], dict):
            errors.append(f"Word {idx}: Missing or invalid 'explanation' object")
        elif "ru" not in word["explanation"] or "en" not in word["explanation"]:
            errors.append(f"Word {idx}: Missing 'ru' or 'en' in explanation")

        if "examples" not in word or not isinstance(word["examples"], dict):
            errors.append(f"Word {idx}: Missing or invalid 'examples' object")
        elif "ru" not in word["examples"] or "en" not in word["examples"]:
            errors.append(f"Word {idx}: Missing 'ru' or 'en' in examples")

    if errors:
        print(f"❌ Found {len(errors)} validation errors:")
        for error in errors[:10]:  # Show first 10
            print(f"   - {error}")
        return False
    else:
        print("✅ All words have correct bilingual structure!")

    print("\n" + "=" * 60)
    print("🎉 Russian vocabulary generation complete!")
    print(f"📚 Generated {len(all_vocabulary)} A1-B1 words for Dmitri")
    print(f"💾 Saved to: {OUTPUT_FILE}")
    print("\nNext steps:")
    print("1. npm run build")
    print("2. npx cap sync ios")
    print("3. Test Russian vocabulary practice")

    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
