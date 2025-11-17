/**
 * SpecializationsScreen.js
 * Screen 7: Optional specialty/focus areas
 */

export class SpecializationsScreen {
  constructor(manager) {
    this.manager = manager;
    this.selectedSpecializations = [];
  }

  render() {
    const screen = document.createElement('div');
    screen.className = 'onboarding-screen specializations-screen';

    // Specialization options
    const specializations = [
      { id: 'business', name: 'Business', icon: '💼' },
      { id: 'gastronomy', name: 'Gastronomy', icon: '🍽️' },
      { id: 'it', name: 'IT & Technology', icon: '💻' },
      { id: 'medical', name: 'Medical', icon: '🏥' },
      { id: 'urban-planning', name: 'Urban Planning', icon: '🏙️' }
    ];

    const specializationCards = specializations.map(spec => `
      <div class="specialization-card" data-specialization="${spec.id}">
        <div class="specialization-icon">${spec.icon}</div>
        <div class="specialization-name">${spec.name}</div>
        <div class="specialization-check">✓</div>
      </div>
    `).join('');

    screen.innerHTML = `
      <div class="onboarding-screen-content">
        <button class="btn-back" id="btn-back">
          ← Back
        </button>

        <div class="screen-header">
          <h2 class="screen-title">Any specific interests?</h2>
          <p class="screen-subtitle">Focus on vocabulary for your field (optional)</p>
        </div>

        <div class="specializations-grid">
          ${specializationCards}
        </div>

        <div class="specializations-actions">
          <button class="btn-skip" id="btn-skip">
            Skip - General learning only
          </button>
          <button class="btn-primary-modern" id="btn-continue" style="display: none;">
            Continue
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    setTimeout(() => {
      const btnBack = screen.querySelector('#btn-back');
      const btnSkip = screen.querySelector('#btn-skip');
      const btnContinue = screen.querySelector('#btn-continue');
      const specializationCards = screen.querySelectorAll('.specialization-card');

      btnBack.addEventListener('click', () => {
        this.manager.back();
      });

      btnSkip.addEventListener('click', () => {
        this.selectedSpecializations = [];
        this.collectData();
        this.manager.next();
      });

      btnContinue.addEventListener('click', () => {
        this.collectData();
        this.manager.next();
      });

      specializationCards.forEach(card => {
        card.addEventListener('click', () => {
          const specId = card.dataset.specialization;
          this.toggleSpecialization(specId, card, btnSkip, btnContinue);
        });
      });
    }, 0);

    return screen;
  }

  toggleSpecialization(id, cardElement, btnSkip, btnContinue) {
    const index = this.selectedSpecializations.indexOf(id);

    if (index > -1) {
      // Deselect
      this.selectedSpecializations.splice(index, 1);
      cardElement.classList.remove('selected');
    } else {
      // Select
      this.selectedSpecializations.push(id);
      cardElement.classList.add('selected');
    }

    // Update button visibility
    if (this.selectedSpecializations.length > 0) {
      btnSkip.style.display = 'none';
      btnContinue.style.display = 'block';
    } else {
      btnSkip.style.display = 'block';
      btnContinue.style.display = 'none';
    }
  }

  collectData() {
    this.manager.setData('specializations', this.selectedSpecializations);
  }

  validate() {
    // This screen is optional, always valid
    return true;
  }
}
