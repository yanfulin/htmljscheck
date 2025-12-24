// tests/index.test.js

import { parseHTML } from '../src/index.js';
import assert from 'assert';

function testParseText() {
  const doc = parseHTML('Hello, world!');
  assert.strictEqual(doc.root.children.length, 1);
  assert.strictEqual(doc.root.children[0].type, 'text');
  assert.strictEqual(doc.root.children[0].text, 'Hello, world!');
  console.log('testParseText passed!');
}

testParseText();
