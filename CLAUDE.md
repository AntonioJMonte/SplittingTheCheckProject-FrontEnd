# splittr-web

Frontend de demonstração do splittr (divisão de despesas em grupo). O back fica em
`../ProjetoRachamentoDeContas` (Fastify + Prisma + PostgreSQL + Redis + Socket.IO). Isto é a camada de demo de um
portfólio de back-end: MVP funcional, limpo e rápido, sem sofisticação visual.

## Regras invioláveis
- **O front nunca calcula dinheiro.** A API trafega valores como string com 2 casas ("1234.50"). O front só formata
  (`formatBRL`) e normaliza a entrada (`toApiAmount`). Nada de soma, divisão, `parseFloat` em contas nem decimal.js.
  Única exceção: `approxEqualShare` (prévia "≈ R$ 3,33 cada"), só para exibir.
- **O front nunca reimplementa regra de domínio.** Saldos, transferências sugeridas e divisão vêm da API.
- **O REST é a fonte da verdade; o socket só sinaliza.** Eventos disparam `invalidateQueries`; o payload nunca entra
  no cache. Não escute `settlement_computed` (o back emite em todo GET de `/settlements/compute`).
- **Não edite `src/api/generated/`.** Regenere com `npm run api:gen` (back rodando em `npm run dev`) e commite.
- **Fora do escopo:** Next.js, Redux, Zustand, decimal.js, tema escuro, i18n, animações elaboradas. Pergunte antes.

## Stack
Vite · React · TypeScript · TanStack Query · orval (axios) · React Router · react-hook-form + Zod 4 ·
Tailwind v4 + shadcn/ui · socket.io-client · Vitest + Testing Library · Vercel.

## Comandos (PowerShell: um por linha, sem `&&`)
- `npm run dev` → servidor de desenvolvimento (http://localhost:5173)
- `npm run build` → `tsc -b` + build de produção
- `npm run test -- --run` → testes uma vez (`npm run test` fica em watch)
- `npm run lint` → ESLint
- `npm run api:gen` → regenera `src/api/generated/` a partir de http://localhost:3333/docs/json
- `npx tsc -b` → checagem de tipos. **Não use `npx tsc --noEmit`**: na raiz ele não confere nada (`"files": []`).

## Verificação antes de dizer "pronto"
Rode e mostre a saída real de `npx tsc -b`, `npm run lint`, `npm run test -- --run` e `npm run build`.

## Valores do back (confirmados em 2026-10-13)
- API e WebSocket: `http://localhost:3333`. Swagger JSON: `/docs/json` (só fora de produção).
- Handshake: `auth: { token }`. Falhas: `connect_error` com `TOKEN_EXPIRED` ou `UNAUTHORIZED`.
- Sala: `socket.emit('join_group', groupId)` com o id como string pura. Não existe evento de saída.
- Eventos escutados: `expense_created`, `expense_updated`, `expense_deleted`, `expense_categorized`,
  `balances_updated`, `member_added`, `member_removed`, `settlement_confirmed`.

## Estrutura
Organização por feature (`src/features/<feature>/`). `src/components/` e `src/lib/` só recebem o que 2 ou mais
features usam. `src/components/ui/` é do shadcn.

## Documentos
`docs/FRONTEND_SETUP.md` (setup), `docs/specs/telas.md` (telas), `docs/DESIGN.md` (visual, consultar em toda tela),
`docs/plans/frontend-mvp.md` (plano por fases).

## Fluxo de trabalho
- Execute só a fase liberada pelo usuário (`superpowers:executing-plans`).
- TDD obrigatório em `lib/money.ts`, `features/auth/auth-store.ts`, `realtime/use-group-realtime.ts` e
  `features/expenses/schemas.ts`.
- Algo falhou → `superpowers:systematic-debugging` antes de propor correção.
- Git: uma branch por fase (`feat/front-fase-N-<nome>`), conventional commits com corpo em bullets.
  **Nunca commit, push ou merge sem aprovação explícita.**
