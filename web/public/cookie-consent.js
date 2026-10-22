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
})();
