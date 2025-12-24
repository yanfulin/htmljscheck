// tests/index.test.js

import { parseSimpleHTML } from '../src/index.js';
import assert from 'assert';

function testParseSimpleHTML() {
  const expected = {
    type: 'document',
    children: [
      {
        type: 'element',
        tag: 'html',
        children: [
          {
            type: 'element',
            tag: 'head',
            children: [
              {
                type: 'element',
                tag: 'title',
                children: [{ type: 'text', text: 'Test' }],
              },
            ],
          },
          {
            type: 'element',
            tag: 'body',
            children: [
              {
                type: 'element',
                tag: 'p',
                children: [{ type: 'text', text: 'Hello, world!' }],
              },
            ],
          },
        ],
      },
    ],
  };

  const actual = parseSimpleHTML();

  assert.deepStrictEqual(actual, expected, 'The parsed DOM tree is not correct.');

  console.log('testParseSimpleHTML passed!');
}

testParseSimpleHTML();
