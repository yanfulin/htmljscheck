// src/errors.js

/**
 * @class ParseError
 * @augments Error
 * @description Represents a parsing error encountered by the tokenizer or tree builder.
 */
export class ParseError extends Error {
  /**
   * @type {number}
   * @description The line number where the error occurred.
   */
  line;

  /**
   * @type {number}
   * @description The column number where the error occurred.
   */
  column;

  /**
   * @type {number}
   * @description The index in the input string where the error occurred.
   */
  index;

  /**
   * Creates an instance of ParseError.
   * @param {string} message - A human-readable error message.
   * @param {number} line - The line number where the error occurred.
   * @param {number} column - The column number where the error occurred.
   * @param {number} index - The index in the input string where the error occurred.
   */
  constructor(message, line, column, index) {
    super(message);
    this.line = line;
    this.column = column;
    this.index = index;
  }
}