// src/errors.js

export class ParseError extends Error {
  constructor(message, line, column, index) {
    super(message);
    this.line = line;
    this.column = column;
    this.index = index;
  }
}
