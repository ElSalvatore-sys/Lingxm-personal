#!/usr/bin/env python3
"""Universal Vocabulary Batch Prompt Generator"""

import os

# Complete word list (500 most common words)
WORD_BATCHES = {
    2: ["have", "do", "go", "get", "make", "know", "think", "take", "see", "come",
        "want", "look", "use", "find", "give", "tell", "work", "call", "try", "need"],
    3: ["time", "person", "year", "way", "day", "man", "thing", "woman", "life", "child",
        "world", "school", "state", "family", "student", "group", "country", "problem", "hand", "part"],
    4: ["ask", "seem", "feel", "leave", "put", "mean", "keep", "let", "begin", "help",
        "talk", "turn", "start", "show", "hear", "play", "run", "move", "like", "live"],
    5: ["good", "new", "first", "last", "long", "great", "little", "own", "other", "old",
        "right", "big", "high", "different", "small", "large", "next", "early", "young", "important"],
    6: ["week", "company", "system", "program", "question", "government", "number", "night", "point", "home",
        "water", "room", "mother", "area", "money", "story", "fact", "month", "lot", "book"],
    7: ["say", "should", "could", "would", "write", "sit", "stand", "lose", "pay", "meet",
        "include", "continue", "set", "learn", "change", "lead", "understand", "watch", "follow", "stop"],
    8: ["with", "from", "about", "into", "after", "without", "before", "under", "between", "through",
        "during", "against", "among", "since", "until", "although", "while", "because", "however", "therefore"],
    9: ["same", "few", "able", "bad", "better", "best", "worse", "worst", "real", "free",
        "human", "public", "private", "sure", "clear", "whole", "late", "recent", "possible", "general"],
    10: ["eye", "face", "head", "arm", "heart", "door", "body", "car", "city", "house",
         "office", "street", "hour", "idea", "information", "business", "service", "friend", "father", "power"],
    11: ["mother", "son", "daughter", "brother", "sister", "market", "price", "form", "music", "buy",
         "food", "land", "travel", "method", "store", "film", "doctor", "wall", "patient", "worker"],
    12: ["news", "report", "term", "court", "fear", "deal", "evidence", "product", "rest", "voice",
         "region", "magazine", "material", "society", "author", "budget", "source", "meeting", "choice", "past"],
    13: ["future", "simple", "sound", "save", "build", "stay", "fall", "cut", "raise", "pass",
         "sell", "require", "report", "decide", "pull", "study", "left", "note", "plan", "market"],
    14: ["explain", "hope", "develop", "carry", "break", "receive", "agree", "support", "hit", "produce",
         "eat", "claim", "plan", "base", "cause", "listen", "message", "control", "strong", "wonder"],
    15: ["easy", "effect", "patient", "financial", "knowledge", "fight", "picture", "politics", "opportunity", "light",
         "return", "forget", "describe", "enjoy", "charge", "apply", "admit", "appear", "accept", "concern"],
    16: ["measure", "resource", "growth", "technology", "method", "attention", "generation", "memory", "staff", "choose",
         "discussion", "popular", "traditional", "compare", "pattern", "avoid", "suffer", "director", "focus", "foreign"],
    17: ["hang", "religious", "medical", "reality", "arrive", "newspaper", "husband", "shot", "exist", "reduce",
         "decade", "argue", "capital", "improve", "customer", "natural", "billion", "marriage", "maintain", "degree"],
    18: ["blood", "above", "discussion", "agent", "occur", "performance", "culture", "contain", "security", "discover",
         "lawyer", "employee", "disease", "operation", "analysis", "behavior", "section", "throughout", "generation", "direction"],
    19: ["everything", "conference", "unit", "attack", "reveal", "attorney", "determine", "traffic", "rock", "consumer",
         "participant", "ball", "pressure", "reader", "influence", "writer", "activity", "ordinary", "assessment", "insurance"],
    20: ["component", "senior", "peace", "injury", "weapon", "academic", "notion", "affair", "institution", "neither",
         "revolution", "accompany", "southern", "legislation", "leadership", "survey", "distinction", "arrangement", "fundamental", "nuclear"],
    21: ["appeal", "defendant", "regulate", "distinguish", "foundation", "dominate", "enable", "contemporary", "minority", "governor",
         "enterprise", "locate", "panel", "territory", "portion", "constitutional", "tremendous", "consultant", "expansion", "approval"],
    22: ["numerous", "manufacture", "welfare", "championship", "framework", "athlete", "phenomenon", "counsel", "guideline", "facilitate",
         "convention", "municipal", "phenomenon", "observer", "advocate", "legislation", "rehabilitation", "eligible", "insufficient", "awareness"],
    23: ["syndrome", "chronic", "controversial", "comprehensive", "jurisdiction", "implicit", "commodity", "enforce", "stimulate", "proportion",
         "complement", "inevitable", "offset", "preliminary", "reinforce", "alleged", "underlying", "contemplate", "arbitrary", "thereby"],
    24: ["equip", "aggregate", "allocate", "accumulate", "minimal", "inherent", "equivalent", "invoke", "whereby", "restraint",
         "empirical", "coordinate", "compensate", "manipulate", "implicit", "coherent", "intrinsic", "likewise", "nonetheless", "hierarchy"],
    25: ["subordinate", "anomaly", "supplement", "integrity", "explicit", "qualitative", "ambiguous", "diminish", "contemporary", "arbitrary",
         "thereby", "infrastructure", "ethic", "differentiate", "incentive", "paradigm", "arbitrary", "likewise", "whereby", "nonetheless"]
}

LANGUAGES = {
    'en': 'English',
    'de': 'German',
    'es': 'Spanish',
    'ar': 'Arabic',
    'fr': 'French',
    'it': 'Italian',
    'ru': 'Russian',
    'pl': 'Polish',
    'fa': 'Persian'
}

def generate_prompt(lang_code, lang_name, batch_num):
    words = WORD_BATCHES[batch_num]
    word_start = (batch_num - 1) * 20 + 1
    word_end = batch_num * 20
    word_list = "\n".join(f"{i+1}. {word}" for i, word in enumerate(words))
    
    return f"""# GENERATE: {lang_name} A1 Vocabulary - Batch {batch_num} (20 words)

## Critical Requirements (EXACT SAME AS BATCH 1)
- **EXACTLY 20 words** per batch
- **ALL 9 language translations** (en, de, ar, fr, it, ru, es, pl, fa)
- **Explanations in all 9 languages** (simple, A1-appropriate)
- **3 example sentences per language** (27 examples per word)
- **Conjugations = null** for all words
- **UTF-8 encoding** for Arabic, Persian, Cyrillic scripts
- **Valid JSON** structure

## Words to Generate (Batch {batch_num}: Words {word_start}-{word_end})

{word_list}

## Output Format (EXACT SCHEMA FROM BATCH 1)

Create file: `public/data/universal/{lang_code}-a1-batch{batch_num}.json`

**CRITICAL: Use EXACTLY this format for quality consistency!**
"""

def main():
    os.makedirs("prompts_batch2-25", exist_ok=True)
    print("🚀 Generating batch prompts...")
    print("=" * 60)
    
    total = 0
    for lang_code, lang_name in LANGUAGES.items():
        start_batch = 3 if lang_code == 'fr' else 2
        
        for batch_num in range(start_batch, 26):
            prompt = generate_prompt(lang_code, lang_name, batch_num)
            filename = f"prompts_batch2-25/{lang_code}_batch{batch_num:02d}.md"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(prompt)
            total += 1
            print(f"✅ {filename}")
    
    print("=" * 60)
    print(f"📊 Total prompts generated: {total}")
    print(f"📁 Location: ./prompts_batch2-25/")
    print("\n✅ STEP 1 COMPLETE!")

if __name__ == "__main__":
    main()
