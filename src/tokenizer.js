// src/tokenizer.js

import { ParseError } from './errors.js';

/**
 * @enum {number}
 * @description Represents the different states of the tokenizer.
 */
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
  COMMENT: 12,
  // DOCTYPE states will be added here later for full HTML5 compliance
};

/**
 * @class Tokenizer
 * @description Converts an HTML string into a sequence of tokens.
 */
export class Tokenizer {
  /**
   * @private
   * @type {object}
   * @description Options for the tokenizer, including strict mode and error collection.
   */
  options;

  /**
   * @private
   * @type {State}
   * @description The current state of the tokenizer's state machine.
   */
  state;

  /**
   * @private
   * @type {string}
   * @description A buffer used to accumulate characters for token names, attribute names, or values.
   */
  buffer;

  /**
   * @private
   * @type {boolean}
   * @description Flag indicating if the current tag being processed is an end tag.
   */
  is_end_tag;

  /**
   * @private
   * @type {object|null}
   * @description The current token being built, or `null` if no token is currently being built.
   */
  current_token;

  /**
   * @private
   * @type {number}
   * @description The current line number being processed in the HTML input.
   */
  line;

  /**
   * @private
   * @type {number}
   * @description The current column number being processed in the HTML input.
   */
  column;

  /**
   * @private
   * @type {number}
   * @description The current index in the HTML input string.
   */
  index;

  /**
   * @public
   * @type {ParseError[]}
   * @description An array of collected parsing errors if `collectErrors` option is true.
   */
  errors;

  /**
   * @public
   * @type {Array<Array<any>>}
   * @description The list of emitted tokens.
   */
  tokens;

  /**
   * @private
   * @type {string}
   * @description The full HTML string being tokenized.
   */
  html;

  /**
   * Creates an instance of Tokenizer.
   * @param {object} [options={}] - Configuration options for the tokenizer.
   */
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
  }

  /**
   * Runs the tokenizer over an HTML string to generate a sequence of tokens.
   * @param {string} html - The HTML string to tokenize.
   * @returns {Array<Array<any>>} An array of tokens.
   */
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

  /**
   * Emits a token by adding it to the internal tokens array.
   * @param {Array<any>} token - The token to emit.
   */
  emit(token) {
    this.tokens.push(token);
  }

  /**
   * Consumes a single character and transitions the tokenizer's state.
   * @param {string} char - The character to consume.
   */
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
          if (this.html.substring(this.index, this.index + 2) === '--') { // Check for '!--'
            this.state = State.COMMENT;
            this.buffer = ''; // Clear buffer for comment content
            // Consume the '!--' part in the next few iterations
          } else {
            this.error("Unexpected character in tag open state after !");
          }
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
        if (/\s/.test(char)) {
          // ignore
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.attributes[char.toLowerCase()] = '';
          this.buffer = char.toLowerCase();
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
        } else if (/[a-zA-Z]/.test(char)) {
          this.current_token.attributes[this.buffer + char.toLowerCase()] = '';
          delete this.current_token.attributes[this.buffer];
          this.buffer += char.toLowerCase();
        } else {
          this.error("Unexpected character in attribute name state");
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
          this.error("Unexpected character in before attribute value state");
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

  /**
   * Emits the current token being built and resets `current_token`.
   * @private
   */
  emit_current_token() {
    if(!this.current_token) return;
    if (this.current_token.type === 'start_tag') {
      this.emit(['StartTag', this.current_token.tag, this.current_token.attributes]);
    } else {
      this.emit(['EndTag', this.current_token.tag]);
    }
    this.current_token = null;
  }

  /**
   * Records a parsing error. If `strict` mode is enabled, it throws the error.
   * If `collectErrors` is enabled, it adds the error to the `errors` array.
   * @param {string} message - The error message.
   */
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