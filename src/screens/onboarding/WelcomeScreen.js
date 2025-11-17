/**
 * WelcomeScreen.js
 * Screen 1: Welcome message with Get Started / Classic User options
 */

export class WelcomeScreen {
  constructor(manager) {
    this.manager = manager;
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen welcome-screen';

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <div class="welcome-hero">
          <div class="welcome-icon">✨</div>
          <h1 class="welcome-title">Welcome to LingXM</h1>
          <p class="welcome-subtitle">Master any language with intelligent practice</p>
        </div>

        <div class="welcome-actions">
          <button class="btn-welcome-primary" id="btn-get-started">
            Get Started
          </button>
          <button class="btn-welcome-secondary" id="btn-classic-user">
            I'm a Classic User
          </button>
        </div>

        <div class="welcome-features">
          <div class="welcome-feature">
            <span class="feature-icon">🎯</span>
            <span class="feature-text">Personalized learning paths</span>
          </div>
          <div class="welcome-feature">
            <span class="feature-icon">📊</span>
            <span class="feature-text">Track your progress</span>
          </div>
          <div class="welcome-feature">
            <span class="feature-icon">🗣️</span>
            <span class="feature-text">Practice pronunciation</span>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnGetStarted = screen.querySelector('#btn-get-started');
      const btnClassicUser = screen.querySelector('#btn-classic-user');

      btnGetStarted.addEventListener('click', () => {
        this.manager.next();
      });

      btnClassicUser.addEventListener('click', () => {
        this.manager.activateClassicMode();
      });
    }, 0);

    return screen;
  }

  validate() {
    return true;
  }
}
