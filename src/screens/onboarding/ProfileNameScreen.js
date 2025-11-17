/**
 * ProfileNameScreen.js
 * Screen 6: Enter profile name
 */

export class ProfileNameScreen {
  constructor(manager) {
    this.manager = manager;
    this.userName = '';
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen profile-name-screen';

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <button class="btn-back" id="btn-back">
          ← Back
        </button>

        <div class="screen-header">
          <h2 class="screen-title">What should we call you?</h2>
          <p class="screen-subtitle">This helps personalize your experience</p>
        </div>

        <div class="name-input-container">
          <div class="emoji-display">👤</div>
          <input
            type="text"
            id="input-name"
            class="name-input"
            placeholder="Enter your name"
            maxlength="20"
            autocomplete="off"
            autofocus
          />
          <div class="char-counter">
            <span id="char-count">0</span>/20
          </div>
        </div>

        <button class="btn-primary-modern" id="btn-continue" disabled>
          Continue
        </button>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnBack = screen.querySelector('#btn-back');
      const btnContinue = screen.querySelector('#btn-continue');
      const inputName = screen.querySelector('#input-name');
      const charCount = screen.querySelector('#char-count');

      btnBack.addEventListener('click', () => {
        this.manager.back();
      });

      btnContinue.addEventListener('click', () => {
        if (this.validate()) {
          this.collectData();
          this.manager.next();
        }
      });

      inputName.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        this.userName = value;
        charCount.textContent = value.length;

        // Enable/disable continue button
        btnContinue.disabled = value.length === 0;
      });

      inputName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.userName.length > 0) {
          if (this.validate()) {
            this.collectData();
            this.manager.next();
          }
        }
      });
    }, 0);

    return screen;
  }

  collectData() {
    this.manager.setData('name', this.userName);
  }

  validate() {
    if (!this.userName || this.userName.trim().length === 0) {
      this.manager.showError('Please enter your name');
      return false;
    }
    if (this.userName.length < 2) {
      this.manager.showError('Name must be at least 2 characters');
      return false;
    }
    return true;
  }
}
