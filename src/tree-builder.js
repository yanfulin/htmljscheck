// src/tree-builder.js
import { DocumentNode, ElementNode, TextNode, CommentNode } from './nodes.js';

export class TreeBuilder {
  constructor() {
    this.document = new DocumentNode();
    this.stack = [this.document];
  }

  get current_node() {
    return this.stack[this.stack.length - 1];
  }

  run(tokens) {
    for (const token of tokens) {
      this.process_token(token);
    }
  }

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

  start_tag(token) {
    const parent = this.current_node;
    const element = new ElementNode(token[1]);
    element.attributes = token[2];
    parent.children.push(element);
    element.parent = parent;
    if (token[1] !== 'br') {
        this.stack.push(element);
    }
  }

  end_tag(token) {
    const current_node = this.current_node;
    if (current_node.tag === token[1]) {
      this.stack.pop();
    } else {
      // handle mismatch later
    }
  }

  comment(token) {
    const parent = this.current_node;
    const comment = new CommentNode(token[1]);
    parent.children.push(comment);
    comment.parent = parent;
  }
}
