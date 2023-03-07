import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig({
  plugins: [dts()],

  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format, name) =>
        `${name === 'index' ? 'index' : `${name}/index`}.${
          format === 'es' ? 'mjs' : format
        }`,
    },

    rollupOptions: {
      input: {
        index: './src/index.ts',
        utils: './src/utils/index.ts',
      },
      external: Object.values(pkg.peerDependencies || {}),
    },
  },
})
