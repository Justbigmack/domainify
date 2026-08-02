import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) }

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: { label: 'node', color: 'green' },
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias },
        test: {
          name: { label: 'dom', color: 'magenta' },
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          globals: true,
        },
      },
    ],
  },
})
