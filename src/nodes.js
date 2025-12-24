// src/nodes.js

export class Node {
  constructor(type) {
    this.type = type;
    this.parent = null;
    this.children = [];
    this.startIndex = -1;
    this.endIndex = -1;
  }
}

export class DocumentNode extends Node {
  constructor() {
    super('document');
  }
}

export class ElementNode extends Node {
  constructor(tag, namespace = 'http://www.w3.org/1999/xhtml') {
    super('element');
    this.tag = tag;
    this.attributes = {};
    this.namespace = namespace;
  }
}

export class TextNode extends Node {
  constructor(text) {
    super('text');
    this.text = text;
  }
}

export class CommentNode extends Node {
  constructor(text) {
    super('comment');
    this.text = text;
  }
}

export class DoctypeNode extends Node {
  constructor(name, publicId, systemId) {
    super('doctype');
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }
}
