// src/tokenizer.js

const State = {
  DATA: 1,
  TAG_OPEN: 2,
  TAG_NAME: 3,
  END_TAG_OPEN: 4,
};

export class Tokenizer {
  constructor(treeBuilder, options = {}, collectErrors = false) {
    this.treeBuilder = treeBuilder;
    this.options = options;
    this.collectErrors = collectErrors;
    this.tokens = [];
    this.state = State.DATA;
    this.buffer = '';
    this.is_end_tag = false;
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
          this.buffer = char.toLowerCase();
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
          this.buffer = char.toLowerCase();
          this.state = State.TAG_NAME;
          this.is_end_tag = true;
        } else {
          // handle other cases later
        }
        break;
      case State.TAG_NAME:
        if (char === '>') {
          if (this.is_end_tag) {
            this.treeBuilder.end_tag(this.buffer);
          } else {
            this.treeBuilder.start_tag(this.buffer);
          }
          this.buffer = '';
          this.state = State.DATA;
        } else if (/[a-zA-Z]/.test(char)) {
          this.buffer += char.toLowerCase();
        } else {
          // handle other cases later
        }
        break;
      default:
        // not implemented yet
        break;
    }
  }
}
