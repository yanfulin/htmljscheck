'use strict';

// src/errors.js

/**
 * @class ParseError
 * @augments Error
 * @description Represents a parsing error encountered by the tokenizer or tree builder.
 */
class ParseError extends Error {
  /**
   * @type {number}
   * @description The line number where the error occurred.
   */
  line;

  /**
   * @type {number}
   * @description The column number where the error occurred.
   */
  column;

  /**
   * @type {number}
   * @description The index in the input string where the error occurred.
   */
  index;

  /**
   * Creates an instance of ParseError.
   * @param {string} message - A human-readable error message.
   * @param {number} line - The line number where the error occurred.
   * @param {number} column - The column number where the error occurred.
   * @param {number} index - The index in the input string where the error occurred.
   */
  constructor(message, line, column, index) {
    super(message);
    this.line = line;
    this.column = column;
    this.index = index;
  }
}

// src/tokenizer.js


const State = {
  DATA: 1,
  TAG_OPEN: 2,
  TAG_NAME: 3,
  END_TAG_OPEN: 4,
  BEFORE_ATTRIBUTE_NAME: 5,
  ATTRIBUTE_NAME: 6,
  BEFORE_ATTRIBUTE_VALUE: 8,
  ATTRIBUTE_VALUE_DOUBLE_QUOTED: 9,
  ATTRIBUTE_VALUE_SINGLE_QUOTED: 10,
  ATTRIBUTE_VALUE_UNQUOTED: 11,
  COMMENT: 12,
  MARKUP_DECLARATION_OPEN: 13,
};

class Tokenizer {
  constructor(options = {}) {
    this.options = options;
    this.state = State.DATA;
    this.buffer = '';
    this.is_end_tag = false;
    this.current_token = null;
    this.line = 1;
    this.column = 1;
    this.index = 0;
    this.errors = [];
    this.tokens = [];
    this.html = '';
    this.current_attribute_name = ''; // To store the attribute name while parsing its value
    this.current_attribute_value = ''; // To store the attribute value
  }

  run(html) {
    this.html = html;
    for (let i = 0; i < html.length; i++) {
      const char = html[i];
      this.consume(char);
      this.index++;
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
    return this.tokens;
  }

  emit(token) {
    this.tokens.push(token);
  }

  consume(char) {
    switch (this.state) {
      case State.DATA:
        if (char === '<') {
          this.state = State.TAG_OPEN;
        } else {
          this.emit(['Character', char]);
        }
        break;
      case State.TAG_OPEN:
        if (char === '!') {
          this.state = State.MARKUP_DECLARATION_OPEN;
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token = { type: 'start_tag', tag: char.toLowerCase(), attributes: {} };
          this.state = State.TAG_NAME;
          this.is_end_tag = false;
        } else if (char === '/') {
          this.state = State.END_TAG_OPEN;
        } else {
          this.error("Unexpected character in tag open state");
        }
        break;
      case State.END_TAG_OPEN:
        if (/[a-zA-Z]/.test(char)) {
          this.current_token = { type: 'end_tag', tag: char.toLowerCase() };
          this.state = State.TAG_NAME;
          this.is_end_tag = true;
        } else {
          this.error("Unexpected character in end tag open state");
        }
        break;
      case State.TAG_NAME:
        if (char === '>') {
          this.emit_current_token();
          this.state = State.DATA;
        } else if (/\s/.test(char)) {
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.tag += char.toLowerCase();
        } else {
          this.error("Unexpected character in tag name state");
        }
        break;
      case State.BEFORE_ATTRIBUTE_NAME:
        if (/\s/.test(char)) ; else if (/[a-zA-Z]/.test(char)) {
          this.current_attribute_name = char.toLowerCase(); // Start collecting attribute name
          this.current_attribute_value = '';
          this.state = State.ATTRIBUTE_NAME;
        } else if (char === '>') {
          this.emit_current_token();
          this.state = State.DATA;
        } else {
          this.error("Unexpected character in before attribute name state");
        }
        break;
      case State.ATTRIBUTE_NAME:
        if (char === '=') {
          this.state = State.BEFORE_ATTRIBUTE_VALUE;
        } else if (/\s/.test(char) || char === '>') { // Attribute name ends with space or >
          this.current_token.attributes[this.current_attribute_name] = ''; // Attribute with no value
          this.current_attribute_name = '';
          this.current_attribute_value = '';
          this.state = State.BEFORE_ATTRIBUTE_NAME;
          this.consume(char); // Re-consume the char for correct state handling
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_attribute_name += char.toLowerCase();
        } else {
          this.error("Unexpected character in attribute name state");
        }
        break;
      case State.BEFORE_ATTRIBUTE_VALUE:
        if (/\s/.test(char)) ; else if (char === '"') {
          this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
        } else if (char === "'") {
          this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
        } else if (/[^\s>]/.test(char)) { // Unquoted attribute value can't contain space or >
          this.current_attribute_value += char;
          this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
        } else {
          this.error("Unexpected character in before attribute value state");
        }
        break;
      case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
        if (char === '"') {
          this.current_token.attributes[this.current_attribute_name] = this.current_attribute_value;
          this.current_attribute_name = ''; // Clear current attribute name
          this.current_attribute_value = ''; // Clear current attribute value
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else {
          this.current_attribute_value += char;
        }
        break;
      case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
        if (char === "'") {
          this.current_token.attributes[this.current_attribute_name] = this.current_attribute_value;
          this.current_attribute_name = ''; // Clear current attribute name
          this.current_attribute_value = ''; // Clear current attribute value
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else {
          this.current_attribute_value += char;
        }
        break;
      case State.ATTRIBUTE_VALUE_UNQUOTED:
        if (/\s/.test(char) || char === '>') {
          this.current_token.attributes[this.current_attribute_name] = this.current_attribute_value;
          this.current_attribute_name = ''; // Clear current attribute name
          this.current_attribute_value = ''; // Clear current attribute value
          this.state = State.BEFORE_ATTRIBUTE_NAME;
          this.consume(char); // Re-consume the char for correct state handling
        } else {
          this.current_attribute_value += char;
        }
        break;
      case State.MARKUP_DECLARATION_OPEN:
          this.buffer += char;
          if (this.buffer === '--') { // Check for '!--'
              this.state = State.COMMENT;
              this.buffer = ''; // Clear buffer for comment content
          } else {
              this.error("Unexpected character in markup declaration open state");
          }
          break;
      case State.COMMENT:
        this.buffer += char;
        if (this.buffer.endsWith('-->')) {
          this.emit(['Comment', this.buffer.slice(0, -3)]);
          this.buffer = '';
          this.state = State.DATA;
        }
        break;
      default:
        this.error("Unknown state");
        break;
    }
  }

  emit_current_token() {
    if(!this.current_token) return;
    if (this.current_token.type === 'start_tag') {
      this.emit(['StartTag', this.current_token.tag, this.current_token.attributes]);
    } else {
      this.emit(['EndTag', this.current_token.tag]);
    }
    this.current_token = null;
  }

  error(message) {
    const error = new ParseError(message, this.line, this.column, this.index);
    if (this.options.strict) {
      throw error;
    }
    if (this.options.collectErrors) {
      this.errors.push(error);
    }
  }
}

// src/nodes.js

/**
 * @class Node
 * @description Base class for all nodes in the DOM tree.
 */
class Node {
  /**
   * @type {string}
   * @description The type of the node (e.g., 'document', 'element', 'text', 'comment', 'doctype').
   */
  type;

  /**
   * @type {Node|null}
   * @description The parent node of the current node, or `null` if the node has no parent.
   */
  parent;

  /**
   * @type {Array<Node>}
   * @description An array of child nodes.
   */
  children;

  /**
   * @type {number}
   * @description The starting index of the node in the original HTML string.
   */
  startIndex;

  /**
   * @type {number}
   * @description The ending index of the node in the original HTML string.
   */
  endIndex;

  /**
   * Creates an instance of Node.
   * @param {string} type - The type of the node.
   */
  constructor(type) {
    this.type = type;
    this.parent = null;
    this.children = [];
    this.startIndex = -1;
    this.endIndex = -1;
  }

  /**
   * Serializes the node and its children to an HTML string.
   * @param {object} [options={}] - Serialization options.
   * @param {boolean} [options.pretty=true] - Whether to pretty-print the HTML.
   * @param {number} [options.indentSize=2] - The number of spaces to use for each level of indentation.
   * @returns {string} The HTML string representation of the node.
   */
  toHTML(options = { pretty: true, indentSize: 2 }, indentLevel = 0) {
    return this.children.map(child => child.toHTML(options, indentLevel)).join('');
  }

  /**
   * Returns the concatenated text content of the node and its children.
   * @param {object} [options={}] - Options for text serialization.
   * @param {string} [options.separator=' '] - The separator to use between text content of children.
   * @returns {string} The text content of the node.
   */
  toText(options = { separator: ' ' }) {
    return this.children.map(child => child.toText(options)).join('');
  }

  /**
   * Queries the node and its children using a CSS selector.
   * @param {string} selector - The CSS selector to use.
   * @returns {Array<ElementNode>} An array of matching ElementNodes.
   */
        query(selector) {
          const allResults = new Set();
          const individualSelectors = selector.split(',').map(s => s.trim()).filter(Boolean);
      
          for (const individualSelector of individualSelectors) {
            // Example: "div > p.intro" -> [ { type: 'selector', value: 'div' }, { type: 'combinator', value: '>' }, { type: 'selector', value: 'p.intro' } ]
            const parsedSelectorParts = [];
            // This regex splits by '>', ' ' while keeping the delimiters and also handles multiple spaces
            const parts = individualSelector.split(/(\s*>\s*|\s+)/).map(s => s.trim()).filter(Boolean);
      
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (part === '>') {
                parsedSelectorParts.push({ type: 'combinator', value: '>' });
              } else if (part === '') { // This can happen with multiple spaces or leading/trailing spaces
                  continue; // Skip empty parts
              }
               else if (i > 0 && parsedSelectorParts[parsedSelectorParts.length - 1].type === 'selector' && part !== '>') {
                // If the previous was a selector and current is not '>' and not a combinator, it's an implicit descendant
                parsedSelectorParts.push({ type: 'combinator', value: ' ' });
                parsedSelectorParts.push({ type: 'selector', value: part });
              }
              else {
                parsedSelectorParts.push({ type: 'selector', value: part });
              }
            }
      
            Node._findAllMatches(this, parsedSelectorParts, 0, [], allResults);
          }
          return Array.from(allResults);
        }
      
        /**
         * Recursive helper to find all nodes matching a parsed selector.
         * @param {Node} currentNode - The current node to start searching from.
         * @param {Array<object>} selectorParts - The parsed selector parts.
         * @param {number} partIndex - The current index in selectorParts to match.
         * @param {Array<ElementNode>} currentMatchChain - Nodes that have matched so far in the current path.
         * @param {Set<ElementNode>} resultsSet - The set to accumulate unique matching ElementNodes.
         */
        static _findAllMatches(currentNode, selectorParts, partIndex, currentMatchChain, resultsSet) {
          if (!currentNode || partIndex >= selectorParts.length) {
            return;
          }
      
          const currentSelectorPart = selectorParts[partIndex];
      
          if (currentSelectorPart.type === 'combinator') {
              // Combinator at the start of a selector should be handled by the initial call to _findAllMatches
              // or by a previous selector part that leads to descendants.
              // If we arrive here, it means we are trying to process a combinator.
              // We should move to the next selector part.
              if (currentMatchChain.length === 0) {
                  // This case implies a malformed selector or an initial call on a combinator, skip it.
                  Node._findAllMatches(currentNode, selectorParts, partIndex + 1, currentMatchChain, resultsSet);
                  return;
              }
      
              const prevMatchedNode = currentMatchChain[currentMatchChain.length - 1];
              if (!prevMatchedNode) return; // Should not happen
      
              if (currentSelectorPart.value === '>') { // Direct child combinator
                  for (const child of prevMatchedNode.children) {
                      if (child instanceof ElementNode) {
                          Node._findAllMatches(child, selectorParts, partIndex + 1, [...currentMatchChain, child], resultsSet);
                      }
                  }
              } else if (currentSelectorPart.value === ' ') { // Descendant combinator
                  // For descendant, we need to check all descendants of the prevMatchedNode
                  Node._findDescendantsAndMatch(prevMatchedNode, selectorParts, partIndex + 1, currentMatchChain, resultsSet);
              }
              return; // Combinator processed
          }
      
          // Attempt to match the current node with the current selector part (if it's a 'selector' type part)
          if (currentNode instanceof ElementNode && currentSelectorPart.type === 'selector' && Node._matchNode(currentNode, currentSelectorPart.value)) {
              const newMatchChain = [...currentMatchChain, currentNode];
      
              if (partIndex === selectorParts.length - 1) { // This is the last selector part and it matches
                  resultsSet.add(currentNode);
              } else {
                  // It matches, but there are more parts. Move to the next.
                  Node._findAllMatches(currentNode, selectorParts, partIndex + 1, newMatchChain, resultsSet);
              }
          }
      
          // Always continue searching in children for the *current* selector part or the next.
          // This is crucial for descendant behavior or to find the initial match.
          for (const child of currentNode.children) {
            if (child instanceof ElementNode || child instanceof DocumentNode) {
              // If the current part is a selector AND we are at the beginning of the search for this part,
              // OR if the previous part was a descendant combinator,
              // we try to match the current selector part on the child.
              if (currentSelectorPart.type === 'selector' && (partIndex === 0 || (partIndex > 0 && selectorParts[partIndex - 1].value === ' '))) {
                  Node._findAllMatches(child, selectorParts, partIndex, currentMatchChain, resultsSet);
              }
            }
          }
        }
      
        /**
         * Helper for descendant combinator: finds all descendants from startNode and tries to match.
         * This is called when a ' ' combinator is encountered.
         * @param {Node} startNode - The node from which to find descendants.
         * @param {Array<object>} selectorParts - The parsed selector parts.
         * @param {number} partIndex - The current index in selectorParts to match.
         * @param {Array<ElementNode>} currentMatchChain - Nodes that have matched so far.
         * @param {Set<ElementNode>} resultsSet - The set to accumulate unique matching ElementNodes.
         */
        static _findDescendantsAndMatch(startNode, selectorParts, partIndex, currentMatchChain, resultsSet) {
          if (!startNode) {
            return;
          }
          for (const child of startNode.children) {
              if (child instanceof ElementNode || child instanceof DocumentNode) {
                  // Try to match the next selector part directly on the child
                  Node._findAllMatches(child, selectorParts, partIndex, [...currentMatchChain, child], resultsSet);
                  // Also recursively search descendants of the child
                  Node._findDescendantsAndMatch(child, selectorParts, partIndex, currentMatchChain, resultsSet);
              }
          }
        }
          /**
     * Helper method to check if an ElementNode matches a single simple selector part.
     * @param {ElementNode} node - The element node to check.
     * @param {string} simpleSelectorPart - The simple selector string (e.g., 'div', '#id', '.class').
     * @returns {boolean} - True if the node matches the simple selector, false otherwise.
     */
      _matchesSimpleSelector(node, simpleSelectorPart) {
        if (!(node instanceof ElementNode)) {
            return false;
        }
    
        if (simpleSelectorPart.startsWith('#')) { // ID selector
            return node.attributes.id === simpleSelectorPart.substring(1);
        } else if (simpleSelectorPart.startsWith('.')) { // Class selector
            return node.attributes.class && node.attributes.class.split(' ').includes(simpleSelectorPart.substring(1));
        } else { // Tag name selector
            return node.tag === simpleSelectorPart;
        }
      }
    
      /**
       * Helper method to check if an ElementNode matches a complex selector part
       * (e.g., 'div#id.class').
       * @param {ElementNode} node - The element node to check.
       * @param {string} selectorPart - The complex selector part string.
       * @returns {boolean} - True if the node matches, false otherwise.
       */
      static _matchNode(node, selectorPart) {
        if (!(node instanceof ElementNode)) {
          return false;
        }
    
        // Regex to extract tag, id, and classes
        const match = selectorPart.match(/^(?:(\w+))?(?:#([\w-]+))?(?:\.([\w.-]+))?$/);
        if (!match) {
          return false; // Malformed selector part
        }
    
        const [, tag, id, classes] = match;
    
        if (tag && node.tag.toLowerCase() !== tag.toLowerCase()) { // Case-insensitive tag matching
          return false;
        }
        if (id && node.attributes.id !== id) {
          return false;
        }
        if (classes) {
          const nodeClasses = node.attributes.class ? node.attributes.class.split(' ') : [];
          const requiredClasses = classes.split('.');
          for (const cls of requiredClasses) {
            if (!nodeClasses.includes(cls)) {
              return false;
            }
          }
        }
        return true;
      }

  /**
   * Recursive helper to find all nodes matching a parsed selector.
   * @param {Node} startNode - The current node to start searching from.
   * @param {Array<object>} selectorParts - The parsed selector parts.
   * @param {number} partIndex - The current index in selectorParts to match.
   * @param {Set<ElementNode>} resultsSet - The set to accumulate unique matching ElementNodes.
   */
  static _findAllMatches(startNode, selectorParts, partIndex, resultsSet) {
    if (!startNode || partIndex >= selectorParts.length) {
      return;
    }

    const currentSelectorPart = selectorParts[partIndex];

    // If the current part is a combinator, it means the previous selector part has been matched
    // and we need to determine the search scope for the *next* selector part.
    if (currentSelectorPart.type === 'combinator') {
        const combinator = currentSelectorPart.value;
        const nextSelectorPartIndex = partIndex + 1;

        if (combinator === '>') { // Direct child combinator
            for (const child of startNode.children) {
                if (child instanceof ElementNode) {
                    Node._findAllMatches(child, selectorParts, nextSelectorPartIndex, resultsSet);
                }
            }
        } else if (combinator === ' ') { // Descendant combinator
            Node._findDescendantsAndMatch(startNode, selectorParts, nextSelectorPartIndex, resultsSet);
        }
        return; // Combinator processed, move to next
    }

    // Attempt to match the current node with the current selector part (if it's a 'selector' type part)
    if (startNode instanceof ElementNode && Node._matchNode(startNode, currentSelectorPart.value)) {
        if (partIndex === selectorParts.length - 1) { // It's the last selector part and it matches
            resultsSet.add(startNode);
        } else {
            // It matches, but there are more parts (possibly a combinator next)
            // Continue search from children of the current matching node, looking for the next part
            for (const child of startNode.children) {
                 Node._findAllMatches(child, selectorParts, partIndex + 1, resultsSet);
            }
        }
    }

    // Always continue searching in children for the *current* selector part (descendant behavior).
    // This is for finding the initial match of a selector or for implicit descendant combinators.
    // If the current part is a selector, we need to apply it to all descendants unless a combinator
    // explicitly limits the scope.
    if (currentSelectorPart.type === 'selector') {
        for (const child of startNode.children) {
            // Only if it's the beginning of the search, or if the previous combinator was ' '
            // This is the core of how descendant selectors work.
            // We pass the same partIndex, meaning we're still trying to match this selector part.
            // We need to avoid infinite loops if 'startNode' is DocumentNode and it's trying to match 'html'
            if (startNode === child.parent) { // Only traverse direct children
                Node._findAllMatches(child, selectorParts, partIndex, resultsSet);
            }
        }
    }
  }

  /**
   * Helper for descendant combinator: finds all descendants from startNode and tries to match.
   * This is called when a ' ' combinator is encountered.
   * @param {Node} startNode - The node from which to find descendants.
   * @param {Array<object>} selectorParts - The parsed selector parts.
   * @param {number} partIndex - The current index in selectorParts to match.
   * @param {Set<ElementNode>} resultsSet - The set to accumulate unique matching ElementNodes.
   */
  static _findDescendantsAndMatch(startNode, selectorParts, partIndex, resultsSet) {
    if (!startNode) {
      return;
    }
    for (const child of startNode.children) {
        if (child instanceof ElementNode || child instanceof DocumentNode) {
            // Try to match the next selector part on the current child
            Node._findAllMatches(child, selectorParts, partIndex, resultsSet);
            // Also recursively search descendants of the child for the same selector part
            Node._findDescendantsAndMatch(child, selectorParts, partIndex, resultsSet);
        }
    }
  }
    
  }

/**
 * @class DocumentNode
 * @augments Node
 * @description Represents the root of the DOM document.
 */
class DocumentNode extends Node {
  constructor() {
    super('document');
  }

  /**
   * Serializes the document and its children to an HTML string.
   * @param {object} [options={}] - Serialization options.
   * @param {boolean} [options.pretty=true] - Whether to pretty-print the HTML.
   * @param {number} [options.indentSize=2] - The number of spaces to use for each level of indentation.
   * @returns {string} The HTML string representation of the document.
   */
  toHTML(options = { pretty: true, indentSize: 2 }, indentLevel = 0) {
    let htmlString = '';
    for (const child of this.children) {
      const childHtml = child.toHTML(options, indentLevel);
      if (child.type === 'doctype' && options.pretty && childHtml) {
        htmlString += childHtml + '\n';
      } else {
        htmlString += childHtml;
      }
    }
    return htmlString;
  }

  /**
   * Returns the concatenated text content of the document.
   * @param {object} [options={}] - Options for text serialization.
   * @param {string} [options.separator=' '] - The separator to use between text content of children.
   * @returns {string} The text content of the document.
   */
  toText(options = { separator: ' ' }) {
    const textContent = this.children
      .map(child => child.toText(options))
      .filter(Boolean) // Filter out empty strings
      .join(options.separator);
    return textContent.replace(/\s+/g, ' ').trim();
  }
}

/**
 * @class ElementNode
 * @augments Node
 * @description Represents an HTML element.
 */
class ElementNode extends Node {
  /**
   * @type {string}
   * @description The tag name of the element (e.g., 'div', 'p').
   */
  tag;

  /**
   * @type {object}
   * @description An object where keys are attribute names and values are attribute values.
   */
  attributes;

  /**
   * @type {string}
   * @description The namespace URI of the element.
   */
  namespace;

  /**
   * Creates an instance of ElementNode.
   * @param {string} tag - The tag name of the element.
   * @param {string} [namespace='http://www.w3.org/1999/xhtml'] - The namespace URI.
   */
  constructor(tag, namespace = 'http://www.w3.org/1999/xhtml') {
    super('element');
    this.tag = tag;
    this.attributes = {};
    this.namespace = namespace;
  }

  /**
   * Serializes the element and its children to an HTML string.
   * @param {object} [options={}] - Serialization options.
   * @param {boolean} [options.pretty=true] - Whether to pretty-print the HTML.
   * @param {number} [options.indentSize=2] - The number of spaces to use for each level of indentation.
   * @returns {string} The HTML string representation of the element.
   */
  toHTML(options = { pretty: true, indentSize: 2 }, indentLevel = 0) {
    const indent = options.pretty ? ' '.repeat(indentLevel * options.indentSize) : '';
    const newline = options.pretty ? '\n' : '';

    const attrs = Object.entries(this.attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    const tagAttrs = attrs ? ` ${attrs}` : '';

    let childrenHTML = this.children
      .map(child => child.toHTML(options, indentLevel + 1))
      .join('');

    // If childrenHTML is not empty and pretty printing is enabled, add newlines and indentation around it
    if (options.pretty && this.children.length > 0) {
        // Only add a newline before the first child's content if there are children,
        // and a newline before the closing tag if there are children.
        childrenHTML = newline + childrenHTML + newline + indent;
    }

    if (this.children.length > 0) {
        return `${indent}<${this.tag}${tagAttrs}>${childrenHTML}</${this.tag}>`;
    } else {
        // Empty elements without children, e.g., <div></div> or <br/> (though <br> is typically self-closing)
        return `${indent}<${this.tag}${tagAttrs}></${this.tag}>`;
    }
  }

  /**
   * Returns the concatenated text content of the element and its children.
   * @param {object} [options={}] - Options for text serialization.
   * @param {string} [options.separator=' '] - The separator to use between text content of children.
   * @returns {string} The text content of the element.
   */
  toText(options = { separator: ' ' }) {
    return this.children.map(child => child.toText(options)).join('');
  }

  }

/**
 * @class TextNode
 * @augments Node
 * @description Represents a text node.
 */
class TextNode extends Node {
  /**
   * @type {string}
   * @description The text content of the node.
   */
  text;

  /**
   * Creates an instance of TextNode.
   * @param {string} text - The text content.
   */
  constructor(text) {
    super('text');
    this.text = text;
  }

  /**
   * Serializes the text node to an HTML string.
   * @returns {string} The HTML string representation of the text node.
   */
  toHTML(options) {
    return this.text;
  }

  /**
   * Returns the text content of the node.
   * @returns {string} The text content.
   */
  toText(options) {
    return this.text;
  }

  /**
   * Text nodes do not match any selectors.
   * @returns {Array<ElementNode>} An empty array.
   */
  query(selector) {
    return [];
  }
}

/**
 * @class CommentNode
 * @augments Node
 * @description Represents an HTML comment.
 */
class CommentNode extends Node {
  /**
   * @type {string}
   * @description The text of the comment.
   */
  text;

  /**
   * Creates an instance of CommentNode.
   * @param {string} text - The comment text.
   */
  constructor(text) {
    super('comment');
    this.text = text;
  }

  /**
   * Serializes the comment node to an HTML string.
   * @returns {string} The HTML string representation of the comment node.
   */
  toHTML(options) {
    return `<!--${this.text}-->`;
  }

  /**
   * Comment nodes do not contribute to the text content.
   * @returns {string} An empty string.
   */
  toText(options) {
    return '';
  }

  /**
   * Comment nodes do not match any selectors.
   * @returns {Array<ElementNode>} An empty array.
   */
  query(selector) {
    return [];
  }
}

// src/tree-builder.js

/**
 * @class TreeBuilder
 * @description Constructs a DOM tree from a sequence of tokens.
 */
class TreeBuilder {
  /**
   * @type {DocumentNode}
   * @description The root DocumentNode of the constructed DOM tree.
   */
  document;

  /**
   * @private
   * @type {Array<import('./nodes.js').Node>}
   * @description A stack of open nodes, used to maintain the hierarchy of the DOM tree.
   */
  stack;

  /**
   * Creates an instance of TreeBuilder.
   */
  constructor() {
    this.document = new DocumentNode();
    this.stack = [this.document];
  }

  /**
   * Gets the current node on top of the stack.
   * @returns {import('./nodes.js').Node} The current active node.
   */
  get current_node() {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Processes a sequence of tokens to build the DOM tree.
   * @param {Array<Array<any>>} tokens - The array of tokens generated by the Tokenizer.
   */
  run(tokens) {
    for (const token of tokens) {
      this.process_token(token);
    }
  }

  /**
   * Processes a single token and updates the DOM tree.
   * @param {Array<any>} token - The token to process.
   */
  process_token(token) {
    const type = token[0];
    if (type === 'Character') {
      this.process_char(token[1]);
    } else if (type === 'StartTag') {
      this.start_tag(token);
    } else if (type === 'EndTag') {
      this.end_tag(token);
    } else if (type === 'Comment') {
      this.comment(token);
    }
  }

  /**
   * Processes a character token, adding it as a TextNode to the current node.
   * @param {string} char - The character to process.
   */
  process_char(char) {
    const parent = this.current_node;
    if (parent.children.length > 0 && parent.children[parent.children.length - 1].type === 'text') {
      parent.children[parent.children.length - 1].text += char;
    } else {
      const text_node = new TextNode(char);
      parent.children.push(text_node);
      text_node.parent = parent;
    }
  }

  /**
   * Processes a start tag token, creating an ElementNode and pushing it onto the stack.
   * @param {Array<any>} token - The start tag token.
   */
  start_tag(token) {
    const parent = this.current_node;
    const element = new ElementNode(token[1]);
    element.attributes = token[2];
    parent.children.push(element);
    element.parent = parent;
    if (token[1] !== 'br') { // Special handling for self-closing 'br' for now
        this.stack.push(element);
    }
  }

  /**
   * Processes an end tag token, popping the corresponding node from the stack.
   * @param {Array<any>} token - The end tag token.
   */
  end_tag(token) {
    const current_node = this.current_node;
    if (current_node.tag === token[1]) {
      this.stack.pop();
    }
  }

  /**
   * Processes a comment token, creating a CommentNode and adding it to the current node.
   * @param {Array<any>} token - The comment token.
   */
  comment(token) {
    const parent = this.current_node;
    const comment = new CommentNode(token[1]);
    parent.children.push(comment);
    comment.parent = parent;
  }
}

// src/index.js


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
function parseHTML(html, options = {}) {
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

exports.parseHTML = parseHTML;
//# sourceMappingURL=justjshtml.cjs.map
