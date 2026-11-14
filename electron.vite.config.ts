import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      lib: { entry: resolve(__dirname, 'src/main/index.ts') }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          overlay: resolve(__dirname, 'src/preload/overlay.ts'),
          popover: resolve(__dirname, 'src/preload/popover.ts'),
          stretch: resolve(__dirname, 'src/preload/stretch.ts'),
          sip: resolve(__dirname, 'src/preload/sip.ts'),
          headsup: resolve(__dirname, 'src/preload/headsup.ts'),
          settings: resolve(__dirname, 'src/preload/settings.ts'),
          backdrop: resolve(__dirname, 'src/preload/backdrop.ts')
        },
        output: { format: 'cjs', entryFileNames: '[name].js' }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          popover: resolve(__dirname, 'src/renderer/popover/index.html'),
          stretch: resolve(__dirname, 'src/renderer/stretch/index.html'),
          sip: resolve(__dirname, 'src/renderer/sip/index.html'),
          headsup: resolve(__dirname, 'src/renderer/headsup/index.html'),
          settings: resolve(__dirname, 'src/renderer/settings/index.html'),
          backdrop: resolve(__dirname, 'src/renderer/backdrop/index.html')
        }
      }
    }
  }
});
