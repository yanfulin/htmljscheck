# justjshtml API Specification and Project Plan

## 1. Introduction

`justjshtml` is a fast, lightweight, and dependency-free HTML parsing library for JavaScript. It is a port of the Python `justhtml` library and is designed to be compatible with the html5lib-tests test suite. This document specifies the public API of `justjshtml` and outlines the project plan for its implementation.

The library will be provided as an ES module.

## 2. Core API

The core of the library is the `parseHTML` function, which takes an HTML string and returns a `Document` object.

### `parseHTML(html, options)`

**Description:** Parses an HTML string and returns a `Document` object representing the parsed document.

**Parameters:**

-   `html` (string): The HTML string to parse.
-   `options` (object, optional): An object containing parsing options.
    -   `collectErrors` (boolean, default: `false`): If `true`, the parser will collect all parsing errors into the `errors` property of the returned `Document` object.
    -   `fragmentContext` (ElementNode, optional): The context for parsing an HTML fragment. If provided, the `html` string will be parsed as a fragment within the given element.
    -   `strict` (boolean, default: `false`): If `true`, the parser will throw a `ParseError` exception on the first parsing error encountered.

**Returns:**

A `Document` object.

## 3. Document Object

The `Document` object represents the parsed HTML document.

### Properties

-   `root` (DocumentNode): The root node of the document.
-   `errors` (Array<ParseError>): An array of `ParseError` objects collected during parsing. This array is only populated if the `collectErrors` option is `true`.

### Methods

#### `query(selector)`

**Description:** Selects a list of `ElementNode`s from the document that match the given CSS selector.

**Parameters:**

-   `selector` (string): A CSS selector string.

**Returns:**

An array of `ElementNode` objects.

#### `toHTML(options)`

**Description:** Serializes the document back to an HTML string.

**Parameters:**

-   `options` (object, optional):
    -   `pretty` (boolean, default: `true`): If `true`, the output HTML will be pretty-printed with indentation.
    -   `indentSize` (number, default: 2): The number of spaces to use for each level of indentation.

**Returns:**

A string containing the serialized HTML.

#### `toText(options)`

**Description:** Returns the concatenated text content of the document.

**Parameters:**

-   `options` (object, optional):
    -   `separator` (string, default: ' '): The separator to use between the text content of different elements.

**Returns:**

A string containing the concatenated text content of the document.

## 4. Node Objects

The document tree is composed of different types of nodes. All nodes share a common set of properties.

### Common Node Properties

-   `type` (string): The type of the node. Can be one of `'document'`, `'element'`, `'text'`, `'comment'`, `'doctype'`.
-   `parent` (Node | null): The parent node of the current node, or `null` if the node has no parent.
-   `children` (Array<Node>): An array of child nodes.
-   `startIndex` (number): The starting index of the node in the original HTML string.
-   `endIndex` (number): The ending index of the node in the original HTML string.

### Node Types

#### `DocumentNode`

-   `type`: `'document'`

Represents the root of the document.

#### `ElementNode`

-   `type`: `'element'`
-   `tag` (string): The tag name of the element (e.g., `'div'`, `'p'`).
-   `attributes` (object): An object where the keys are attribute names and the values are attribute values.
-   `namespace` (string): The namespace of the element.

#### `TextNode`

-   `type`: `'text'`
-   `text` (string): The text content of the node.

#### `CommentNode`

-   `type`: `'comment'`
-   `text` (string): The text of the comment.

#### `DoctypeNode`

-   `type`: `'doctype'`
-   `name` (string): The name of the doctype.
-   `publicId` (string): The public identifier of the doctype.
-   `systemId` (string): The system identifier of the doctype.

## 5. Error Handling

Parsing errors are handled in two ways:

1.  **Collecting Errors:** If the `collectErrors` option is `true`, the parser will collect all parsing errors into the `errors` property of the `Document` object. Each error will be a `ParseError` object.
2.  **Strict Mode:** If the `strict` option is `true`, the parser will throw a `ParseError` exception on the first parsing error encountered.

### `ParseError` Object

A `ParseError` object represents a single parsing error.

**Properties:**

-   `message` (string): A human-readable error message.
-   `line` (number): The line number where the error occurred.
-   `column` (number): The column number where the error occurred.
-   `index` (number): The index in the input string where the error occurred.

## 6. Project Roadmap

This project will be implemented in phases.

### Phase 0: Proof of Concept

-   Create a minimal parser that can handle a simple, valid HTML document.
-   This will validate the overall architecture and approach before diving into the full implementation.

### Phase 1: Core Parsing Engine

-   Implement the tokenizer.
-   Implement the tree builder.
-   Implement the main `parseHTML` function.
-   Implement the basic DOM node types.

### Phase 2: API Completeness

-   Implement the `query` method for CSS selectors.
-   Implement the `toHTML` and `toText` serialization methods.
-   Implement error handling (strict mode and error collection).

### Phase 3: Testing and Compliance

-   Set up a testing framework.
-   Port the html5lib-tests test suite.
-   Achieve 100% pass rate on the html5lib-tests.

### Phase 4: Documentation and Release

-   Write comprehensive documentation.
-   Set up a build process for distribution.
-   Publish the library to npm.

## 7. Task Breakdown

### Phase 0: Proof of Concept

-   [x] Create a `parseSimpleHTML` function that can parse a hardcoded simple HTML document.
-   [x] The function should return a simplified DOM tree.
-   [x] Write a single test to verify the output of `parseSimpleHTML`.

### Phase 1: Core Parsing Engine

-   [ ] Create the project structure (`src`, `tests`, etc.).
-   [ ] Implement the `Tokenizer` class.
-   [ ] Implement the state machine for the tokenizer.
-   [ ] Implement the `TreeBuilder` class.
-   [ ] Implement the DOM node classes (`DocumentNode`, `ElementNode`, `TextNode`, etc.).
-   [ ] Implement the `parseHTML` function to orchestrate the tokenizer and tree builder.

### Phase 2: API Completeness

-   [ ] Implement a CSS selector engine for the `query` method.
-   [ ] Implement the `toHTML` method for serializing the DOM tree.
-   [ ] Implement the `toText` method for serializing the DOM tree to text.
-   [ ] Implement the `ParseError` class.
-   [ ] Implement strict mode and error collection in the `parseHTML` function.

### Phase 3: Testing and Compliance

-   [ ] Choose and configure a testing framework (e.g., Jest, Mocha).
-   [ ] Create a script to download and run the html5lib-tests.
-   [ ] Write a test runner to execute the html5lib-tests and compare the results.
-   [ ] Debug and fix parsing errors until all tests pass.

### Phase 4: Documentation and Release

-   [ ] Write JSDoc comments for all public APIs.
-   [ ] Create a `README.md` file with installation and usage instructions.
-   [ ] Set up a build process using a tool like Rollup or Webpack.
-   [ ] Configure `package.json` for publishing.
-   [ ] Publish the package to npm.

## 8. Example Usage

```javascript
import { parseHTML } from 'justjshtml';

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>My Awesome Page</title>
</head>
<body>
  <div id="main">
    <p>Welcome to my page!</p>
  </div>
</body>
</html>
`;

// Parse the HTML
const doc = parseHTML(html, { collectErrors: true });

// Check for errors
if (doc.errors.length > 0) {
  console.error('Parsing errors:');
  for (const error of doc.errors) {
    console.error(`- ${error.message} at ${error.line}:${error.column}`);
  }
}

// Query the document
const mainDiv = doc.query('#main')[0];
if (mainDiv) {
  console.log('Found the main div:', mainDiv.tag);
}

// Get the text content of the page
console.log('Text content:', doc.toText());

// Serialize the document back to HTML
console.log('Serialized HTML:', doc.toHTML({ pretty: false }));
```