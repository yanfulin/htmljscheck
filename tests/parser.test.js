// tests/parser.test.js

import { parseHTML } from '../src/index.js';
import { ParseError } from '../src/errors.js';
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

function testQuery() {
  const html = '<div><p>Hello</p><p>World</p></div>';
  const doc = parseHTML(html);
  const paragraphs = doc.query('p');
  assert.strictEqual(paragraphs.length, 2);
  assert.strictEqual(paragraphs[0].toText(), 'Hello');
  assert.strictEqual(paragraphs[1].toText(), 'World');
  console.log('testQuery passed!');
}

function testQueryClass() {
  const html = '<div><p class="foo">Hello</p><p class="bar">World</p></div>';
  const doc = parseHTML(html);
  const paragraphs = doc.query('.foo');
  assert.strictEqual(paragraphs.length, 1);
  assert.strictEqual(paragraphs[0].toText(), 'Hello');
  console.log('testQueryClass passed!');
}

function testQueryId() {
  const html = '<div><p id="foo">Hello</p><p id="bar">World</p></div>';
  const doc = parseHTML(html);
  const paragraphs = doc.query('#foo');
  assert.strictEqual(paragraphs.length, 1);
  assert.strictEqual(paragraphs[0].toText(), 'Hello');
  console.log('testQueryId passed!');
}

function testErrorHandling() {
  const html = '<p<>';
  assert.throws(() => parseHTML(html, { strict: true }), ParseError);
  const doc = parseHTML(html, { collectErrors: true });
  assert.strictEqual(doc.errors.length, 1);
  assert.strictEqual(doc.errors[0].line, 1);
  assert.strictEqual(doc.errors[0].column, 3);
  console.log('testErrorHandling passed!');
}

function testNestedTags() {
    const html = '<div><p>Hello</p></div>';
    const doc = parseHTML(html);
    const div = doc.root.children[0];
    assert.strictEqual(div.tag, 'div');
    const p = div.children[0];
    assert.strictEqual(p.tag, 'p');
    assert.strictEqual(p.children[0].text, 'Hello');
    console.log('testNestedTags passed!');
  }
  
  // function testSelfClosingTags() {
  //   const html = '<br/>';
  //   const doc = parseHTML(html);
  //   const br = doc.root.children[0];
  //   assert.strictEqual(br.tag, 'br');
  //   assert.strictEqual(br.children.length, 0);
  //   console.log('testSelfClosingTags passed!');
  // }
  
  // function testComments() {
  //   const html = '<!-- This is a comment -->';
  //   const doc = parseHTML(html);
  //   const comment = doc.root.children[0];
  //   assert.strictEqual(comment.type, 'comment');
  //   assert.strictEqual(comment.text, ' This is a comment ');
  //   console.log('testComments passed!');
  // }


testParseText();
testParseStartTag();
testParseEndTag();
testParseAttribute();
testParseMultipleAttributes();
testToHTML();
testToText();
testQuery();
testQueryClass();
testQueryId();
testErrorHandling();
testNestedTags();
// testSelfClosingTags();
// testComments();