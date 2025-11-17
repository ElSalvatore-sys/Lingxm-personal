/**
 * LearningLanguageScreen.js
 * Screen 3: Select target learning language
 */

export class LearningLanguageScreen {
  constructor(manager) {
    this.manager = manager;
    this.selectedLanguage = null;
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen language-selection-screen';

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

    // Filter out native language
    const nativeLanguage = this.manager.getData('nativeLanguage');
    const languages = allLanguages.filter(lang => lang.code !== nativeLanguage);

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
          <h2 class="screen-title">I want to learn...</h2>
          <p class="screen-subtitle">Choose your first language (you can add more later)</p>
        </div>

        <div class="language-grid">
          ${languageCards}
        </div>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnBack = screen.querySelector('#btn-back');
      const languageCards = screen.querySelectorAll('.language-card');

      btnBack.addEventListener('click', () => {
        this.manager.back();
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
    const allCards = cardElement.parentElement.querySelectorAll('.language-card');
    allCards.forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // Store data and auto-advance after brief delay
    setTimeout(() => {
      this.collectData();
      this.manager.next();
    }, 400);
  }

  collectData() {
    this.manager.setData('learningLanguage', this.selectedLanguage);
  }

  validate() {
    if (!this.selectedLanguage) {
      this.manager.showError('Please select a language to learn');
      return false;
    }
    return true;
  }
}
