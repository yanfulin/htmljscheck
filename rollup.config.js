// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/justjshtml.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/justjshtml.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [resolve(), commonjs()],
};
