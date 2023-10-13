import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { readPackageJSON } from 'pkg-types'

export default defineConfig(async () => {
  const pkg = await readPackageJSON()
  const deps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]

  function isExternal(dep: string) {
    return dep === 'vue' || dep.startsWith('@vue/') || deps.includes(dep)
  }

  return {
    plugins: [dts()],

    build: {
      lib: {
        entry: {
          index: './src/index.ts',
          utils: './src/utils.ts',
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) =>
          `${name}.${format === 'es' ? 'mjs' : format}`,
      },

      rollupOptions: {
        external: isExternal,
      },
    },
  }
})
