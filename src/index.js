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
  const tokenizer = new Tokenizer();
  const treeBuilder = new TreeBuilder();

  // This is a placeholder implementation.
  // The tokenizer and tree builder will be connected and used here.

  return {
    root: null,
    errors: [],
  };
}