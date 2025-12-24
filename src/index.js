// src/index.js

import { Tokenizer } from './tokenizer.js';
import { TreeBuilder } from './tree-builder.js';

/**
 * Parses an HTML string and returns a document object.
 *
 * @param {string} html The HTML string to parse.
 * @param {object} [options={}] Parsing options.
 * @param {boolean} [options.collectErrors=false] Whether to collect parsing errors.
 * @param {object} [options.fragmentContext=null] The context for parsing an HTML fragment.
 * @param {boolean} [options.strict=false] If `true`, the parser will throw an exception on the first parsing error.
 * @returns {{root: import('./nodes.js').DocumentNode, errors: import('./errors.js').ParseError[], toHTML: function, toText: function, query: function}} The parsed document.
 */
export function parseHTML(html, options = {}) {
  const tokenizer = new Tokenizer(options);
  const tokens = tokenizer.run(html);

  const treeBuilder = new TreeBuilder();
  treeBuilder.run(tokens);

  return {
    root: treeBuilder.document,
    errors: tokenizer.errors,
    toHTML: (options) => treeBuilder.document.toHTML(options),
    toText: (options) => treeBuilder.document.toText(options),
    query: (selector) => treeBuilder.document.query(selector),
  };
}
