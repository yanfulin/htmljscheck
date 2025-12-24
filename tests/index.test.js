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

function testParseStartTag() {
  const doc = parseHTML('<p>');
  assert.strictEqual(doc.root.children.length, 1);
  const p = doc.root.children[0];
  assert.strictEqual(p.type, 'element');
  assert.strictEqual(p.tag, 'p');
  console.log('testParseStartTag passed!');
}

function testParseEndTag() {
  const doc = parseHTML('<p></p>');
  assert.strictEqual(doc.root.children.length, 1);
  const p = doc.root.children[0];
  assert.strictEqual(p.type, 'element');
  assert.strictEqual(p.tag, 'p');
  assert.strictEqual(p.children.length, 0);
  console.log('testParseEndTag passed!');
}

function testParseAttribute() {
  const doc = parseHTML('<p id="foo"></p>');
  assert.strictEqual(doc.root.children.length, 1);
  const p = doc.root.children[0];
  assert.strictEqual(p.type, 'element');
  assert.strictEqual(p.tag, 'p');
  assert.strictEqual(p.attributes.id, 'foo');
  console.log('testParseAttribute passed!');
}

function testParseMultipleAttributes() {
  const doc = parseHTML('<p id="foo" class="bar"></p>');
  assert.strictEqual(doc.root.children.length, 1);
  const p = doc.root.children[0];
  assert.strictEqual(p.type, 'element');
  assert.strictEqual(p.tag, 'p');
  assert.strictEqual(p.attributes.id, 'foo');
  assert.strictEqual(p.attributes.class, 'bar');
  console.log('testParseMultipleAttributes passed!');
}

function testToHTML() {
  const html = '<p id="foo" class="bar">Hello, world!</p>';
  const doc = parseHTML(html);
  assert.strictEqual(doc.toHTML({pretty: false}), html);
  console.log('testToHTML passed!');
}

function testToText() {
  const html = '<p>Hello, <b>world</b>!</p>';
  const doc = parseHTML(html);
  assert.strictEqual(doc.toText(), 'Hello, world!');
  console.log('testToText passed!');
}


testParseText();
testParseStartTag();
testParseEndTag();
testParseAttribute();
testParseMultipleAttributes();
testToHTML();
testToText();
