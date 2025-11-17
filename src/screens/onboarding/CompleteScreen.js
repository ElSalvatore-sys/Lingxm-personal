/**
 * CompleteScreen.js
 * Screen 8: Summary and completion
 */

export class CompleteScreen {
  constructor(manager) {
    this.manager = manager;
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen complete-screen';

    // Get all collected data
    const userData = this.manager.userData;

    // Language mappings
    const languages = {
      en: { name: 'English', flag: '🇬🇧' },
      de: { name: 'German', flag: '🇩🇪' },
      ar: { name: 'Arabic', flag: '🇸🇦' },
      pl: { name: 'Polish', flag: '🇵🇱' },
      fr: { name: 'French', flag: '🇫🇷' },
      fa: { name: 'Persian', flag: '🇮🇷' },
      it: { name: 'Italian', flag: '🇮🇹' },
      ru: { name: 'Russian', flag: '🇷🇺' }
    };

    const nativeLang = languages[userData.nativeLanguage];
    const learningLang = languages[userData.learningLanguage];
    const contextLang = userData.contextLanguage ? languages[userData.contextLanguage] : null;

    // Specialization names
    const specializationNames = {
      'business': 'Business vocabulary',
      'gastronomy': 'Gastronomy vocabulary',
      'it': 'IT & Technology vocabulary',
      'medical': 'Medical vocabulary',
      'urban-planning': 'Urban Planning vocabulary'
    };

    const specializationsText = userData.specializations.length > 0
      ? userData.specializations.map(s => specializationNames[s]).join(', ')
      : 'General learning';

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <div class="complete-header">
          <div class="complete-icon">✨</div>
          <h2 class="complete-title">You're all set!</h2>
          <p class="complete-subtitle">Your personalized learning path is ready</p>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-icon">🗣️</span>
            <div class="summary-content">
              <div class="summary-label">Native</div>
              <div class="summary-value">${nativeLang.flag} ${nativeLang.name}</div>
            </div>
          </div>

          <div class="summary-item">
            <span class="summary-icon">📚</span>
            <div class="summary-content">
              <div class="summary-label">Learning</div>
              <div class="summary-value">${learningLang.flag} ${learningLang.name} (${userData.level})</div>
            </div>
          </div>

          ${contextLang ? `
            <div class="summary-item">
              <span class="summary-icon">💡</span>
              <div class="summary-content">
                <div class="summary-label">Extra help</div>
                <div class="summary-value">${contextLang.flag} ${contextLang.name}</div>
              </div>
            </div>
          ` : ''}

          <div class="summary-item">
            <span class="summary-icon">🎯</span>
            <div class="summary-content">
              <div class="summary-label">Focus</div>
              <div class="summary-value">${specializationsText}</div>
            </div>
          </div>
        </div>

        <button class="btn-start-learning" id="btn-start">
          Start Learning!
        </button>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnStart = screen.querySelector('#btn-start');

      btnStart.addEventListener('click', async () => {
        await this.completeOnboarding();
      });
    }, 0);

    return screen;
  }

  async completeOnboarding() {
    try {
      // Show loading state
      const btnStart = document.querySelector('#btn-start');
      const originalText = btnStart.textContent;
      btnStart.textContent = 'Creating your profile...';
      btnStart.disabled = true;

      // Create profile in database
      await this.manager.createProfile();

      // Success handled by manager (shows home screen)
    } catch (error) {
      console.error('Error completing onboarding:', error);

      // Reset button
      const btnStart = document.querySelector('#btn-start');
      if (btnStart) {
        btnStart.textContent = 'Start Learning!';
        btnStart.disabled = false;
      }
    }
  }

  validate() {
    return true;
  }
}
