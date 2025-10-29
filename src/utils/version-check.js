// Runtime Version Checker
// Periodically checks if a new version is available and forces reload

export class VersionChecker {
  constructor() {
    this.currentVersion = null;
    this.checkInterval = 60000; // Check every 60 seconds
    this.intervalId = null;
  }

  async init() {
    try {
      // Get current version
      const response = await fetch('/version.json', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentVersion = data.timestamp;
        console.log(`[Version] Current build: ${data.buildTime} (${data.timestamp})`);
        
        // Start periodic checks
        this.startPeriodicCheck();
        
        // Check when tab becomes visible
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            this.checkForUpdate();
          }
        });
      }
    } catch (error) {
      console.error('[Version] Failed to load version:', error);
    }
  }

  startPeriodicCheck() {
    this.intervalId = setInterval(() => {
      this.checkForUpdate();
    }, this.checkInterval);
  }

  async checkForUpdate() {
    try {
      const response = await fetch('/version.json', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.timestamp > this.currentVersion) {
          console.log('[Version] New version detected! Reloading...');
          console.log(`  Old: ${this.currentVersion}`);
          console.log(`  New: ${data.timestamp}`);
          
          // Clear service worker and caches
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) {
              await reg.unregister();
            }
          }
          
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(name => caches.delete(name)));
          }
          
          // Reload page
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('[Version] Failed to check for update:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
