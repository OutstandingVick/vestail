(function () {
  'use strict';
  if (window.VestailConsent) return;
  const KEY = 'vestail-consent-v1';
  const TTL = 180 * 24 * 60 * 60 * 1000;
  let choice = null;
  const allowed = category => category === 'necessary' || Boolean(choice && choice[category] === true);
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; }
  }
  const valid = value => Boolean(value && value.version === 1 && value.necessary === true && typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean' && Number.isFinite(value.savedAt) && value.savedAt <= Date.now() && Date.now() - value.savedAt < TTL);
  const stored = read();
  choice = valid(stored) ? stored : null;
  function save(analytics, marketing) {
    choice = { version: 1, necessary: true, analytics: Boolean(analytics), marketing: Boolean(marketing), savedAt: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('vestail:consent', { detail: { ...choice } }));
  }
  window.VestailConsent = { allowed, save, get: () => choice && ({ ...choice }) };
  // Optional integrations register a start callback returning its cleanup callback.
  // No analytics or marketing provider is registered in this version.
  const integrations = new Map();
  function sync() {
    integrations.forEach(item => {
      if (allowed(item.category) && !item.running) {
        item.stop = item.start(); item.running = true;
      } else if (!allowed(item.category) && item.running) {
        if (typeof item.stop === 'function') item.stop();
        item.running = false;
      }
    });
  }
  window.VestailConsent.register = (id, category, start) => {
    if (!['analytics', 'marketing'].includes(category) || integrations.has(id) || typeof start !== 'function') return;
    integrations.set(id, { category, start, running: false }); sync();
  };
  window.addEventListener('vestail:consent', sync);
})();
