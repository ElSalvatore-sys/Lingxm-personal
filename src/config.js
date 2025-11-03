export const PROFILES = {
  vahiko: {
    name: 'Vahiko',
    emoji: '👩‍💼',
    interfaceLanguages: ['pl', 'de'],
    learningLanguages: [
      {
        code: 'de',
        name: 'German',
        level: 'C1',
        specialty: 'Stadtplanung/Stadtverwaltung',
        dailyWords: 10,
        flag: '🇩🇪'
      },
      {
        code: 'en',
        name: 'English',
        level: 'B1-B2',
        dailyWords: 10,
        flag: '🇬🇧'
      }
    ],
    totalDailyWords: 20
  },
  hassan: {
    name: 'Hassan',
    emoji: '👨‍💻',
    interfaceLanguages: ['en', 'ar'],
    learningLanguages: [
      {
        code: 'ar',
        name: 'Arabic',
        level: 'C1-C2',
        dailyWords: 10,
        flag: '🇸🇦'
      },
      {
        code: 'en',
        name: 'English',
        level: 'C1-C2',
        dailyWords: 10,
        flag: '🇬🇧'
      },
      {
        code: 'de',
        name: 'German',
        level: 'B1-B2',
        dailyWords: 10,
        flag: '🇩🇪'
      }
    ],
    totalDailyWords: 30
  },
  salman: {
    name: 'Frau Salman',
    emoji: '👩‍🍳',
    interfaceLanguages: ['ar', 'de'],
    learningLanguages: [
      {
        code: 'de',
        name: 'German',
        level: 'B1-B2',
        dailyWords: 10,
        flag: '🇩🇪'
      },
      {
        code: 'de-gastro',
        name: 'German (Gastronomy)',
        level: 'B1-B2',
        specialty: 'Gastronomy & Hotel',
        dailyWords: 10,
        flag: '🇩🇪🍽️'
      },
      {
        code: 'fr',
        name: 'French (Gastronomy)',
        level: 'B1-B2',
        specialty: 'Gastronomy',
        dailyWords: 10,
        flag: '🇫🇷🍽️'
      },
      {
        code: 'en',
        name: 'English',
        level: 'A1-A2',
        dailyWords: 10,
        flag: '🇬🇧'
      }
    ],
    totalDailyWords: 40
  },
  kafel: {
    name: 'Kafel',
    emoji: '👨‍💻',
    interfaceLanguages: ['en', 'de'],
    learningLanguages: [
      {
        code: 'de',
        name: 'German',
        level: 'B2-C1',
        dailyWords: 10,
        flag: '🇩🇪'
      },
      {
        code: 'de-it',
        name: 'German (IT)',
        level: 'B2',
        specialty: 'IT Umschulung - Anwendungsentwicklung',
        dailyWords: 10,
        flag: '🇩🇪💻'
      },
      {
        code: 'en',
        name: 'English',
        level: 'C1-C2',
        dailyWords: 10,
        flag: '🇬🇧'
      }
    ],
    totalDailyWords: 30
  },
  jawad: {
    name: 'Jawad',
    emoji: '👨‍🍳',
    interfaceLanguages: ['ar', 'de'],
    learningLanguages: [
      {
        code: 'de',
        name: 'German',
        level: 'C1',
        dailyWords: 10,
        flag: '🇩🇪'
      },
      {
        code: 'de-gastro',
        name: 'German (Gastronomy)',
        level: 'B1-B2',
        specialty: 'Hotel Reception',
        dailyWords: 10,
        flag: '🇩🇪🍽️'
      },
      {
        code: 'fr',
        name: 'French (Gastronomy)',
        level: 'B1-B2',
        specialty: 'Gastronomy',
        dailyWords: 10,
        flag: '🇫🇷🍽️'
      },
      {
        code: 'en',
        name: 'English',
        level: 'C1-C2',
        dailyWords: 10,
        flag: '🇬🇧'
      }
    ],
    totalDailyWords: 40
  },
  ameeno: {
    name: 'Ameeno',
    emoji: '🧑‍🎓',
    interfaceLanguages: ['fa', 'en'],
    learningLanguages: [
      {
        code: 'de',
        name: 'German',
        level: 'B1-B2',
        dailyWords: 10,
        flag: '🇩🇪'
      },
      {
        code: 'en',
        name: 'English',
        level: 'B1-B2',
        dailyWords: 10,
        flag: '🇬🇧'
      },
      {
        code: 'it',
        name: 'Italian',
        level: 'A1',
        dailyWords: 10,
        flag: '🇮🇹'
      }
    ],
    totalDailyWords: 30
  }
};

export const LANGUAGE_NAMES = {
  en: { native: 'English', local: 'English' },
  de: { native: 'Deutsch', local: 'German' },
  ar: { native: 'العربية', local: 'Arabic' },
  pl: { native: 'Polski', local: 'Polish' },
  fr: { native: 'Français', local: 'French' },
  fa: { native: 'فارسی', local: 'Persian/Farsi' },
  it: { native: 'Italiano', local: 'Italian' }
};

export const SECTION_LABELS = {
  explanation: {
    ar: 'شرح',
    de: 'Erklärung',
    en: 'Explanation',
    pl: 'Wyjaśnienie',
    fr: 'Explication',
    fa: 'توضیح',
    it: 'Spiegazione'
  },
  conjugation: {
    ar: 'تصريف',
    de: 'Konjugation',
    en: 'Conjugation',
    pl: 'Odmiana',
    fr: 'Conjugaison',
    fa: 'صرف',
    it: 'Coniugazione'
  },
  example1: {
    ar: 'مثال ١',
    de: 'Beispiel 1',
    en: 'Example 1',
    pl: 'Przykład 1',
    fr: 'Exemple 1',
    fa: 'مثال ۱',
    it: 'Esempio 1'
  },
  example2: {
    ar: 'مثال ٢',
    de: 'Beispiel 2',
    en: 'Example 2',
    pl: 'Przykład 2',
    fr: 'Exemple 2',
    fa: 'مثال ۲',
    it: 'Esempio 2'
  }
};
