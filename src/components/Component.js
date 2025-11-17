/**
 * Base Component class for vanilla JS components
 * Provides lifecycle methods and DOM management
 *
 * Usage:
 * ```javascript
 * class MyComponent extends Component {
 *   render() {
 *     const div = document.createElement('div');
 *     div.innerHTML = '<h1>Hello</h1>';
 *     return div;
 *   }
 * }
 *
 * const component = new MyComponent('#parent', { title: 'Test' });
 * component.mount();
 * ```
 */
export class Component {
  /**
   * Create a new component
   * @param {string|HTMLElement} parent - Parent element or selector
   * @param {object} props - Component properties
   */
  constructor(parent, props = {}) {
    this.parent = parent;
    this.props = props;
    this.state = {};
    this.element = null;
    this.children = [];
    this.eventListeners = new Map();
  }

  /**
   * Create component DOM element
   * Override this in child classes
   * @returns {HTMLElement}
   */
  render() {
    throw new Error('render() must be implemented by child class');
  }

  /**
   * Mount component to parent
   * @returns {Component} - Returns this for chaining
   */
  mount() {
    // Resolve parent element
    if (typeof this.parent === 'string') {
      this.parent = document.querySelector(this.parent);
    }

    if (!this.parent) {
      throw new Error('Parent element not found');
    }

    // Render and append element
    this.element = this.render();
    this.parent.appendChild(this.element);

    // Call lifecycle hook
    this.onMount();

    return this;
  }

  /**
   * Lifecycle hook - called after component is mounted to DOM
   * Override this to add initialization logic
   */
  onMount() {}

  /**
   * Update component state and re-render
   * @param {object} newState - State updates (will be merged with existing state)
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    // Call before update hook
    this.onBeforeUpdate(oldState);

    // Re-render
    this.update();
  }

  /**
   * Lifecycle hook - called before component updates
   * @param {object} oldState - Previous state
   */
  onBeforeUpdate(oldState) {}

  /**
   * Update component DOM (re-render)
   */
  update() {
    if (!this.element) return;

    // Store parent and position
    const parent = this.element.parentNode;
    const nextSibling = this.element.nextSibling;

    // Remove old element
    this.element.remove();

    // Render new element
    this.element = this.render();

    // Insert at same position
    if (nextSibling) {
      parent.insertBefore(this.element, nextSibling);
    } else {
      parent.appendChild(this.element);
    }

    // Call lifecycle hook
    this.onUpdate();
  }

  /**
   * Lifecycle hook - called after component updates
   */
  onUpdate() {}

  /**
   * Remove component from DOM and cleanup
   */
  unmount() {
    if (!this.element) return;

    // Call lifecycle hook
    this.onUnmount();

    // Unmount all children
    this.children.forEach(child => {
      if (child.unmount) {
        child.unmount();
      }
    });
    this.children = [];

    // Remove all event listeners
    this.removeAllEventListeners();

    // Remove from DOM
    this.element.remove();
    this.element = null;
  }

  /**
   * Lifecycle hook - called before component unmounts
   */
  onUnmount() {}

  /**
   * Add event listener and track it for cleanup
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {object} options - Event listener options
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    // Track for cleanup
    const key = `${event}-${handler.toString()}`;
    this.eventListeners.set(key, { element, event, handler, options });
  }

  /**
   * Remove all tracked event listeners
   */
  removeAllEventListeners() {
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners.clear();
  }

  /**
   * Add a child component
   * @param {Component} component - Child component
   */
  addChild(component) {
    this.children.push(component);
    return component;
  }

  /**
   * Create an element with attributes and children
   * Utility method for building DOM
   *
   * @param {string} tag - HTML tag name
   * @param {object} attributes - Element attributes
   * @param {Array|string} children - Child elements or text
   * @returns {HTMLElement}
   */
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on')) {
        // Event listener
        const eventName = key.substring(2).toLowerCase();
        this.addEventListener(element, eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    // Add children
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          element.appendChild(child);
        } else if (child instanceof Component) {
          child.parent = element;
          child.mount();
          this.addChild(child);
        }
      });
    }

    return element;
  }

  /**
   * Show the component (set display to initial value)
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
    }
  }

  /**
   * Hide the component (set display to none)
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.element) {
      if (this.element.style.display === 'none') {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  /**
   * Query selector within component
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   */
  querySelector(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  /**
   * Query selector all within component
   * @param {string} selector - CSS selector
   * @returns {NodeList}
   */
  querySelectorAll(selector) {
    return this.element ? this.element.querySelectorAll(selector) : [];
  }
}

export default Component;
