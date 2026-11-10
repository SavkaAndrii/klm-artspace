import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDemoStore, dateKey, parseDate, isAvailable } from '../js/demo-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'rezerwacja/index.html', 'panel/index.html'];
for (const page of pages) {
  test(`${page}: static content, four section links, and repository-relative resources`, async () => {
    const html = await readFile(path.join(root, page), 'utf8');
    assert.match(html, /<main\b/);
    assert.match(html, /<h1\b/);
    assert.equal([...html.matchAll(/class="menu__list-link"/g)].length, 4);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
    // Resolve the same way as https://user.github.io/repository/<page>/.
    const publicPath = page === 'index.html' ? '' : page.replace(/index\.html$/, '');
    const base = new URL(publicPath, 'https://example.github.io/repository/');
    for (const match of html.matchAll(/\s(?:src|href|action)="([^"]+)"/g)) {
      const reference = match[1];
      assert.ok(!reference.startsWith('/'), `Root-relative reference: ${reference}`);
      const url = new URL(reference, base);
      assert.ok(url.pathname.startsWith('/repository/'), `Escapes repository: ${reference}`);
      let local = path.join(root, decodeURIComponent(url.pathname.slice('/repository/'.length)));
      if ((await stat(local)).isDirectory()) local = path.join(local, 'index.html');
      await stat(local);
      if (url.hash) {
        const target = await readFile(local, 'utf8');
        assert.ok(target.includes(`id="${url.hash.slice(1)}"`), `Missing hash target: ${reference}`);
      }
    }
  });
}

test('Demo availability is isolated by studio and every store starts fresh', () => {
  const store = createDemoStore();
  const key = dateKey(store.today);
  store.availability['space-1'].blocked.add(key);
  store.availability['space-2'].extra.add(key);
  assert.equal(isAvailable(store, 'space-1', key), false);
  assert.equal(isAvailable(store, 'space-2', key), true);
  assert.equal(createDemoStore().availability['space-1'].blocked.size, 0);
});

test('Local date keys round-trip without a UTC date shift', () => {
  const key = '2026-11-10';
  assert.equal(dateKey(parseDate(key)), key);
});

test('Interaction code does not regenerate whole pages or store submitted contact data', async () => {
  for (const file of ['app.js', 'booking.js', 'panel.js', 'calendar.js', 'demo-data.js']) {
    const code = await readFile(path.join(root, 'js', file), 'utf8');
    assert.doesNotMatch(code, /\.innerHTML\s*=|history\.replaceState|localStorage\.|sessionStorage\.|\bfetch\s*\(/);
  }
});
