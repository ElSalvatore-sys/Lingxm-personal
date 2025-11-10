# Polish A1 Vocabulary Generation Scripts

Automation tools for generating Polish A1 vocabulary batches 7-25 (words 121-500).

## 📊 Current Status

| Batch | Words | Status |
|-------|-------|--------|
| 1 | 1-20 | ✅ Complete |
| 2 | 21-40 | ✅ Complete |
| 3 | 41-60 | ✅ Complete |
| 4 | 61-80 | ✅ Complete |
| 5 | 81-100 | ✅ Complete |
| 6 | 101-120 | ✅ Complete |
| **7-25** | **121-500** | **⏳ To Generate** |

**Remaining:** 380 words across 19 batches

---

## 🚀 Available Scripts

### Option 1: AI-Powered Generation (Recommended)

**Script:** `generate-polish-vocab-ai.py`

Uses Claude API to automatically generate high-quality translations in all 9 languages.

#### Prerequisites
```bash
# Install anthropic package
pip install anthropic

# Set your API key
export ANTHROPIC_API_KEY='sk-ant-...'
```

#### Usage
```bash
# From project root
python3 scripts/generate-polish-vocab-ai.py
```

#### Features
- ✅ Automatic translation to all 9 languages
- ✅ Context-aware explanations
- ✅ Natural A1-level example sentences
- ✅ Proper handling of special characters (Arabic, Cyrillic, Polish diacritics, Persian)
- ✅ Automatic validation

#### Cost & Time
- **Time:** ~45-60 minutes for all 19 batches
- **Cost:** ~$2-4 USD (Claude API usage)
- **Quality:** High - AI-generated with context

---

### Option 2: Template Generation

**Script:** `generate-polish-vocab-batches.py`

Generates template files with placeholders that you fill in manually.

#### Usage
```bash
# From project root
python3 scripts/generate-polish-vocab-batches.py
```

#### Features
- ✅ Extracts words from prompt files
- ✅ Creates JSON structure
- ⚠️  Contains placeholders like `[PL_XXX]`, `[DE: word]`
- ⚠️  Requires manual translation

#### When to use
- No API key available
- Want full manual control
- Combining with translation tools (DeepL, Google Translate)

---

## 📁 Output Structure

Generated files will be saved to:
```
public/data/universal/
├── pl-a1-batch1.json   ✅ (already committed)
├── pl-a1-batch2.json   ✅ (already committed)
├── pl-a1-batch3.json   ✅ (already committed)
├── pl-a1-batch4.json   ✅ (already committed)
├── pl-a1-batch5.json   ✅ (already committed)
├── pl-a1-batch6.json   ✅ (already committed)
├── pl-a1-batch7.json   ⏳ (to generate)
├── pl-a1-batch8.json   ⏳ (to generate)
...
└── pl-a1-batch25.json  ⏳ (to generate)
```

---

## ✅ Validation

### Validate single batch
```bash
jq . public/data/universal/pl-a1-batch7.json
```

### Validate all batches
```bash
for i in {1..25}; do
  jq . public/data/universal/pl-a1-batch${i}.json > /dev/null && echo "✅ Batch $i" || echo "❌ Batch $i"
done
```

### Count words per batch
```bash
for i in {1..25}; do
  count=$(jq 'length' public/data/universal/pl-a1-batch${i}.json 2>/dev/null)
  echo "Batch $i: $count words"
done
```

---

## 🔧 Manual Workflow (If using templates)

### 1. Generate templates
```bash
python3 scripts/generate-polish-vocab-batches.py
```

### 2. Fill in translations

For each batch file, replace placeholders:

**Before:**
```json
{
  "word": "[PL_121]",
  "translations": {
    "en": "big",
    "de": "[DE: big]",
    "ar": "[AR: big]",
    ...
  }
}
```

**After:**
```json
{
  "word": "duży",
  "translations": {
    "en": "big",
    "de": "groß",
    "ar": "كبير",
    ...
  }
}
```

### 3. Validate
```bash
jq . public/data/universal/pl-a1-batch7.json
```

### 4. Repeat for all batches

---

## 🌍 Translation Requirements

Each word needs translations in **9 languages:**

| Code | Language | Script | Example |
|------|----------|--------|---------|
| `en` | English | Latin | "hello" |
| `de` | German | Latin | "hallo" |
| `ar` | Arabic | Arabic | "مرحبا" |
| `fr` | French | Latin | "bonjour" |
| `it` | Italian | Latin | "ciao" |
| `ru` | Russian | Cyrillic | "привет" |
| `es` | Spanish | Latin | "hola" |
| `pl` | Polish | Latin + diacritics | "cześć" |
| `fa` | Persian | Persian | "سلام" |

### Special Characters

**Polish diacritics:**
- ą, ć, ę, ł, ń, ó, ś, ź, ż

**RTL Languages:**
- Arabic (ar) and Persian (fa) require proper RTL encoding

**Cyrillic:**
- Russian (ru) must use Cyrillic script

---

## 📋 Word Categories

Batches 7-25 will include:

- **Verbs:** action words (kupować, sprzedawać, czytać...)
- **Nouns:** common objects (dom, miasto, samochód...)
- **Adjectives:** descriptive words (piękny, mały, dobry...)
- **Adverbs:** time/manner (dzisiaj, zawsze, szybko...)
- **Numbers:** 11-100 (jedenaście, dwadzieścia...)
- **Prepositions:** w, na, pod, z...
- **Conjunctions:** i, ale, bo...

---

## 🎯 After Generation

### 1. Validate all files
```bash
node scripts/validate-vocabulary-data.js
```

### 2. Git commit
```bash
git add public/data/universal/pl-a1-batch{7..25}.json

git commit -m "feat(vocab): Polish A1 batches 7-25 (words 121-500) with 9-language support

Generated 380 Polish A1 vocabulary words (19 batches × 20 words) with complete
translations, explanations, and examples in all 9 languages.

Total: 380 words × 9 languages = 3,420 translations + 10,260 examples

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. Push to branch
```bash
git push origin generation/pl-a1
```

---

## 💡 Tips & Best Practices

### Quality Checks
- ✅ All example sentences use A1-level grammar
- ✅ Examples are contextually relevant
- ✅ Proper use of diacritics in Polish
- ✅ RTL text displays correctly
- ✅ No placeholder text remains

### Translation Resources (if manual)
- **DeepL:** https://www.deepl.com/ (best quality)
- **Google Translate:** https://translate.google.com/
- **Reverso Context:** https://context.reverso.net/ (for examples)
- **Polish dictionaries:** https://sjp.pwn.pl/

### Testing
1. Open a batch file in VS Code
2. Check for `[TODO]` or `[PL_XXX]` placeholders
3. Validate JSON syntax
4. Test RTL display for Arabic/Persian

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not set"
```bash
export ANTHROPIC_API_KEY='your-key-here'
```

### "anthropic package not installed"
```bash
pip install anthropic
```

### "Prompt file not found"
```bash
# Make sure you're in project root
cd /Users/eldiaploo/Desktop/LingXM-Personal
python3 scripts/generate-polish-vocab-ai.py
```

### "Invalid JSON"
```bash
# Validate and fix
jq . public/data/universal/pl-a1-batch7.json
```

### "Permission denied"
```bash
chmod +x scripts/generate-polish-vocab-ai.py
```

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review existing batches 1-6 as examples
3. Validate JSON structure with `jq`
4. Check git status before committing

---

## 🎉 Progress Tracking

Update this as you complete batches:

- [x] Batch 1-6 (words 1-120) ✅
- [ ] Batch 7 (words 121-140)
- [ ] Batch 8 (words 141-160)
- [ ] Batch 9 (words 161-180)
- [ ] Batch 10 (words 181-200)
- [ ] Batch 11 (words 201-220)
- [ ] Batch 12 (words 221-240)
- [ ] Batch 13 (words 241-260)
- [ ] Batch 14 (words 261-280)
- [ ] Batch 15 (words 281-300)
- [ ] Batch 16 (words 301-320)
- [ ] Batch 17 (words 321-340)
- [ ] Batch 18 (words 341-360)
- [ ] Batch 19 (words 361-380)
- [ ] Batch 20 (words 381-400)
- [ ] Batch 21 (words 401-420)
- [ ] Batch 22 (words 421-440)
- [ ] Batch 23 (words 441-460)
- [ ] Batch 24 (words 461-480)
- [ ] Batch 25 (words 481-500)

**Total Progress:** 120/500 words (24%)
