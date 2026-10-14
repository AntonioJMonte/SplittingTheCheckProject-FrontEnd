import { defineConfig } from 'orval'

const input = { target: 'http://localhost:3333/docs/json' }

export default defineConfig({
  splittr: {
    input,
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      tsconfig: './tsconfig.app.json',
      override: { mutator: { path: 'src/api/http-client.ts', name: 'httpClient' } },
    },
  },
  splittrZod: {
    input,
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/zod',
      client: 'zod',
      fileExtension: '.zod.ts',
    },
  },
})
