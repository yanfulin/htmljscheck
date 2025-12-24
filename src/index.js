// src/index.js

/**
 * Parses a simple, hardcoded HTML document and returns a simplified DOM tree.
 * This function is for the proof of concept phase and is not a full HTML parser.
 *
 * @returns {object} A simplified DOM tree.
 */
export function parseSimpleHTML() {
  const html = '<html><head><title>Test</title></head><body><p>Hello, world!</p></body></html>';

  // This is a very simplistic "parser" for the proof of concept.
  // It does not handle attributes, comments, or other complexities.
  if (html === '<html><head><title>Test</title></head><body><p>Hello, world!</p></body></html>') {
    return {
      type: 'document',
      children: [
        {
          type: 'element',
          tag: 'html',
          children: [
            {
              type: 'element',
              tag: 'head',
              children: [
                {
                  type: 'element',
                  tag: 'title',
                  children: [{ type: 'text', text: 'Test' }],
                },
              ],
            },
            {
              type: 'element',
              tag: 'body',
              children: [
                {
                  type: 'element',
                  tag: 'p',
                  children: [{ type: 'text', text: 'Hello, world!' }],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return { type: 'document', children: [] };
}
