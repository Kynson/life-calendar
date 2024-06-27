import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

import { svelte as sveltePlugin } from '@sveltejs/vite-plugin-svelte';
import tsConfigPathPlugin from 'vite-tsconfig-paths';

// This plugin bridge the difference between browser and Cloudflare Workers before ES module integration proposal for web assembly is supported by Vite
function wasmPlugin(): Plugin {
  return {
    name: 'vite-plugin-wasm',
    resolveId(source) {
      if (!source.toLocaleLowerCase().endsWith('.wasm')) {
        return null;
      }

      return this.resolve(source);
    },
    async load(id) {
      if (!id.toLocaleLowerCase().endsWith('.wasm')) {
        return null;
      }

      // URL will be a base64 url if the wasm size is smaller than assetsInlineLimit
      return `import wasmUrl from '${id}?url';
const wasmBuffer = await fetch(wasmUrl).then((response) => response.arrayBuffer());
const wasmModule = await WebAssembly.compile(wasmBuffer);
export default wasmModule;`;
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [
    sveltePlugin(),
    wasmPlugin(),
    tsConfigPathPlugin()
  ],
})
