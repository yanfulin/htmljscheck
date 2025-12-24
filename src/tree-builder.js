// src/tree-builder.js
import { DocumentNode, ElementNode, TextNode } from './nodes.js';

export class TreeBuilder {
  constructor() {
    this.document = new DocumentNode();
    this.stack = [this.document];
  }

  get current_node() {
    return this.stack[this.stack.length - 1];
  }

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

  start_tag(tag) {
    const parent = this.current_node;
    const element = new ElementNode(tag);
    parent.children.push(element);
    element.parent = parent;
    this.stack.push(element);
  }

  end_tag(tag) {
    const current_node = this.current_node;
    if (current_node.tag === tag) {
      this.stack.pop();
    } else {
      // handle mismatch later
    }
  }
}