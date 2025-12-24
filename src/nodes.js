// src/nodes.js

export class Node {
  constructor(type) {
    this.type = type;
    this.parent = null;
    this.children = [];
    this.startIndex = -1;
    this.endIndex = -1;
  }

  toHTML(options = { pretty: true, indentSize: 2 }) {
    return this.children.map(child => child.toHTML(options)).join('');
  }

  toText(options = { separator: ' ' }) {
    return this.children.map(child => child.toText(options)).join('');
  }

  query(selector) {
    let results = [];
    for (const child of this.children) {
      results = results.concat(child.query(selector));
    }
    return results;
  }
}

export class DocumentNode extends Node {
  constructor() {
    super('document');
  }

  toText(options = { separator: ' ' }) {
    return this.children.map(child => child.toText(options)).join(' ').replace(/\s+/g, ' ').trim();
  }
}

export class ElementNode extends Node {
  constructor(tag, namespace = 'http://www.w3.org/1999/xhtml') {
    super('element');
    this.tag = tag;
    this.attributes = {};
    this.namespace = namespace;
  }

  toHTML(options = { pretty: true, indentSize: 2 }) {
    const attrs = Object.entries(this.attributes).map(([key, value]) => `${key}="${value}"`).join(' ');
    const childrenHTML = this.children.map(child => child.toHTML(options)).join('');
    if (attrs) {
      return `<${this.tag} ${attrs}>${childrenHTML}</${this.tag}>`;
    }
    return `<${this.tag}>${childrenHTML}</${this.tag}>`;
  }

  toText(options = { separator: ' ' }) {
    return this.children.map(child => child.toText(options)).join('');
  }

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

export class TextNode extends Node {
  constructor(text) {
    super('text');
    this.text = text;
  }

  toHTML(options) {
    return this.text;
  }

  toText(options) {
    return this.text;
  }

  query(selector) {
    return [];
  }
}

export class CommentNode extends Node {
  constructor(text) {
    super('comment');
    this.text = text;
  }

  toHTML(options) {
    return `<!--${this.text}-->`;
  }

  toText(options) {
    return '';
  }

  query(selector) {
    return [];
  }
}

export class DoctypeNode extends Node {
  constructor(name, publicId, systemId) {
    super('doctype');
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }

  toHTML(options) {
    if (this.publicId) {
      return `<!DOCTYPE ${this.name} PUBLIC "${this.publicId}" "${this.systemId}">`;
    }
    if (this.systemId) {
      return `<!DOCTYPE ${this.name} SYSTEM "${this.systemId}">`;
    }
    return `<!DOCTYPE ${this.name}>`;
  }

  toText(options) {
    return '';
  }

  query(selector) {
    return [];
  }
}