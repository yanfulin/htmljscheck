// tests/index.test.js

import { parseHTML } from '../src/index.js';
import assert from 'assert';

function testParseHTML() {
  const doc = parseHTML('');
  assert.deepStrictEqual(doc, { root: null, errors: [] });
  console.log('testParseHTML passed!');
}

testParseHTML();