/**
 * ContextLanguageScreen.js
 * Screen 4: Optional context/helper language for extra translations
 */

export class ContextLanguageScreen {
  constructor(manager) {
    this.manager = manager;
    this.selectedLanguage = null;
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen context-language-screen';

    // All available languages
    const allLanguages = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'de', name: 'German', flag: '🇩🇪' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
      { code: 'pl', name: 'Polish', flag: '🇵🇱' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'fa', name: 'Persian', flag: '🇮🇷' },
      { code: 'it', name: 'Italian', flag: '🇮🇹' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺' }
    ];

    // Filter out native and learning languages
    const nativeLanguage = this.manager.getData('nativeLanguage');
    const learningLanguage = this.manager.getData('learningLanguage');
    const languages = allLanguages.filter(lang =>
      lang.code !== nativeLanguage && lang.code !== learningLanguage
    );

    // Find native language for recommendation
    const nativeLang = allLanguages.find(lang => lang.code === nativeLanguage);

    const languageCards = languages.map(lang => `
      <div class="language-card" data-language="${lang.code}">
        <div class="language-flag">${lang.flag}</div>
        <div class="language-name">${lang.name}</div>
      </div>
    `).join('');

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <button class="btn-back" id="btn-back">
          ← Back
        </button>

        <div class="screen-header">
          <h2 class="screen-title">Extra help language?</h2>
          <p class="screen-subtitle">Get translations in a second language for extra context</p>
        </div>

        <div class="context-recommendation">
          <div class="language-card recommended" data-language="${nativeLanguage}">
            <div class="language-flag">${nativeLang.flag}</div>
            <div class="language-name">${nativeLang.name}</div>
            <span class="recommended-badge">Recommended</span>
          </div>
        </div>

        <div class="language-grid">
          ${languageCards}
        </div>

        <button class="btn-skip" id="btn-skip">
          Skip - I don't need extra help
        </button>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnBack = screen.querySelector('#btn-back');
      const btnSkip = screen.querySelector('#btn-skip');
      const recommendedCard = screen.querySelector('.recommended');
      const languageCards = screen.querySelectorAll('.language-card:not(.recommended)');

      btnBack.addEventListener('click', () => {
        this.manager.back();
      });

      btnSkip.addEventListener('click', () => {
        this.selectedLanguage = null;
        this.collectData();
        this.manager.next();
      });

      recommendedCard.addEventListener('click', () => {
        const languageCode = recommendedCard.dataset.language;
        this.selectLanguage(languageCode, recommendedCard);
      });

      languageCards.forEach(card => {
        card.addEventListener('click', () => {
          const languageCode = card.dataset.language;
          this.selectLanguage(languageCode, card);
        });
      });
    }, 0);

    return screen;
  }

  selectLanguage(code, cardElement) {
    this.selectedLanguage = code;

    // Visual feedback
    const allCards = document.querySelectorAll('.context-language-screen .language-card');
    allCards.forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // Store data and auto-advance after brief delay
    setTimeout(() => {
      this.collectData();
      this.manager.next();
    }, 400);
  }

  collectData() {
    this.manager.setData('contextLanguage', this.selectedLanguage);
  }

  validate() {
    // This screen is optional, always valid
    return true;
  }
}
