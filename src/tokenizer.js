// src/tokenizer.js

const State = {
  DATA: 1,
};

export class Tokenizer {
  constructor(treeBuilder, options = {}, collectErrors = false) {
    this.treeBuilder = treeBuilder;
    this.options = options;
    this.collectErrors = collectErrors;
    this.tokens = [];
    this.state = State.DATA;
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
          // not implemented yet
        } else {
          this.treeBuilder.process_char(char);
        }
        break;
      default:
        // not implemented yet
        break;
    }
  }
}