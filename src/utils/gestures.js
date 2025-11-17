/**
 * iOS Gesture Handlers
 * Swipe gestures with haptic feedback and conflict prevention with iOS system gestures
 */

import { appHaptics } from './haptics.js';

/**
 * Swipe direction constants
 */
export const SwipeDirection = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down'
};

/**
 * Swipe gesture configuration
 */
const defaultConfig = {
  threshold: 50,           // Minimum distance in pixels to trigger swipe
  velocityThreshold: 0.3,  // Minimum velocity to trigger swipe
  restraint: 100,          // Maximum perpendicular distance allowed
  allowedTime: 500,        // Maximum time allowed for swipe gesture
  edgeThreshold: 50,       // Distance from edge to prevent iOS back swipe conflict
  enableHaptics: true      // Enable haptic feedback on swipe
};

/**
 * SwipeHandler class - manages swipe gestures on an element
 */
class SwipeHandler {
  constructor(element, callbacks = {}, config = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.config = { ...defaultConfig, ...config };

    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.distX = 0;
    this.distY = 0;
    this.elapsedTime = 0;
    this.isSwiping = false;

    this.init();
  }

  /**
   * Initialize touch event listeners
   */
  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
  }

  /**
   * Handle touch start
   * @param {TouchEvent} e
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isSwiping = false;

    // Check if touch started near edge (to avoid iOS back swipe conflict)
    const nearLeftEdge = this.startX < this.config.edgeThreshold;
    const nearRightEdge = this.startX > (window.innerWidth - this.config.edgeThreshold);

    if (nearLeftEdge || nearRightEdge) {
      // Don't handle swipes that start near edges to avoid iOS conflicts
      this.startX = 0;
      this.startY = 0;
      return;
    }

    if (this.callbacks.onSwipeStart) {
      this.callbacks.onSwipeStart(e);
    }
  }

  /**
   * Handle touch move
   * @param {TouchEvent} e
   */
  handleTouchMove(e) {
    if (this.startX === 0 || this.startY === 0) return;

    const touch = e.touches[0];
    this.distX = touch.clientX - this.startX;
    this.distY = touch.clientY - this.startY;

    // Check if this is a horizontal swipe
    const isHorizontalSwipe = Math.abs(this.distX) > Math.abs(this.distY);

    if (isHorizontalSwipe && Math.abs(this.distX) > 10) {
      // Prevent default to avoid scrolling while swiping horizontally
      e.preventDefault();
      this.isSwiping = true;

      // Add visual feedback
      if (this.distX > 0) {
        this.element.classList.add('swiping-right');
        this.element.classList.remove('swiping-left');
      } else {
        this.element.classList.add('swiping-left');
        this.element.classList.remove('swiping-right');
      }

      if (this.callbacks.onSwipeMove) {
        this.callbacks.onSwipeMove({
          distX: this.distX,
          distY: this.distY,
          direction: this.distX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT
        });
      }
    }
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e
   */
  handleTouchEnd(e) {
    if (this.startX === 0 || this.startY === 0) return;

    this.elapsedTime = Date.now() - this.startTime;

    // Clear visual feedback
    this.element.classList.remove('swiping-left', 'swiping-right');

    // Check if swipe meets criteria
    if (this.elapsedTime <= this.config.allowedTime) {
      const velocity = Math.abs(this.distX) / this.elapsedTime;

      // Horizontal swipe
      if (Math.abs(this.distX) >= this.config.threshold &&
          Math.abs(this.distY) <= this.config.restraint &&
          velocity >= this.config.velocityThreshold) {

        const direction = this.distX < 0 ? SwipeDirection.LEFT : SwipeDirection.RIGHT;

        // Trigger haptic feedback
        if (this.config.enableHaptics) {
          appHaptics.swipeNavigation();
        }

        // Call appropriate callback
        if (direction === SwipeDirection.LEFT && this.callbacks.onSwipeLeft) {
          this.callbacks.onSwipeLeft(e);
        } else if (direction === SwipeDirection.RIGHT && this.callbacks.onSwipeRight) {
          this.callbacks.onSwipeRight(e);
        }

        if (this.callbacks.onSwipe) {
          this.callbacks.onSwipe(direction, e);
        }
      }
      // Vertical swipe
      else if (Math.abs(this.distY) >= this.config.threshold &&
               Math.abs(this.distX) <= this.config.restraint) {

        const direction = this.distY < 0 ? SwipeDirection.UP : SwipeDirection.DOWN;

        if (direction === SwipeDirection.UP && this.callbacks.onSwipeUp) {
          this.callbacks.onSwipeUp(e);
        } else if (direction === SwipeDirection.DOWN && this.callbacks.onSwipeDown) {
          this.callbacks.onSwipeDown(e);
        }

        if (this.callbacks.onSwipe) {
          this.callbacks.onSwipe(direction, e);
        }
      }
    }

    if (this.callbacks.onSwipeEnd) {
      this.callbacks.onSwipeEnd(e);
    }

    // Reset
    this.reset();
  }

  /**
   * Handle touch cancel
   * @param {TouchEvent} e
   */
  handleTouchCancel(e) {
    this.element.classList.remove('swiping-left', 'swiping-right');
    this.reset();

    if (this.callbacks.onSwipeCancel) {
      this.callbacks.onSwipeCancel(e);
    }
  }

  /**
   * Reset swipe state
   */
  reset() {
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.distX = 0;
    this.distY = 0;
    this.elapsedTime = 0;
    this.isSwiping = false;
  }

  /**
   * Enable swipe gestures
   */
  enable() {
    this.element.style.touchAction = 'pan-y pinch-zoom';
  }

  /**
   * Disable swipe gestures
   */
  disable() {
    this.element.style.touchAction = 'auto';
    this.reset();
  }

  /**
   * Destroy the swipe handler
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
  }
}

/**
 * Pull-to-refresh handler for iOS
 */
class PullToRefreshHandler {
  constructor(element, onRefresh, config = {}) {
    this.element = element;
    this.onRefresh = onRefresh;
    this.config = {
      threshold: 80,
      resistance: 2.5,
      enableHaptics: true,
      ...config
    };

    this.startY = 0;
    this.currentY = 0;
    this.isPulling = false;
    this.isRefreshing = false;

    this.init();
  }

  /**
   * Initialize pull-to-refresh
   */
  init() {
    this.element.classList.add('pull-to-refresh');
    this.createIndicator();

    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  /**
   * Create refresh indicator
   */
  createIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = `
      <div class="pull-to-refresh-spinner"></div>
      <div class="pull-to-refresh-text">Pull to refresh</div>
    `;

    this.element.insertBefore(indicator, this.element.firstChild);
    this.indicator = indicator;
  }

  /**
   * Handle touch start
   * @param {TouchEvent} e
   */
  handleTouchStart(e) {
    // Only enable pull-to-refresh when at the top of the scroll container
    if (this.element.scrollTop === 0 && !this.isRefreshing) {
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  /**
   * Handle touch move
   * @param {TouchEvent} e
   */
  handleTouchMove(e) {
    if (!this.isPulling || this.isRefreshing) return;

    this.currentY = e.touches[0].clientY;
    const distance = (this.currentY - this.startY) / this.config.resistance;

    if (distance > 0) {
      e.preventDefault();
      this.element.classList.add('pulling');

      // Update indicator position
      if (this.indicator) {
        const rotation = Math.min(distance * 2, 360);
        this.indicator.style.transform = `translateY(${Math.min(distance, this.config.threshold)}px)`;
        this.indicator.querySelector('.pull-to-refresh-spinner').style.transform = `rotate(${rotation}deg)`;
      }

      // Update text
      if (distance >= this.config.threshold) {
        this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Release to refresh';
      } else {
        this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Pull to refresh';
      }
    }
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e
   */
  async handleTouchEnd(e) {
    if (!this.isPulling || this.isRefreshing) return;

    const distance = (this.currentY - this.startY) / this.config.resistance;

    if (distance >= this.config.threshold) {
      // Trigger refresh
      this.isRefreshing = true;
      this.element.classList.add('refreshing');
      this.element.classList.remove('pulling');

      if (this.config.enableHaptics) {
        await appHaptics.pullToRefreshTriggered();
      }

      this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Refreshing...';

      // Call refresh callback
      if (this.onRefresh) {
        await this.onRefresh();
      }

      // Complete refresh after a delay
      setTimeout(() => {
        this.completeRefresh();
      }, 1000);
    } else {
      // Reset without refreshing
      this.element.classList.remove('pulling');
      if (this.indicator) {
        this.indicator.style.transform = '';
      }
    }

    this.isPulling = false;
    this.startY = 0;
    this.currentY = 0;
  }

  /**
   * Complete the refresh
   */
  completeRefresh() {
    this.isRefreshing = false;
    this.element.classList.remove('refreshing');

    if (this.indicator) {
      this.indicator.style.transform = '';
      this.indicator.querySelector('.pull-to-refresh-text').textContent = 'Pull to refresh';
    }
  }

  /**
   * Destroy pull-to-refresh
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);

    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }

    this.element.classList.remove('pull-to-refresh', 'pulling', 'refreshing');
  }
}

/**
 * Utility function to add swipe gestures to an element
 * @param {HTMLElement} element - Element to add swipe gestures to
 * @param {Object} callbacks - Swipe callbacks
 * @param {Object} config - Configuration options
 * @returns {SwipeHandler}
 */
export function addSwipeGestures(element, callbacks, config) {
  return new SwipeHandler(element, callbacks, config);
}

/**
 * Utility function to add pull-to-refresh to an element
 * @param {HTMLElement} element - Element to add pull-to-refresh to
 * @param {Function} onRefresh - Refresh callback
 * @param {Object} config - Configuration options
 * @returns {PullToRefreshHandler}
 */
export function addPullToRefresh(element, onRefresh, config) {
  return new PullToRefreshHandler(element, onRefresh, config);
}

export {
  SwipeHandler,
  PullToRefreshHandler
};

export default {
  SwipeHandler,
  PullToRefreshHandler,
  addSwipeGestures,
  addPullToRefresh,
  SwipeDirection
};
