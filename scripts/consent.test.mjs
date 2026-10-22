import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../web/public/cookie-consent.js', import.meta.url), 'utf8');
function browser(raw = null, blocked = false) {
  const listeners = {};
  const nodes = [];
  class Element {
    children = new Map(); listeners = {}; hidden = false; checked = false; open = false; isConnected = true;
    setAttribute() {}
    querySelector(key) { if (!this.children.has(key)) this.children.set(key, new Element()); return this.children.get(key); }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    showModal() { this.open = true; }
    close() { this.open = false; this.listeners.close?.(); }
    focus() {}
  }
  const document = { readyState: 'complete', activeElement: new Element(), createElement: () => new Element(), body: { append: el => nodes.push(el) }, addEventListener: (name, fn) => { listeners['doc:' + name] = fn; } };
  const window = { addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); }, dispatchEvent: event => { (listeners[event.type] || []).forEach(fn => fn(event)); } };
  const storage = { getItem: () => { if (blocked) throw Error('blocked'); return raw; }, setItem: (_, value) => { if (blocked) throw Error('blocked'); raw = value; } };
  vm.runInNewContext(source, { window, document, localStorage: storage, Date, Map, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  return { api: window.VestailConsent, nodes, stored: () => raw, listeners };
}
test('first visit shows banner; rejecting is remembered on the next visit', () => {
  const first = browser();
  assert.equal(first.nodes[1].hidden, false);
  first.nodes[1].querySelector('[data-vc-reject]').listeners.click();
  assert.equal(first.nodes[1].hidden, true);
  assert.equal(browser(first.stored()).nodes[1].hidden, true);
});
test('optional integrations never start before consent and clean up on withdrawal', () => {
  const { api } = browser(); let analytics = 0; let marketing = 0; let stopped = 0;
  api.register('a', 'analytics', () => { analytics++; return () => stopped++; });
  api.register('m', 'marketing', () => { marketing++; });
  assert.equal(analytics + marketing, 0);
  api.save(true, false); assert.equal(analytics, 1); assert.equal(marketing, 0);
  api.save(false, false); assert.equal(stopped, 1);
  api.save(true, true); assert.equal(marketing, 1);
});
test('malformed, expired and future consent are ignored; storage failures stay usable', () => {
  for (const raw of ['broken', '{}', JSON.stringify({ version: 1, necessary: true, analytics: true, marketing: true, savedAt: 0 }), JSON.stringify({ version: 1, necessary: true, analytics: true, marketing: true, savedAt: Date.now() + 999999 })]) assert.equal(browser(raw).api.allowed('analytics'), false);
  const b = browser(null, true); b.api.save(false, false); assert.equal(b.nodes[1].hidden, true);
});
test('settings reopen, save separate categories and keep necessary enabled', () => {
  const b = browser(); b.api.save(false, false); b.api.openSettings();
  assert.equal(b.nodes[0].open, true);
  b.nodes[0].querySelector('#vc-analytics').checked = true;
  b.nodes[0].querySelector('[data-vc-save]').listeners.click();
  assert.equal(b.api.allowed('analytics'), true); assert.equal(b.api.allowed('marketing'), false); assert.equal(b.api.allowed('necessary'), true);
});
