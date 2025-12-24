// src/index.js

import { Tokenizer } from './tokenizer.js';
import { TreeBuilder } from './tree-builder.js';

/**
 * Parses an HTML string and returns a document object.
 *
 * @param {string} html The HTML string to parse.
 * @param {object} options Parsing options.
 * @returns {object} The parsed document.
 */
export function parseHTML(html, options = {}) {
  const treeBuilder = new TreeBuilder();
  const tokenizer = new Tokenizer(treeBuilder, options);

  tokenizer.run(html);

  return {
    root: treeBuilder.document,
    errors: tokenizer.errors,
    toHTML: (options) => treeBuilder.document.toHTML(options),
    toText: (options) => treeBuilder.document.toText(options),
    query: (selector) => treeBuilder.document.query(selector),
  };
}
