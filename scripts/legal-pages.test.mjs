import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
const nativeRequire = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
function load(path, modules = {}) {
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => modules[name] ?? nativeRequire(name) });
  return exports;
}
const { LegalPage } = load('web/components/LegalPage.tsx', {
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  '@/components/Logo': { Logo: () => React.createElement('span', null, 'Vestail') },
});
for (const slug of ['terms', 'privacy', 'cookies']) test(`${slug} renders on server with metadata, contents, date and footer`, () => {
  const sections = JSON.parse(read(`web/lib/${slug}-content.json`));
  const page = load(`web/app/${slug}/page.tsx`, {
    '@/components/LegalPage': { LegalPage }, '@/lib/seo': { absolute: path => `https://www.vestail.fun${path}` }, [`@/lib/${slug}-content.json`]: sections,
  });
  const html = renderToStaticMarkup(React.createElement(page.default));
  assert.ok(html.includes('<!-- LAWYER REVIEW REQUIRED -->'));
  assert.ok(html.includes('Last updated:'));
  assert.equal(page.metadata.alternates.canonical, `https://www.vestail.fun/${slug}`);
  for (const section of sections) { assert.ok(html.includes(`id="${section.id}"`)); assert.ok(html.includes(`href="#${section.id}"`)); }
  for (const href of ['/terms', '/privacy', '/cookies', '/docs']) assert.ok(html.includes(`href="${href}"`));
  assert.ok(html.includes('data-cookie-settings'));
  if (slug === 'cookies') assert.ok(html.includes('<table'));
});
test('homepage loads consent and links all legal destinations', () => {
  const html = read('site/index.html');
  for (const href of ['/terms', '/privacy', '/docs', '/cookies']) assert.ok(html.includes(`href="${href}"`));
  assert.ok(html.includes('data-cookie-settings'));
  assert.ok(html.includes('src="/cookie-consent.js"'));
});
