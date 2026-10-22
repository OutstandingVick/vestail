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
  function mount() {
    const dialog = document.createElement('dialog');
    dialog.className = 'vc-dialog';
    dialog.setAttribute('aria-labelledby', 'vc-title');
    dialog.innerHTML = '<h2 id="vc-title">Cookie settings</h2><p>Necessary storage supports requested features. Optional categories are your choice. No analytics or marketing provider is configured today.</p><label>Necessary (always on)<input type="checkbox" checked disabled></label><label>Analytics<input id="vc-analytics" type="checkbox"></label><label>Marketing<input id="vc-marketing" type="checkbox"></label><p><a href="/cookies">Cookie Policy</a> · <a href="/privacy">Privacy Policy</a></p><div class="vc-actions"><button type="button" data-vc-save>Save choices</button><button type="button" data-vc-close>Close</button></div>';
    document.body.append(dialog);
    let trigger;
    function openSettings() {
      trigger = document.activeElement;
      dialog.querySelector('#vc-analytics').checked = Boolean(choice && choice.analytics);
      dialog.querySelector('#vc-marketing').checked = Boolean(choice && choice.marketing);
      if (!dialog.open) dialog.showModal();
    }
    dialog.addEventListener('close', () => { if (trigger && trigger.isConnected) trigger.focus(); });
    dialog.querySelector('[data-vc-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-vc-save]').addEventListener('click', () => {
      save(dialog.querySelector('#vc-analytics').checked, dialog.querySelector('#vc-marketing').checked);
      dialog.close();
    });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-cookie-settings]')) { event.preventDefault(); openSettings(); }
    });
    window.VestailConsent.openSettings = openSettings;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
