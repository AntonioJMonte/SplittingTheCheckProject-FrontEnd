# splittr-web — Setup do Frontend

Prompt em fases para o Claude Code. Execute **uma fase por vez** e revise antes de seguir.

> **Antes de começar, confirme 3 valores do back e substitua abaixo:**
> - `API_URL`: porta do Fastify (placeholder: `http://localhost:3333`)
> - `SWAGGER_JSON`: rota do JSON do Swagger (placeholder: `/docs/json`; o padrão do `@fastify/swagger-ui` é `/documentation/json`)
> - Campo do token no handshake do Socket.IO (placeholder: `socket.handshake.auth.token`) e nomes dos eventos emitidos

---

## Fase 1 — Scaffold e dependências

```bash
npm create vite@latest splittr-web -- --template react-ts
cd splittr-web
npm install

# Runtime
npm i @tanstack/react-query react-router axios socket.io-client react-hook-form zod @hookform/resolvers

# Tailwind v4 (plugin do Vite)
npm i tailwindcss @tailwindcss/vite

# Dev
npm i -D orval @types/node @tanstack/react-query-devtools vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier prettier-plugin-tailwindcss
```

> Ambiente Windows/PowerShell: um comando por linha, sem `\` de continuação.

> **Zod:** use a **mesma major** do back (v3 ou v4). Versões diferentes entre os schemas gerados e os escritos à mão causam erros de tipo difíceis de rastrear.

---

## Fase 2 — Tailwind, alias `@/` e shadcn/ui

1. `vite.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
})
```

2. `src/index.css`: substituir todo o conteúdo por `@import "tailwindcss";`
3. `tsconfig.json` **e** `tsconfig.app.json`: adicionar em `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

4. shadcn:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card dialog table badge sonner skeleton
```

> Os componentes de formulário do shadcn mudaram recentemente. Consulte a doc atual antes de adicionar `form`/`field`. Se houver dúvida, use `Input` + `Label` direto com react-hook-form.

---

## Fase 3 — Estrutura de pastas

```
splittr-web/
├── orval.config.ts
├── .env.example                 # VITE_API_URL, VITE_WS_URL
├── src/
│   ├── main.tsx
│   ├── index.css
│   ├── app/
│   │   ├── providers.tsx        # QueryClientProvider, Toaster, Devtools
│   │   ├── query-client.ts
│   │   └── router.tsx           # rotas + ProtectedRoute
│   ├── api/
│   │   ├── http-client.ts       # axios + interceptors (mutator do orval)
│   │   └── generated/           # saída do orval — NÃO editar à mão
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth-store.ts    # get/set/clear token
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── pages/ LoginPage.tsx, RegisterPage.tsx
│   │   ├── groups/
│   │   │   ├── pages/ GroupsPage.tsx, GroupDetailPage.tsx
│   │   │   └── components/ BalancesCard.tsx, TransfersList.tsx, MembersList.tsx
│   │   ├── expenses/
│   │   │   ├── schemas.ts       # Zod do form (usa money.ts)
│   │   │   └── components/ ExpenseForm.tsx, ExpenseList.tsx
│   │   └── settlements/
│   │       └── components/ SettleDialog.tsx, PixCopyButton.tsx
│   ├── realtime/
│   │   ├── socket.ts
│   │   └── use-group-realtime.ts
│   ├── components/ui/           # gerado pelo shadcn
│   ├── lib/
│   │   ├── money.ts
│   │   ├── money.test.ts
│   │   └── utils.ts             # cn() do shadcn
│   └── test/setup.ts            # import '@testing-library/jest-dom/vitest'
```

**Regra:** organização por feature. Componentes compartilhados vão para `components/` só quando 2 ou mais features os usam.

---

## Fase 4 — Cliente HTTP e codegen

`src/features/auth/auth-store.ts`

```ts
const KEY = 'splittr:token'
export const getToken = () => localStorage.getItem(KEY)
export const setToken = (t: string) => localStorage.setItem(KEY, t)
export const clearToken = () => localStorage.removeItem(KEY)
```

`src/api/http-client.ts`

```ts
import Axios, { type AxiosRequestConfig } from 'axios'
import { getToken, clearToken } from '@/features/auth/auth-store'

export const api = Axios.create({ baseURL: import.meta.env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export const httpClient = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
  api({ ...config, ...options }).then(({ data }) => data)
```

`orval.config.ts`

```ts
import { defineConfig } from 'orval'

const input = { target: 'http://localhost:3333/docs/json' } // ajustar

export default defineConfig({
  splittr: {
    input,
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
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
```

`package.json` → scripts:

```json
"api:gen": "orval",
"test": "vitest"
```

> **Commite `src/api/generated/`.** O build da Vercel não alcança o Swagger rodando no seu localhost. Rode `npm run api:gen` com o back de pé sempre que um contrato mudar e commite o resultado.

---

## Fase 5 — Dinheiro (`lib/money.ts`) e testes

```ts
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "1234.50" (API) → "R$ 1.234,50". Apenas exibição — nunca usar o Number em contas. */
export const formatBRL = (amount: string) => brl.format(Number(amount))

/** "1.234,50" (input do usuário) → "1234.50" (API) */
export function toApiAmount(input: string): string {
  const normalized = input.trim().replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Valor inválido')
  const [int, dec = ''] = normalized.split('.')
  return `${Number(int)}.${dec.padEnd(2, '0')}`
}
```

`money.test.ts`: cobrir no mínimo `"12,5" → "12.50"`, `"1.234,56" → "1234.56"`, `"0,01" → "0.01"`, `"abc"` lança erro, `"12,345"` lança erro, `formatBRL("1234.50") → "R$ 1.234,50"`.

> No teste de `formatBRL`, o `Intl` usa espaço não separável (` `) depois de "R$". Compare com regex ou normalize o espaço, senão o teste falha sem motivo aparente.

---

## Fase 6 — Tempo real

`src/realtime/socket.ts`

```ts
import { io } from 'socket.io-client'
import { getToken } from '@/features/auth/auth-store'

export const socket = io(import.meta.env.VITE_WS_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }), // relido a cada (re)conexão
})
```

`src/realtime/use-group-realtime.ts`

```ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from './socket'

const EVENTS = ['expense:created', 'expense:updated', 'expense:deleted', 'settlement:updated'] // alinhar com o back

export function useGroupRealtime(groupId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!socket.connected) socket.connect()
    socket.emit('group:join', { groupId }) // alinhar com o back

    // Query keys do orval são baseadas na URL → invalida tudo sob /groups/:id
    const invalidate = () =>
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes(`/groups/${groupId}`) })

    EVENTS.forEach((e) => socket.on(e, invalidate))
    socket.on('connect', invalidate) // reconexão → refetch via REST

    return () => {
      EVENTS.forEach((e) => socket.off(e, invalidate))
      socket.off('connect', invalidate)
      socket.emit('group:leave', { groupId })
    }
  }, [groupId, qc])
}
```

O socket só **sinaliza** a mudança; quem traz os dados é o REST. É a mesma decisão que o back já segue.

---

## Fase 7 — Telas (nesta ordem, que é a ordem do vídeo demo)

1. Login / Cadastro
2. Lista de grupos + criar grupo
3. Detalhe do grupo: despesas, saldos e transferências sugeridas (+ `useGroupRealtime`)
4. Nova despesa (prévia da divisão **sem** calcular centavos no front)
5. Acerto: `SettleDialog` + `PixCopyButton` (`navigator.clipboard.writeText`) + reconhecimento pelo recebedor

**Critério de pronto do MVP:** duas abas logadas com usuários diferentes. Uma adiciona uma despesa e a outra atualiza o saldo sozinha.

---

## Fora do escopo (não deixar o Claude Code adicionar)

- Next.js, Redux, Zustand, decimal.js
- Cálculo de saldo ou divisão no front
- Tema escuro, animações, i18n
