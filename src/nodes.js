// src/nodes.js

/**
 * @class Node
 * @description Base class for all nodes in the DOM tree.
 */
export class Node {
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
export class DocumentNode extends Node {
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
export class ElementNode extends Node {
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
export class TextNode extends Node {
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
export class CommentNode extends Node {
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

/**
 * @class DoctypeNode
 * @augments Node
 * @description Represents an HTML doctype declaration.
 */
export class DoctypeNode extends Node {
  /**
   * @type {string}
   * @description The name of the doctype.
   */
  name;

  /**
   * @type {string|null}
   * @description The public identifier of the doctype.
   */
  publicId;

  /**
   * @type {string|null}
   * @description The system identifier of the doctype.
   */
  systemId;

  /**
   * Creates an instance of DoctypeNode.
   * @param {string} name - The name of the doctype.
   * @param {string|null} publicId - The public identifier.
   * @param {string|null} systemId - The system identifier.
   */
  constructor(name, publicId, systemId) {
    super('doctype');
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }

  /**
   * Serializes the doctype node to an HTML string.
   * @returns {string} The HTML string representation of the doctype node.
   */
  toHTML(options) {
    if (this.publicId) {
      return `<!DOCTYPE ${this.name} PUBLIC "${this.publicId}" "${this.systemId}">`;
    }
    if (this.systemId) {
      return `<!DOCTYPE ${this.name} SYSTEM "${this.systemId}">`;
    }
    return `<!DOCTYPE ${this.name}>`;
  }

  /**
   * Doctype nodes do not contribute to the text content.
   * @returns {string} An empty string.
   */
  toText(options) {
    return '';
  }

  /**
   * Doctype nodes do not match any selectors.
   * @returns {Array<ElementNode>} An empty array.
   */
  query(selector) {
    return [];
  }
}
