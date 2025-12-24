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
  toHTML(options = { pretty: true, indentSize: 2 }) {
    return this.children.map(child => child.toHTML(options)).join('');
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
    let results = [];
    for (const child of this.children) {
      results = results.concat(child.query(selector));
    }
    return results;
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
  toHTML(options = { pretty: true, indentSize: 2 }) {
    const attrs = Object.entries(this.attributes).map(([key, value]) => `${key}="${value}"`).join(' ');
    const childrenHTML = this.children.map(child => child.toHTML(options)).join('');
    if (attrs) {
      return `<${this.tag} ${attrs}>${childrenHTML}</${this.tag}>`;
    }
    return `<${this.tag}>${childrenHTML}</${this.tag}>`;
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

  /**
   * Queries the element and its children using a CSS selector.
   * @param {string} selector - The CSS selector to use.
   * @returns {Array<ElementNode>} An array of matching ElementNodes.
   */
  query(selector) {
    let results = [];
    let match = false;
    if (selector.startsWith('.')) {
      if (this.attributes.class && this.attributes.class.split(' ').includes(selector.substring(1))) {
        match = true;
      }
    } else if (selector.startsWith('#')) {
      if (this.attributes.id === selector.substring(1)) {
        match = true;
      }
    } else if (this.tag === selector) {
      match = true;
    }

    if (match) {
      results.push(this);
    }

    for (const child of this.children) {
      results = results.concat(child.query(selector));
    }
    return results;
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
