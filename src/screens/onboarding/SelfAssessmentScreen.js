/**
 * SelfAssessmentScreen.js
 * Screen 5: Self-assess CEFR level (A1-C2)
 */

export class SelfAssessmentScreen {
  constructor(manager) {
    this.manager = manager;
    this.selectedLevel = null;
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen assessment-screen';

    // Get learning language for display
    const learningLangCode = this.manager.getData('learningLanguage');
    const languages = {
      en: 'English', de: 'German', ar: 'Arabic', pl: 'Polish',
      fr: 'French', fa: 'Persian', it: 'Italian', ru: 'Russian'
    };
    const learningLanguageName = languages[learningLangCode] || 'this language';

    // CEFR levels with descriptions
    const levels = [
      {
        code: 'A1',
        name: 'Complete Beginner',
        description: "I'm just starting out",
        color: '#10b981'
      },
      {
        code: 'A2',
        name: 'Elementary',
        description: 'I know basic phrases',
        color: '#3b82f6'
      },
      {
        code: 'B1',
        name: 'Intermediate',
        description: 'I can have simple conversations',
        color: '#8b5cf6'
      },
      {
        code: 'B2',
        name: 'Upper Intermediate',
        description: "I'm comfortable in most situations",
        color: '#ec4899'
      },
      {
        code: 'C1',
        name: 'Advanced',
        description: "I'm fluent and precise",
        color: '#f59e0b'
      },
      {
        code: 'C2',
        name: 'Mastery',
        description: 'Near-native proficiency',
        color: '#ef4444'
      }
    ];

    const levelCards = levels.map(level => `
      <div class="level-card" data-level="${level.code}">
        <div class="level-badge" style="background: ${level.color};">${level.code}</div>
        <div class="level-info">
          <div class="level-name">${level.name}</div>
          <div class="level-description">${level.description}</div>
        </div>
      </div>
    `).join('');

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <button class="btn-back" id="btn-back">
          ← Back
        </button>

        <div class="screen-header">
          <h2 class="screen-title">How well do you speak ${learningLanguageName}?</h2>
          <p class="screen-subtitle">Be honest - this helps us personalize your experience</p>
        </div>

        <div class="levels-container">
          ${levelCards}
        </div>

        <button class="btn-test-alternative" id="btn-quick-test">
          📝 Take a Quick Test Instead
        </button>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnBack = screen.querySelector('#btn-back');
      const btnQuickTest = screen.querySelector('#btn-quick-test');
      const levelCards = screen.querySelectorAll('.level-card');

      btnBack.addEventListener('click', () => {
        this.manager.back();
      });

      btnQuickTest.addEventListener('click', () => {
        this.showQuickTestPlaceholder();
      });

      levelCards.forEach(card => {
        card.addEventListener('click', () => {
          const levelCode = card.dataset.level;
          this.selectLevel(levelCode, card);
        });
      });
    }, 0);

    return screen;
  }

  selectLevel(code, cardElement) {
    this.selectedLevel = code;

    // Visual feedback
    const allCards = cardElement.parentElement.querySelectorAll('.level-card');
    allCards.forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // Store data and auto-advance after brief delay
    setTimeout(() => {
      this.collectData();
      this.manager.next();
    }, 400);
  }

  showQuickTestPlaceholder() {
    this.manager.showModal(
      'Coming Soon! 🚀',
      'Quick level assessment is being developed. For now, please select your estimated level. You can always adjust it later in settings.',
      'Got it'
    );
  }

  collectData() {
    this.manager.setData('level', this.selectedLevel);
  }

  validate() {
    if (!this.selectedLevel) {
      this.manager.showError('Please select your proficiency level');
      return false;
    }
    return true;
  }
}
