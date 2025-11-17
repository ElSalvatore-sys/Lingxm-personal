/**
 * ProfileCard Component
 * Example component showing migration from monolithic app.js
 *
 * This demonstrates:
 * - Component lifecycle
 * - State integration
 * - Haptic feedback
 * - Event handling
 */

import { Component } from './Component.js';
import { state } from '../utils/state.js';
import { appHaptics } from '../utils/haptics.js';

export class ProfileCard extends Component {
  constructor(parent, props) {
    super(parent, props);

    // Initialize component state
    this.state = {
      locked: props.locked || false,
      progress: props.progress || 0,
      streak: props.streak || 0
    };
  }

  /**
   * Render the profile card
   */
  render() {
    const { profile, languages } = this.props;
    const { locked, progress, streak } = this.state;

    // Create card container
    const card = this.createElement('button', {
      className: `profile-card ${locked ? 'pin-protected' : ''}`,
      'data-profile': profile.id,
      onClick: () => this.handleClick()
    });

    // Progress ring wrapper
    const progressWrapper = this.createElement('div', {
      className: 'profile-progress-wrapper'
    });

    // SVG progress ring
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');

    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('class', 'progress-ring-bg');
    bgCircle.setAttribute('cx', '60');
    bgCircle.setAttribute('cy', '60');
    bgCircle.setAttribute('r', '54');
    bgCircle.setAttribute('stroke', 'rgba(255,255,255,0.2)');
    bgCircle.setAttribute('stroke-width', '6');
    bgCircle.setAttribute('fill', 'none');

    // Progress circle
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('class', 'progress-ring-circle');
    progressCircle.setAttribute('cx', '60');
    progressCircle.setAttribute('cy', '60');
    progressCircle.setAttribute('r', '54');
    progressCircle.setAttribute('stroke-width', '6');
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke-dasharray', '339.292');
    progressCircle.setAttribute('stroke-dashoffset', this.calculateStrokeDashoffset(progress));
    progressCircle.setAttribute('transform', 'rotate(-90 60 60)');

    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);

    // Avatar
    const avatar = this.createElement('div', {
      className: 'profile-avatar'
    }, [
      this.createElement('span', {
        className: 'avatar-emoji'
      }, profile.emoji)
    ]);

    // Lock overlay (if locked)
    if (locked) {
      const lockOverlay = this.createElement('div', {
        className: 'lock-overlay'
      }, '🔒');
      avatar.appendChild(lockOverlay);
    }

    progressWrapper.appendChild(svg);
    progressWrapper.appendChild(avatar);

    // Language indicators
    const langIndicators = this.createElement('div', {
      className: 'language-indicators'
    });

    languages.forEach(lang => {
      const flag = this.createElement('span', {
        className: 'lang-flag'
      }, this.getLanguageFlag(lang));
      langIndicators.appendChild(flag);
    });

    // Profile name
    const name = this.createElement('h3', {
      className: 'profile-name'
    }, profile.name);

    // Streak badge
    const streakBadge = this.createElement('div', {
      className: `profile-streak ${streak > 0 ? 'active' : ''}`
    }, `🔥 ${streak} days`);

    // Assemble card
    card.appendChild(progressWrapper);
    card.appendChild(langIndicators);
    card.appendChild(name);
    card.appendChild(streakBadge);

    return card;
  }

  /**
   * Handle profile card click
   */
  async handleClick() {
    const { profile, onSelect } = this.props;
    const { locked } = this.state;

    // Trigger haptic feedback
    await appHaptics.profileSelected();

    // If locked, show PIN modal
    if (locked) {
      this.showPINModal();
      return;
    }

    // Update global state
    state.set('currentProfile', profile.id);

    // Call callback if provided
    if (onSelect && typeof onSelect === 'function') {
      onSelect(profile);
    }
  }

  /**
   * Show PIN authentication modal
   */
  showPINModal() {
    // Emit event for parent to handle
    window.dispatchEvent(new CustomEvent('show-pin-modal', {
      detail: { profileId: this.props.profile.id }
    }));
  }

  /**
   * Calculate stroke-dashoffset for progress circle
   * @param {number} percentage - Progress percentage (0-100)
   */
  calculateStrokeDashoffset(percentage) {
    const circumference = 339.292;
    return circumference - (circumference * percentage) / 100;
  }

  /**
   * Get flag emoji for language code
   * @param {string} langCode - Language code (e.g., 'de', 'en')
   */
  getLanguageFlag(langCode) {
    const flags = {
      'de': '🇩🇪',
      'en': '🇬🇧',
      'fr': '🇫🇷',
      'it': '🇮🇹',
      'ar': '🇸🇦',
      'ru': '🇷🇺'
    };
    return flags[langCode] || '🌐';
  }

  /**
   * Update progress
   * @param {number} progress - Progress percentage
   */
  setProgress(progress) {
    this.setState({ progress });
  }

  /**
   * Update streak
   * @param {number} streak - Streak days
   */
  setStreak(streak) {
    this.setState({ streak });
  }

  /**
   * Lock/unlock profile
   * @param {boolean} locked - Lock state
   */
  setLocked(locked) {
    this.setState({ locked });
  }
}

export default ProfileCard;
