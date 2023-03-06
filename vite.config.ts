import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig({
  plugins: [dts()],

  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : format}`,
    },

    rollupOptions: {
      external: Object.values(pkg.peerDependencies || {}),
    },
  },
})
