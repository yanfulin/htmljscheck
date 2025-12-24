// src/tokenizer.js

const State = {
  DATA: 1,
  TAG_OPEN: 2,
  TAG_NAME: 3,
  END_TAG_OPEN: 4,
  BEFORE_ATTRIBUTE_NAME: 5,
  ATTRIBUTE_NAME: 6,
  AFTER_ATTRIBUTE_NAME: 7,
  BEFORE_ATTRIBUTE_VALUE: 8,
  ATTRIBUTE_VALUE_DOUBLE_QUOTED: 9,
  ATTRIBUTE_VALUE_SINGLE_QUOTED: 10,
  ATTRIBUTE_VALUE_UNQUOTED: 11,
};

export class Tokenizer {
  constructor(treeBuilder, options = {}, collectErrors = false) {
    this.treeBuilder = treeBuilder;
    this.options = options;
    this.collectErrors = collectErrors;
    this.state = State.DATA;
    this.buffer = '';
    this.is_end_tag = false;
    this.current_token = null;
  }

  run(html) {
    for (let i = 0; i < html.length; i++) {
      const char = html[i];
      this.consume(char);
    }
  }

  consume(char) {
    switch (this.state) {
      case State.DATA:
        if (char === '<') {
          this.state = State.TAG_OPEN;
        } else {
          this.treeBuilder.process_char(char);
        }
        break;
      case State.TAG_OPEN:
        if (/[a-zA-Z]/.test(char)) {
          this.current_token = { type: 'start_tag', tag: char.toLowerCase(), attributes: {} };
          this.state = State.TAG_NAME;
          this.is_end_tag = false;
        } else if (char === '/') {
          this.state = State.END_TAG_OPEN;
        } else {
          // handle other cases later
        }
        break;
      case State.END_TAG_OPEN:
        if (/[a-zA-Z]/.test(char)) {
          this.current_token = { type: 'end_tag', tag: char.toLowerCase() };
          this.state = State.TAG_NAME;
          this.is_end_tag = true;
        } else {
          // handle other cases later
        }
        break;
      case State.TAG_NAME:
        if (char === '>') {
          this.treeBuilder.process_token(this.current_token);
          this.current_token = null;
          this.state = State.DATA;
        } else if (/\s/.test(char)) {
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.tag += char.toLowerCase();
        } else {
          // handle other cases later
        }
        break;
      case State.BEFORE_ATTRIBUTE_NAME:
        if (/\s/.test(char)) {
          // ignore
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.attributes[char.toLowerCase()] = '';
          this.buffer = char.toLowerCase();
          this.state = State.ATTRIBUTE_NAME;
        } else if (char === '>') {
          this.treeBuilder.process_token(this.current_token);
          this.current_token = null;
          this.state = State.DATA;
        } else {
          // handle other cases later
        }
        break;
      case State.ATTRIBUTE_NAME:
        if (char === '=') {
          this.state = State.BEFORE_ATTRIBUTE_VALUE;
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.attributes[this.buffer + char.toLowerCase()] = '';
          delete this.current_token.attributes[this.buffer];
          this.buffer += char.toLowerCase();
        } else {
          // handle other cases later
        }
        break;
      case State.BEFORE_ATTRIBUTE_VALUE:
        if (char === '"') {
          this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
        } else if (char === "'") {
          this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
        } else if (/[^\s]/.test(char)) {
          this.current_token.attributes[this.buffer] = char;
          this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
        } else {
          // handle other cases later
        }
        break;
      case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
        if (char === '"') {
          this.buffer = '';
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else {
          this.current_token.attributes[this.buffer] += char;
        }
        break;
      case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
        if (char === "'") {
          this.buffer = '';
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else {
          this.current_token.attributes[this.buffer] += char;
        }
        break;
      case State.ATTRIBUTE_VALUE_UNQUOTED:
        if (/\s/.test(char)) {
          this.buffer = '';
          this.state = State.BEFORE_ATTRIBUTE_NAME;
        } else {
          this.current_token.attributes[this.buffer] += char;
        }
        break;
      default:
        // not implemented yet
        break;
    }
  }
}
