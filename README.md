# justjshtml

`justjshtml` is a fast, lightweight, and dependency-free HTML parsing library for JavaScript, designed for both browser and Node.js environments. It aims to provide an API similar to the Python `justhtml` library and be compatible with the `html5lib-tests` test suite.

## Features

-   **Lightweight:** No external dependencies.
-   **Cross-platform:** Works in browsers and Node.js.
-   **Familiar API:** Inspired by Python's `justhtml` for easy adoption.
-   **DOM Tree Construction:** Parses HTML into a navigable tree structure.
-   **Querying:** Basic support for tag, class, and ID selectors.
-   **Serialization:** Convert parsed DOM back to HTML or extract text content.
-   **Error Handling:** Supports strict mode and error collection during parsing.

## Installation

```bash
# Currently, `justjshtml` is not published to npm.
# You can clone the repository to use it.
git clone https://github.com/yanfulin/htmljscheck.git
cd htmljscheck
```

## Usage

### Parsing HTML

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
    <p class="greeting">Hello, <b>world</b>!</p>
    <p class="farewell">Goodbye!</p>
    <!-- A simple comment -->
  </div>
</body>
</html>
`;

const doc = parseHTML(html, { collectErrors: true });

// Accessing the root of the document
console.log(doc.root.type); // Output: document

// Querying elements
const mainDiv = doc.query('#main')[0];
console.log(mainDiv.tag); // Output: div

const paragraphs = doc.query('p');
console.log(paragraphs.length); // Output: 2
console.log(paragraphs[0].toText()); // Output: Hello, world!

const greetingParagraph = doc.query('.greeting')[0];
console.log(greetingParagraph.toText()); // Output: Hello, world!

// Serializing to HTML
console.log(doc.toHTML({ pretty: true }));

// Extracting text content
console.log(doc.toText()); // Output: Hello, world! Goodbye!

// Error Handling (if enabled)
if (doc.errors.length > 0) {
  console.error('Parsing errors:', doc.errors);
}

// Strict Mode (throws on first error)
try {
  parseHTML('<p<', { strict: true });
} catch (error) {
  console.error('Strict mode error:', error.message);
}
```

## Project Roadmap

The project is structured into several phases:

### Phase 0: Proof of Concept (Completed)

-   Created a minimal parser capable of handling simple, valid HTML documents to validate the overall architecture.

### Phase 1: Core Parsing Engine (Completed)

-   Implemented the tokenizer and its state machine.
-   Implemented the tree builder.
-   Implemented the main `parseHTML` function to orchestrate tokenization and tree construction.
-   Implemented basic DOM node types (`DocumentNode`, `ElementNode`, `TextNode`, `CommentNode`, `DoctypeNode`).

### Phase 2: API Completeness (Completed)

-   Implemented a basic CSS selector engine for the `query` method (supporting tag, class, and ID selectors).
-   Implemented `toHTML` and `toText` serialization methods.
-   Implemented robust error handling, including `ParseError` class and strict mode.

### Phase 3: Testing and Compliance (Completed)

-   Configured a testing framework (using Node.js built-in `assert` module for now).
-   Developed a comprehensive test suite to ensure correctness across various HTML constructs.
-   *(Optional)* Porting `html5lib-tests` will be considered at a later stage for full HTML5 compliance validation.

### Phase 4: Documentation and Release (In Progress)

-   [x] Write JSDoc comments for all public APIs.
-   [ ] Create a `README.md` file with installation and usage instructions.
-   [ ] Set up a build process for distribution.
-   [ ] Configure `package.json` for publishing.
-   [ ] Publish the package to npm.

## Development

To set up the development environment:

```bash
git clone https://github.com/yanfulin/htmljscheck.git
cd htmljscheck
npm install # Installs any future development dependencies
```

To run tests:

```bash
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the ISC License.
