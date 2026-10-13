# splittr-web — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Neste projeto o usuário já escolheu:** `superpowers:executing-plans`, **uma fase por vez**, só a fase que ele liberar.
> TDD (`superpowers:test-driven-development`) é obrigatório nos arquivos marcados com **TDD**. Quando algo falhar,
> use `superpowers:systematic-debugging` antes de propor correção.

**Goal:** frontend de demonstração do splittr, em que duas pessoas no mesmo grupo veem despesas, saldos e acertos
mudarem em tempo real e acertam por Pix copia-e-cola.

**Architecture:** SPA Vite + React organizada por feature. O REST (hooks gerados pelo orval a partir do OpenAPI do back)
é a fonte da verdade. O Socket.IO só avisa que algo mudou e dispara `invalidateQueries`. Dinheiro chega e sai como
string; o front só formata e normaliza.

**Tech Stack:** Vite, React, TypeScript, TanStack Query, orval (axios), React Router, react-hook-form + Zod 4,
Tailwind v4 + shadcn/ui, socket.io-client, Vitest + Testing Library, Vercel.

**Spec:** `docs/specs/telas.md` (telas, fluxos e estados), `docs/DESIGN.md` (tokens e regras visuais) e
`docs/FRONTEND_SETUP.md` (stack, comandos, pastas e trechos-base). Quem executa lê os três.

## Global Constraints

- **O front nunca calcula dinheiro.** A API trafega valores como string com 2 casas (`"1234.50"`). O front só formata
  (`formatBRL`) e normaliza a entrada (`toApiAmount`). Nada de soma, divisão, `parseFloat` em contas nem `decimal.js`.
  A única exceção é `approxEqualShare` (prévia "≈ R$ 3,33 cada"), que só exibe e nunca vai para a API.
- **O front nunca reimplementa regra de domínio.** Saldos, transferências sugeridas e a divisão da despesa vêm da API.
  O front não confere se as partes fecham o total nem se os percentuais somam 100.
- **O REST é a fonte da verdade e o socket só sinaliza.** Eventos disparam `invalidateQueries`. O payload de um evento
  **nunca** entra no cache. Não escute `settlement_computed`.
- **Não edite `src/api/generated/`.** Ele é regenerado com `npm run api:gen` e commitado.
- **Fora do escopo:** Next.js, Redux, Zustand, decimal.js, tema escuro, i18n e animações elaboradas. Se algo disso
  parecer necessário, pergunte antes.
- **Ambiente Windows + PowerShell:** um comando por linha, sem `\` de continuação e sem `&&` encadeado.
- **Git:** uma branch por fase (`feat/front-fase-N-<nome>`) e conventional commits (`feat:`, `fix:`, `chore:`, `test:`)
  com corpo em bullets. **Nunca faça commit, push ou merge sem aprovação explícita:** mostre a mensagem proposta e espere.
- **Zod:** a mesma major do back (v4).
- **Texto da interface** (DESIGN 8): a ação tem o mesmo nome do começo ao fim (botão "Adicionar despesa" → toast
  "Despesa adicionada"). Erros não pedem desculpa. Sem "·" juntando informações nem "→" no fim de links e botões.
- **Visual:** consulte `docs/DESIGN.md` em toda tela. A skill de design não é reinvocada.
- **TDD obrigatório:** `src/lib/money.ts`, `src/features/auth/auth-store.ts`, `src/realtime/use-group-realtime.ts` e
  `src/features/expenses/schemas.ts`. Componentes puramente visuais não precisam de TDD.
- **Nenhuma fase está concluída** sem os quatro comandos da seção "Fechamento de cada fase" passando, com a saída real
  mostrada.

## Review Focus

1. **Valor digitado com ponto decimal ("12.5"):** a pessoa espera "Valor inválido", nunca que vire R$ 125,00 em
   silêncio. Coberto em `money.test.ts` (Tarefa 5.1) e em `schemas.test.ts` (Tarefa 7.4.1).
2. **Várias requisições recebendo 401 ao mesmo tempo depois de 15 minutos:** espera-se um único `POST /refresh`, com
   todas as requisições repetidas e sem logout. Coberto em `refresh-session.test.ts` (Tarefa 4.2) e
   `http-client.test.ts` (Tarefa 4.3).
3. **Queda e volta da rede com a tela do grupo aberta:** espera-se reentrar na sala e buscar tudo de novo, sem
   recarregar a página. Coberto em `use-group-realtime.test.tsx` (Tarefa 6.3).
4. **Saldo `-0.00` vindo da API:** espera-se "quitado", nunca "deve R$ 0,00". Coberto em `money.test.ts` (Tarefa 5.1).
5. **Erro do back em `shares.1.amount` quando só parte dos membros participa:** espera-se a mensagem na linha da pessoa
   certa, não na posição 1 da lista de membros. Coberto em `to-create-expense-body.test.ts` (Tarefa 7.4.2).

## Decisões deste plano (aprovadas junto com o plano)

| # | Decisão | Por quê |
|---|---|---|
| P-1 | A checagem de tipos é `npx tsc -b`, não `npx tsc --noEmit` | O `tsconfig.json` do Vite tem `"files": []` e só aponta para `tsconfig.app.json` e `tsconfig.node.json`. `tsc --noEmit` na raiz não confere arquivo nenhum e passa sempre. A Tarefa 1.3 prova isso. |
| P-2 | `create-vite` com `--eslint` | O template React atual vem com Oxlint por padrão. ESLint mantém `react-hooks`, que protege o hook de tempo real. |
| P-3 | Gerar o projeto numa pasta temporária e copiar | `splittr-web/` já tem `docs/`, `CLAUDE.md` e `.git`. Em pasta não vazia, o `create-vite` não interativo cancela, e `--overwrite` apagaria tudo. |
| P-4 | `paths` sem `baseUrl` no tsconfig | `paths` relativo funciona desde o TS 4.1, e `baseUrl` está depreciado no TS 6. A Tarefa 2.1 tem um plano B se o shadcn exigir. |
| P-5 | shadcn: sem `table` e com `textarea`; Sonner com tema claro fixo e sem `next-themes` | O DESIGN proíbe tabela. O código Pix precisa de textarea. Tema escuro está fora do escopo. |
| P-6 | `<select>`, checkbox e radio nativos, em vez de Select, Checkbox e RadioGroup do shadcn | Sem dependência nova; funcionam direto com `register` do react-hook-form e são simples de testar. |
| P-7 | `toApiAmount` mais estrito que o do setup | Recusa "12.5" (ponto só vale como separador de milhar) e não passa a parte inteira por `Number` (valores grandes perderiam dígitos). |
| P-8 | O D-98 também vale para o `PATCH /expenses/:id` | O `shareInput` é compartilhado entre criar e editar. Deixar o `amount` do PATCH só como number deixaria um mesmo corpo com dois tipos. Essa extensão é aditiva. |
| P-9 | `passWithNoTests` nas Fases 1–3, removido na Fase 4 | Sem teste nenhum, `vitest --run` sai com erro. O primeiro teste real chega na Fase 4. |
| P-10 | Testes sempre no fuso `America/Sao_Paulo` | Datas da despesa dependem do fuso. Um fuso fixo deixa os testes determinísticos. |
| P-11 | Saída zod do orval (`splittrZod`) mantida, como no setup, mas sem uso | Se ela não compilar com Zod 4, pare e reporte. |
| P-12 | A Fase 7 vira 7.1–7.5, uma branch por tela | Respeita "uma branch por fase" com PRs pequenos, na ordem do vídeo. |
| P-13 | Valor em destaque com texto `sr-only` em vez de `aria-label` | `aria-label` num `span` genérico não é lido por todos os leitores de tela. O DESIGN 5.2 pedia acessibilidade; isto entrega a mesma coisa de forma mais confiável. |
| P-14 | Arquivos novos além do setup: `app/AppLayout.tsx`, `api/refresh-session.ts`, `api/types.ts`, `features/auth/session-expired.ts`, `features/auth/GuestRoute.tsx`, `features/profile/`, `realtime/socket-auth.ts`, `realtime/use-socket-status.ts`, `lib/api-error.ts`, `lib/form-errors.ts`, `lib/dates.ts`, `lib/invalidate-group.ts`, `lib/use-changed-keys.ts`, `components/MoneyDisplay.tsx`, `components/form-field.tsx`, `components/section-error.tsx` | Cada um tem uma responsabilidade da spec ou do DESIGN. Os de `components/` e `lib/` são usados por 2 ou mais features. |

---

## Ordem das fases

| Fase | Branch | Repositório | Depende de |
|---|---|---|---|
| 0 — Repositório e CLAUDE.md | `main` (commit inicial) e `feat/front-fase-0-claude-md` | front | — |
| 1 — Scaffold e dependências | `feat/front-fase-1-scaffold` | front | 0 |
| 2 — Tailwind, shadcn e tokens | `feat/front-fase-2-design-base` | front | 1 |
| 3 — Estrutura e app shell | `feat/front-fase-3-estrutura` | front | 2 |
| **B — Contrato do back** | `fix/api-para-o-front` | **back** | — (pode correr em paralelo com 0–3) |
| 4 — Sessão, cliente HTTP e codegen | `feat/front-fase-4-api` | front | 3 e B |
| 5 — Dinheiro, datas e destaque | `feat/front-fase-5-dinheiro` | front | 4 |
| 6 — Tempo real | `feat/front-fase-6-tempo-real` | front | 5 |
| 7.1 — Login e cadastro | `feat/front-fase-7-1-login` | front | 6 |
| 7.2 — Grupos | `feat/front-fase-7-2-grupos` | front | 7.1 |
| 7.3 — Detalhe do grupo | `feat/front-fase-7-3-detalhe` | front | 7.2 |
| 7.4 — Nova despesa | `feat/front-fase-7-4-despesa` | front | 7.3 |
| 7.5 — Acerto e Pix | `feat/front-fase-7-5-acerto` | front | 7.4 |
| 8 — Verificação do MVP | `feat/front-fase-8-mvp` | front | 7.5 |

Toda fase do front parte de `main` atualizada, depois do merge da fase anterior. Se a anterior ainda não tiver sido
integrada, pergunte ao usuário de onde partir.

## Fechamento de cada fase (vale para todas)

1. **Verificação** (`superpowers:verification-before-completion`): rode e mostre a saída real de:
   ```powershell
   npx tsc -b
   npm run lint
   npm run test -- --run
   npm run build
   ```
   Na Fase B, os comandos são os do back (estão na própria fase).
2. **Revisão** (`superpowers:requesting-code-review`) contra este plano e as Global Constraints. Avalie cada apontamento
   com `superpowers:receiving-code-review`: aceite, rejeite com justificativa técnica ou deixe pendente.
3. **Relatório** no formato:
   ```
   ## Fase N — <nome>
   **Feito:** bullets curtos
   **Verificação:** saída resumida de tsc / lint / test / build
   **Code review:** apontamentos aceitos, rejeitados (com motivo) e pendentes
   **Decisões que tomei:** o que não estava no plano e por quê
   **Commit proposto:** as mensagens listadas no fim da fase
   **Próxima fase:** o que vem e o que preciso te responder antes
   ```
4. **Espere a aprovação do commit.** Só então rode `git add` e `git commit` com as mensagens aprovadas, na ordem
   listada e no formato de vários `-m` do PowerShell. Fases cujas tarefas mexem nos mesmos arquivos (1, 2 e B) têm
   um commit só, porque o `git add` de um arquivo leva o estado final dele.
5. **Espere a aprovação do push.** Depois: `git push -u origin <branch>`, `gh pr create` e `/code-review:code-review`
   no PR.
6. **`superpowers:finishing-a-development-branch`:** apresente as opções de integração e espere a decisão.

---

## Fase 0 — Repositório e CLAUDE.md

**Branch:** commit inicial em `main`, depois `feat/front-fase-0-claude-md`.
**Verificação desta fase:** ainda não existe `package.json`, então os quatro comandos não se aplicam. Diga isso no
relatório; eles passam a valer na Fase 1.

### Task 0.1: Repositório git com os documentos

**Files:**
- Create: `.git/` (via `git init`)

**Interfaces:**
- Produces: branch `main` com `docs/FRONTEND_SETUP.md`, `docs/specs/telas.md`, `docs/DESIGN.md` e
  `docs/plans/frontend-mvp.md`.

- [ ] **Step 1: Iniciar o repositório**

```powershell
git init -b main
git status
```
Expected: `On branch main`, `No commits yet` e `docs/` como untracked.

- [ ] **Step 2: Propor o commit inicial e esperar aprovação**

Mensagem proposta:
```powershell
git add docs
git commit -m "docs: add setup, screen spec, design direction and mvp plan" -m "- FRONTEND_SETUP.md com stack, comandos e trechos-base" -m "- specs/telas.md com fluxo e estados das 5 telas" -m "- DESIGN.md com tokens e regras visuais" -m "- plans/frontend-mvp.md com o plano por fases"
```

- [ ] **Step 3: Criar a branch da fase (depois do commit aprovado)**

```powershell
git switch -c feat/front-fase-0-claude-md
```

### Task 0.2: CLAUDE.md do front

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Produces: as regras que toda sessão aberta em `splittr-web/` carrega.

- [ ] **Step 1: Escrever o arquivo**

```markdown
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
```

- [ ] **Step 2: Conferir**

```powershell
git status --short
```
Expected: `?? CLAUDE.md`.

**Commit proposto (fechamento da Fase 0):**
```powershell
git add CLAUDE.md
git commit -m "docs: add claude.md with the frontend rules" -m "- regras invioláveis de dinheiro, domínio e tempo real" -m "- stack, comandos e verificação obrigatória" -m "- valores confirmados do back e fluxo de trabalho por fase"
```

### Task 0.3: Repositório no GitHub (só depois da aprovação do push)

- [ ] **Step 1: Perguntar ao usuário o nome e a visibilidade.** Sugestão: `splittr-web`, privado até o MVP.
- [ ] **Step 2: Criar e publicar**

```powershell
gh repo create splittr-web --private --source . --remote origin
git push -u origin main
git push -u origin feat/front-fase-0-claude-md
```
Troque `--private` por `--public` se o usuário pedir. Depois siga os passos 5 e 6 do Fechamento.

---

## Fase 1 — Scaffold e dependências

**Branch:** `feat/front-fase-1-scaffold`

### Task 1.1: Projeto Vite React + TypeScript

**Files:**
- Create: arquivos do template (`package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`,
  `src/`, `public/`, `.gitignore`)
- Modify: `package.json` (nome), `index.html` (idioma, título, favicon)

**Interfaces:**
- Produces: projeto que roda `npm run dev` e `npm run build`.

- [ ] **Step 1: Gerar o template numa pasta vizinha vazia (P-3)**

Esta etapa roda na pasta pai.
```powershell
Set-Location "C:\dev\Projeto Rachamento de Contas"
npm create vite@latest splittr-web-scaffold -- --template react-ts --eslint --no-interactive --no-immediate
Get-ChildItem -Force splittr-web-scaffold
```
Expected: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`,
`eslint.config.js`, `src/`, `public/` e `.gitignore`. Se aparecer `.oxlintrc.json` em vez de `eslint.config.js`, o
`--eslint` não foi aceito: pare e reporte.

- [ ] **Step 2: Copiar para o splittr-web e apagar a pasta temporária**

```powershell
Get-ChildItem -Force splittr-web-scaffold | Copy-Item -Destination splittr-web -Recurse -Force
Remove-Item -Recurse -Force splittr-web-scaffold
Set-Location "C:\dev\Projeto Rachamento de Contas\splittr-web"
Get-ChildItem -Force
```
Expected: os arquivos do template ao lado de `docs/`, `CLAUDE.md` e `.git/`, intactos.

- [ ] **Step 3: Ajustar nome, idioma e título**

Em `package.json`, troque o valor de `"name"` por `"splittr-web"`.

Em `index.html`: `<html lang="en">` vira `<html lang="pt-BR">`, `<title>` vira `<title>splittr</title>`, e a linha
`<link rel="icon" ... href="/vite.svg" />` sai. Depois:
```powershell
Remove-Item public/vite.svg
```

- [ ] **Step 4: Instalar e rodar**

```powershell
npm install
npm run build
```
Expected: `tsc -b` sem erro e `vite build` gera `dist/`.

### Task 1.2: Dependências do setup

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Instalar (um comando por linha)**

```powershell
npm i @tanstack/react-query react-router axios socket.io-client react-hook-form zod @hookform/resolvers
npm i tailwindcss @tailwindcss/vite
npm i -D orval @types/node @tanstack/react-query-devtools vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2: Conferir as majors que importam**

```powershell
npm ls zod vitest react-router @testing-library/dom
```
Expected: `zod@4.x`, `vitest@4.x` e `react-router@7.x`. `@testing-library/dom` aparece como peer instalado. Se faltar:
`npm i -D @testing-library/dom`.

### Task 1.3: Vitest, checagem de tipos e formatação

**Files:**
- Modify: `vite.config.ts`, `package.json` (scripts)
- Create: `src/test/setup.ts`, `src/env.d.ts`, `.env.example`, `.prettierrc`, `.prettierignore`

**Interfaces:**
- Produces: `npm run test`, `npm run typecheck`, `import.meta.env.VITE_API_URL` e `VITE_WS_URL` tipados.

- [ ] **Step 1: `vite.config.ts`** (mantenha a linha de import do plugin React que o template gerou)

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { TZ: 'America/Sao_Paulo' },
    passWithNoTests: true,
  },
})
```

- [ ] **Step 2: `src/test/setup.ts`**

Sem `globals` no Vitest, o Testing Library não limpa a tela sozinho entre testes.
```ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

- [ ] **Step 3: `src/env.d.ts`**

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: `.env.example` e `.env.local`**

```
VITE_API_URL=http://localhost:3333
VITE_WS_URL=http://localhost:3333
```
```powershell
Copy-Item .env.example .env.local
```
O `.gitignore` do template já ignora `*.local`.

- [ ] **Step 5: Prettier**

`.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 110,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```
`.prettierignore`:
```
dist
docs
src/api/generated
package-lock.json
```

- [ ] **Step 6: Scripts no `package.json`**

Acrescente a `"scripts"` (mantendo `dev`, `build`, `lint` e `preview` do template):
```json
"test": "vitest",
"typecheck": "tsc -b",
"format": "prettier --write ."
```

- [ ] **Step 7: Provar a P-1 (checagem de tipos de verdade)**

Crie `src/typecheck-probe.ts`:
```ts
export const probe: number = 'não é número'
```
```powershell
npx tsc --noEmit
npx tsc -b
Remove-Item src/typecheck-probe.ts
```
Expected: `npx tsc --noEmit` **passa** (não confere nada) e `npx tsc -b` **falha** com `TS2322` em
`src/typecheck-probe.ts`. Registre as duas saídas no relatório da fase. Se `npx tsc --noEmit` falhar, o template
mudou: pare e reporte.

**Commit proposto (fechamento da Fase 1):**
```powershell
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js .gitignore src public .env.example .prettierrc .prettierignore
git commit -m "chore: scaffold vite react-ts with the setup dependencies" -m "- template gerado em pasta temporária e copiado, porque splittr-web já tinha docs e .git" -m "- idioma pt-BR, título splittr e sem o favicon do template" -m "- dependências de runtime e dev do FRONTEND_SETUP" -m "- vitest com jsdom, fuso de São Paulo e limpeza entre testes" -m "- tsc -b como checagem de tipos (tsc --noEmit na raiz não confere nada)"
```

---

## Fase 2 — Tailwind, alias `@/`, shadcn e tokens do DESIGN

**Branch:** `feat/front-fase-2-design-base`

### Task 2.1: Tailwind v4 e alias `@/`

**Files:**
- Modify: `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/index.css`

**Interfaces:**
- Produces: imports `@/…` resolvidos no Vite, no Vitest e no `tsc`.

- [ ] **Step 1: `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { TZ: 'America/Sao_Paulo' },
    passWithNoTests: true,
  },
})
```

- [ ] **Step 2: `paths` nos dois tsconfig (P-4, sem `baseUrl`)**

Em `tsconfig.json`, acrescente ao lado de `"files"` e `"references"`:
```json
"compilerOptions": {
  "paths": { "@/*": ["./src/*"] }
}
```
Em `tsconfig.app.json`, dentro de `"compilerOptions"`:
```json
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 3: `src/index.css`**: substitua todo o conteúdo por:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Conferir**

```powershell
npx tsc -b
npm run build
```
Expected: os dois passam.

### Task 2.2: shadcn/ui

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/{button,input,label,card,dialog,badge,sonner,skeleton,textarea}.tsx`
- Modify: `src/index.css`, `package.json`, `src/components/ui/card.tsx`, `src/components/ui/sonner.tsx`

**Interfaces:**
- Produces: `Button`, `Input`, `Label`, `Card`, `Dialog*`, `Badge`, `Toaster`, `Skeleton`, `Textarea` e `cn()`.

- [ ] **Step 1: Ver as flags atuais e iniciar sem perguntas**

```powershell
npx shadcn@latest init --help
npx shadcn@latest init --defaults --yes
```
Se o `--help` mostrar flags diferentes, escolha as que evitam prompts com: biblioteca **Radix**, cor base **Neutral** e
**CSS variables**. Se o init reclamar de alias ausente, acrescente `"baseUrl": "."` só ao `compilerOptions` do
`tsconfig.json` raiz. Se o `tsc -b` acusar depreciação, acrescente também `"ignoreDeprecations": "6.0"` e registre
isso no relatório.

- [ ] **Step 2: Adicionar os componentes (P-5)**

```powershell
npx shadcn@latest add button input label card dialog badge sonner skeleton textarea --yes
```

- [ ] **Step 3: Card sem sombra (DESIGN 4)**

Em `src/components/ui/card.tsx`, apague `shadow-sm` da `className` do componente `Card`.

- [ ] **Step 4: Sonner com tema claro fixo, sem `next-themes`**

Substitua `src/components/ui/sonner.tsx` por:
```tsx
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}
```
```powershell
npm uninstall next-themes
```

- [ ] **Step 5: Conferir**

```powershell
Get-ChildItem src/components/ui
npm ls lucide-react
npx tsc -b
npm run lint
```
Expected: os 9 arquivos, `lucide-react` instalado (os ícones das Fases 7.x vêm dele) e nenhum erro. Se o
`lucide-react` não aparecer: `npm i lucide-react`. Avisos `react-refresh/only-export-components` em arquivos do shadcn são
aceitáveis: anote quantos aparecem.

### Task 2.3: Tokens, fonte e checagem de algarismos tabulares

**Files:**
- Modify: `index.html`, `src/index.css`

**Interfaces:**
- Produces: classes `text-positive`, `text-negative`, `text-settled`, `bg-highlight` e `font-sans` (IBM Plex Sans).

- [ ] **Step 1: Fonte no `index.html`**, dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Tokens no `src/index.css`** (DESIGN 3.2)

1. No bloco `:root` gerado pelo shadcn, troque os valores destas variáveis (as demais, `--chart-*` e `--sidebar-*`,
   ficam como estão) e acrescente as quatro semânticas no fim do bloco:
```css
  --radius: 0.375rem;
  --background: #F3F5F9;
  --foreground: #1A2238;
  --card: #FFFFFF;
  --card-foreground: #1A2238;
  --popover: #FFFFFF;
  --popover-foreground: #1A2238;
  --primary: #2347C5;
  --primary-foreground: #FFFFFF;
  --secondary: #E9EDF4;
  --secondary-foreground: #1A2238;
  --muted: #E9EDF4;
  --muted-foreground: #5A6478;
  --accent: #E9EDF4;
  --accent-foreground: #1A2238;
  --destructive: #C0322B;
  --border: #D9DEE8;
  --input: #D9DEE8;
  --ring: #2347C5;
  --positive: #13795B;
  --negative: #C0322B;
  --settled: #5A6478;
  --highlight: #E3E9FB;
```
2. Apague o bloco `.dark { … }` inteiro e a linha `@custom-variant dark (&:is(.dark *));`.
3. No bloco `@theme inline { … }`, acrescente:
```css
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --color-settled: var(--settled);
  --color-highlight: var(--highlight);
```
4. No `@layer base`, a regra de `body` fica:
```css
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
```

- [ ] **Step 3: Checagem de algarismos tabulares (DESIGN 2, 1 minuto)**

```powershell
npm run dev
```
Abra http://localhost:5173, abra o console do navegador e cole:
```js
const a = Object.assign(document.createElement('span'), { className: 'tabular-nums font-sans', textContent: 'R$ 111,11' }); const b = Object.assign(a.cloneNode(), { textContent: 'R$ 888,88' }); document.body.append(a, b); [a.getBoundingClientRect().width, b.getBoundingClientRect().width]
```
Expected: duas larguras iguais. Se você não tiver navegador nesta sessão, peça ao usuário para rodar e informar o
resultado. Se as larguras forem diferentes, troque `--font-sans` por
`ui-sans-serif, system-ui, "Segoe UI", sans-serif` e registre a troca em `docs/DESIGN.md`, seção 2.

- [ ] **Step 4: Conferir**

```powershell
npx tsc -b
npm run build
```

**Commit proposto (fechamento da Fase 2):**
```powershell
git add vite.config.ts tsconfig.json tsconfig.app.json index.html src/index.css components.json src/lib/utils.ts src/components/ui package.json package-lock.json
git commit -m "feat: add tailwind, shadcn/ui and the design tokens" -m "- tailwind v4 e alias @ resolvido no Vite, Vitest e tsc (paths sem baseUrl)" -m "- button, input, label, card, dialog, badge, sonner, skeleton, textarea" -m "- card sem sombra e sonner com tema claro, sem next-themes" -m "- paleta da caderneta com cores de saldo, IBM Plex Sans e sem tema escuro"
```

---

## Fase 3 — Estrutura e app shell

**Branch:** `feat/front-fase-3-estrutura`

### Task 3.1: Providers, QueryClient e rotas

**Files:**
- Create: `src/app/query-client.ts`, `src/app/providers.tsx`, `src/app/router.tsx`,
  `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/RegisterPage.tsx`,
  `src/features/groups/pages/GroupsPage.tsx`, `src/features/groups/pages/GroupDetailPage.tsx`
- Modify: `src/main.tsx`, `eslint.config.js`
- Delete: `src/App.tsx`, `src/App.css`, `src/assets/`

**Interfaces:**
- Produces: `queryClient`, `Providers`, `AppRouter` e as quatro rotas navegáveis. As páginas ganham conteúdo na Fase 7.

- [ ] **Step 1: `src/app/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

// 4xx não muda tentando de novo (403, 404, 409); só rede e 5xx ganham novas tentativas.
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status !== undefined && status < 500) return false
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry } },
})
```

- [ ] **Step 2: `src/app/providers.tsx`**

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from './query-client'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-center" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 3: Páginas iniciais** (cada uma só com o título; a Fase 7 as preenche)

`src/features/auth/pages/LoginPage.tsx`:
```tsx
export function LoginPage() {
  return <h1 className="text-2xl font-semibold">Entrar</h1>
}
```
`src/features/auth/pages/RegisterPage.tsx`:
```tsx
export function RegisterPage() {
  return <h1 className="text-2xl font-semibold">Criar conta</h1>
}
```
`src/features/groups/pages/GroupsPage.tsx`:
```tsx
export function GroupsPage() {
  return <h1 className="text-2xl font-semibold">Seus grupos</h1>
}
```
`src/features/groups/pages/GroupDetailPage.tsx`:
```tsx
export function GroupDetailPage() {
  return <h1 className="text-2xl font-semibold">Grupo</h1>
}
```

- [ ] **Step 4: `src/app/router.tsx`**

```tsx
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/groups/:groupId', element: <GroupDetailPage /> },
  { path: '*', element: <Navigate to="/groups" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 5: `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>,
)
```

- [ ] **Step 6: Apagar o demo do template e ignorar o código gerado no lint**

```powershell
Remove-Item src/App.tsx
Remove-Item src/App.css
Remove-Item -Recurse src/assets
```
Em `eslint.config.js`, `globalIgnores(['dist'])` vira `globalIgnores(['dist', 'src/api/generated'])`.

- [ ] **Step 7: Conferir no navegador**

```powershell
npm run dev
```
Expected: `/login` mostra "Entrar", `/` redireciona para `/groups` e a fonte é a IBM Plex Sans.

**Commit proposto (fechamento da Fase 3):**
```powershell
git add src/app src/features src/main.tsx eslint.config.js src/App.tsx src/App.css src/assets
git commit -m "feat: add app shell with providers and routes" -m "- QueryClient sem novas tentativas em 4xx" -m "- Toaster e Devtools nos providers" -m "- rotas de login, cadastro, grupos e detalhe; o resto redireciona para /groups" -m "- remove o demo do template e ignora o código gerado no lint"
```

---

## Fase B — Contrato do back para o front (repositório do back)

**Repositório:** `C:\dev\Projeto Rachamento de Contas\ProjetoRachamentoDeContas`. **Siga o CLAUDE.md e o ESTADO.md de
lá.**
**Pré-condição:** as correções de 13/10 (Próximo passo 1 do ESTADO) já commitadas com aprovação, e `main` limpa.
**Branch:** `fix/api-para-o-front`
**Decisões:** D-98 (com a extensão P-8), D-99, D-100 e D-104, aprovadas em 2026-10-13.
**Verificação desta fase** (comandos do back, com `docker compose up -d postgres redis` antes da integração):
```powershell
npx tsc --noEmit
npx vitest run
npx vitest run --coverage
npm run test:integration
```
No back, `tsc --noEmit` confere de verdade (o `tsconfig.json` inclui `src/**/*`).

### Task B.1: Mensagens de login e cadastro em português (D-104)

**Files:**
- Modify: `src/shared/errors/invalid-credentials-error.ts`, `src/shared/errors/user-already-exist-error.ts`
- Test: `src/tests/e2e/frontend-endpoints.spec.ts`

- [ ] **Step 1: Teste que falha**: acrescente ao fim de `frontend-endpoints.spec.ts`:

```ts
describe('Mensagens de login e cadastro em português (D-104)', () => {
    it('responde 401 em português para credenciais erradas', async () => {
        const res = await app.inject({
            method: 'POST', url: '/auth', payload: { email: 'ninguem@example.com', password: 'senha-errada' },
        })

        expect(res.statusCode).toBe(401)
        expect(res.json()).toEqual({ message: 'Email ou senha incorretos.' })
    })

    it('responde 409 em português para email já cadastrado', async () => {
        const res = await app.inject({
            method: 'POST', url: '/register', payload: { name: 'Outra Ana', email: 'ana@example.com', password: 'senha-forte-123' },
        })

        expect(res.statusCode).toBe(409)
        expect(res.json()).toEqual({ message: 'Já existe uma conta com este email.' })
    })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npx vitest run src/tests/e2e/frontend-endpoints.spec.ts
```
Expected: FAIL nos dois testes, recebendo `'Email or Password incorrect'` e `'User With Email Already Exist'`.

- [ ] **Step 3: Implementar**: troque só o texto do `super(...)`:

`invalid-credentials-error.ts`: `super('Email or Password incorrect')` → `super('Email ou senha incorretos.')`
`user-already-exist-error.ts`: `super('User With Email Already Exist')` → `super('Já existe uma conta com este email.')`

O `/refresh` também usa `InvalidCredentialsError`, mas devolve a mensagem fixa `'Refresh token inválido'`
(`refresh-token-controller.ts`), então não muda.

- [ ] **Step 4: Ver passar**

```powershell
npx vitest run src/tests/e2e/frontend-endpoints.spec.ts
```
Expected: PASS.

### Task B.2: `userId` nos membros (D-100)

**Files:**
- Modify: `src/application/repositories/member-repository.ts`, `src/infra/database/prisma/prismaMemberRepository.ts`,
  `src/tests/doubles/in-memory-member-repository.ts`, `src/infra/http/schemas/member.schema.ts`,
  `src/infra/http/controllers/get-group-controller.ts`, os dublês em `src/tests/e2e/groups.spec.ts:69`,
  `expenses.spec.ts:64`, `settlements.spec.ts:67` e `permission-denied.spec.ts:46`
- Test: `src/tests/e2e/frontend-endpoints.spec.ts`, `src/tests/integration/database/prisma-member-repository.spec.ts`

- [ ] **Step 1: Testes que falham**

Em `frontend-endpoints.spec.ts`:
```ts
describe('userId nos membros (D-100)', () => {
    it('devolve o userId de cada membro no detalhe do grupo e na listagem de membros', async () => {
        const expected = [[anaMember.id, ana.id], [brunoMember.id, bruno.id]]

        const detail = await app.inject({ method: 'GET', url: `/groups/${group.id}`, headers: bearer(ana) })
        const list = await app.inject({ method: 'GET', url: `/groups/${group.id}/members`, headers: bearer(ana) })

        expect(detail.statusCode).toBe(200)
        expect(detail.json().group.members.map((m: { id: string; userId: string }) => [m.id, m.userId])).toEqual(expected)
        expect(list.statusCode).toBe(200)
        expect(list.json().members.map((m: { id: string; userId: string }) => [m.id, m.userId])).toEqual(expected)
    })
})
```
Em `prisma-member-repository.spec.ts`, no teste `'should list active members with name and email, oldest first'`, a
asserção vira:
```ts
        expect(members.map(m => [m.name, m.email, m.role, m.userId])).toEqual([
            ['alice', 'alice@test.com', 'OWNER', ownerUserId],
            ['carla', 'carla@test.com', 'MEMBER', carlaUserId],
        ])
```

- [ ] **Step 2: Ver falhar**

```powershell
npx vitest run src/tests/e2e/frontend-endpoints.spec.ts
```
Expected: FAIL. `userId` vem `undefined` (o serializer descarta o campo que não está no schema).

- [ ] **Step 3: Implementar**

`member-repository.ts`, interface `MembersWithUser`:
```ts
export interface MembersWithUser {
    id: string
    userId: string
    role: 'OWNER' | 'MEMBER'
    joinedAt: Date
    name: string
    email: string
}
```
`prismaMemberRepository.ts`, no `return rows.map(...)` de `findByGroupIdWithUser`:
```ts
        return rows.map(row => ({
            id: row.id,
            userId: row.userId,
            role: row.role as 'OWNER' | 'MEMBER',
            joinedAt: row.joinedAt,
            name: row.user.name,
            email: row.user.email,
        }))
```
`in-memory-member-repository.ts`, no objeto devolvido por `findByGroupIdWithUser`: acrescente `userId: m.userId,` logo
depois de `id: m.id,`.

`member.schema.ts`:
```ts
export const memberWithUserShape = z.object({
    id: z.uuid(),
    userId: z.uuid(),
    role: z.enum(['OWNER', 'MEMBER']),
    joinedAt: z.date(),
    name: z.string(),
    email: z.string(),
})
```
`get-group-controller.ts`, dentro de `members.map(member => ({ ... }))`: acrescente `userId: member.userId,` logo
depois de `id: member.id,`.

Dublês dos e2e: nas quatro linhas listadas em **Files**, o objeto
`{ id: m.id, role: m.role, ... }` ganha `userId: m.userId` logo depois de `id: m.id`. Sem isso, o serializer devolve
500 nesses testes.

- [ ] **Step 4: Ver passar**

```powershell
npx tsc --noEmit
npx vitest run
docker compose up -d postgres redis
npm run test:integration
```
Expected: tudo PASS.

### Task B.3: Valores monetários como string nas requisições (D-98 + P-8)

**Files:**
- Modify: `src/infra/http/schemas/shared.schema.ts`, `src/infra/http/schemas/expense.schema.ts`,
  `src/infra/http/schemas/settlement.schema.ts`, `src/infra/http/controllers/create-expense-controller.ts`
- Test: `src/tests/e2e/frontend-endpoints.spec.ts`

- [ ] **Step 1: Testes que falham**

```ts
describe('Valores monetários como string (D-98)', () => {
    function expensePayload(amount: unknown) {
        return { description: 'Mercado', amount, payerId: ana.id, splitMethod: 'EQUAL', category: 'Compras', shares: [{ memberId: anaMember.id }] }
    }

    it('cria despesa com valor e partes em string, sem passar por float', async () => {
        const res = await app.inject({
            method: 'POST', url: `/groups/${group.id}/expenses`, headers: bearer(ana),
            payload: {
                description: 'Mercado', amount: '100.10', payerId: ana.id, splitMethod: 'FIXED', category: 'Compras',
                shares: [{ memberId: anaMember.id, amount: '50.05' }, { memberId: brunoMember.id, amount: '50.05' }],
            },
        })

        expect(res.statusCode).toBe(201)
        expect(res.json().expense).toMatchObject({
            amount: '100.10',
            shares: [{ memberId: anaMember.id, amount: '50.05' }, { memberId: brunoMember.id, amount: '50.05' }],
        })
    })

    it('continua aceitando number para quem já usa a API', async () => {
        const res = await app.inject({ method: 'POST', url: `/groups/${group.id}/expenses`, headers: bearer(ana), payload: expensePayload(90) })

        expect(res.statusCode).toBe(201)
        expect(res.json().expense.amount).toBe('90.00')
    })

    it('recusa string com mais de 2 casas, com vírgula, zerada ou sem número', async () => {
        for (const amount of ['10.005', '10,00', '0.00', 'abc']) {
            const res = await app.inject({ method: 'POST', url: `/groups/${group.id}/expenses`, headers: bearer(ana), payload: expensePayload(amount) })

            expect(res.statusCode, amount).toBe(400)
            expect(res.json().issues.map((i: { path: string }) => i.path), amount).toContain('amount')
        }
    })

    it('registra acerto com valor em string', async () => {
        repos.expenses.items.push(makeExpense())

        const res = await app.inject({
            method: 'POST', url: `/groups/${group.id}/settlements`, headers: bearer(bruno),
            payload: { fromMemberId: brunoMember.id, toMemberId: anaMember.id, amount: '45.00' },
        })

        expect(res.statusCode).toBe(201)
        expect(res.json().settlement).toMatchObject({ amount: '45.00', status: 'PENDING' })
    })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npx vitest run src/tests/e2e/frontend-endpoints.spec.ts
```
Expected: FAIL no primeiro e no último teste, com 400 "esperado number".

- [ ] **Step 3: Implementar**

`shared.schema.ts`, no fim do arquivo:
```ts
// D-98: dinheiro chega como string decimal ("1234.50"), que o front envia sem converter para float, ou como number,
// para quem já usa a API. A string recusa vírgula e mais de 2 casas para não haver arredondamento silencioso.
export const moneyInput = z.union([
    z.number().positive(),
    z.string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Use ponto e no máximo 2 casas decimais, como "1234.50"')
        .refine(value => !/^0+(\.0+)?$/.test(value), 'O valor precisa ser maior que zero'),
])
```
`expense.schema.ts`: importe `moneyInput` de `./shared.schema` e troque:
- em `shareInput`: `amount: z.number().positive().optional()` → `amount: moneyInput.optional()` (mantenha o `.describe(...)`);
- em `createExpenseBody`: `amount: z.number().positive()` → `amount: moneyInput`;
- em `updateExpenseBody` (P-8): `amount: z.number().positive().optional()` → `amount: moneyInput.optional()`.

`settlement.schema.ts`: importe `moneyInput` e troque `amount: z.number().positive().describe(...)` por
`amount: moneyInput.describe('Não pode exceder a dívida calculada')`.

`create-expense-controller.ts`, assinatura de `resolveShareAmounts`:
```ts
function resolveShareAmounts(
    shares: Array<{ memberId: string; amount?: number | string; percentage?: number }>,
    total: number | string,
    splitMethod: SplitMethodType,
): Array<{ memberId: string; amount: string }> {
```
O resto não muda: `String(...)`, `new Money(String(total))` e `new Decimal(...)` (no update e no confirm settlement)
aceitam string e number.

- [ ] **Step 4: Ver passar**

```powershell
npx tsc --noEmit
npx vitest run
```
Expected: PASS.

### Task B.4: Saldos descontam acertos confirmados e o cache acompanha (D-99)

**Files:**
- Modify: `src/application/use-cases/groups/get-group-balances-use-case.ts`,
  `src/infra/factories/make-get-group-balances-use-case.ts`, `src/infra/http/controllers/add-member-controller.ts`,
  `remove-member-controller.ts`, `leave-group-controller.ts`, `acknowledge-settlement-controller.ts`
- Test: `src/tests/unit/use-cases/get-group-balances-use-case.spec.ts`, `src/tests/e2e/frontend-endpoints.spec.ts`

- [ ] **Step 1: Testes de unidade que falham** (`get-group-balances-use-case.spec.ts`)

Importe `InMemorySettlementRepository` e `Settlement`, declare `let settlementRepository: InMemorySettlementRepository`
e troque o `beforeEach`:
```ts
  beforeEach(() => {
    groupRepository = new InMemoryGroupRepository()
    memberRepository = new InMemoryMemberRepository()
    expenseRepository = new InMemoryExpenseRepository()
    settlementRepository = new InMemorySettlementRepository()
    sut = new GetGroupBalancesUseCase(groupRepository, memberRepository, expenseRepository, settlementRepository)
  })
```
Acrescente um helper e três testes:
```ts
  async function ownerPaysHundredSplitInHalf() {
    const setup = await makeGroupWithTwoMembers()
    await expenseRepository.create(Expense.create({
      groupId: setup.group.id,
      payerId: setup.owner.userId,
      description: 'Jantar',
      amount: new Money('100.00'),
      shareInputs: [
        { memberId: setup.owner.id, amount: new Money('50.00') },
        { memberId: setup.member2.id, amount: new Money('50.00') },
      ],
      splitMethod: 'EQUAL',
    }))
    return setup
  }

  function settle(groupId: string, fromMemberId: string, toMemberId: string, amount: string, confirmed: boolean) {
    const settlement = Settlement.create({ groupId, fromMemberId, toMemberId, amount: new Money(amount) })
    if (confirmed) settlement.confirm()
    settlementRepository.items.push(settlement)
  }

  it('should zero balances and transfers after a confirmed settlement', async () => {
    const { group, owner, member2 } = await ownerPaysHundredSplitInHalf()
    settle(group.id, member2.id, owner.id, '50.00', true)

    const { memberBalances, transfers } = await sut.execute({ groupId: group.id, requestingUserId: owner.userId })

    expect(memberBalances.every(b => b.balance.isZero())).toBe(true)
    expect(transfers).toHaveLength(0)
  })

  it('should keep the debt while the settlement is only pending', async () => {
    const { group, owner, member2 } = await ownerPaysHundredSplitInHalf()
    settle(group.id, member2.id, owner.id, '50.00', false)

    const { transfers } = await sut.execute({ groupId: group.id, requestingUserId: owner.userId })

    expect(transfers).toHaveLength(1)
    expect(transfers[0].amount.toNumber()).toBe(50)
  })

  it('should leave only the remainder after a partial confirmed settlement', async () => {
    const { group, owner, member2 } = await ownerPaysHundredSplitInHalf()
    settle(group.id, member2.id, owner.id, '30.00', true)

    const { memberBalances, transfers } = await sut.execute({ groupId: group.id, requestingUserId: owner.userId })

    expect(memberBalances.find(b => b.memberId === owner.id)!.balance.toString()).toBe('20')
    expect(memberBalances.find(b => b.memberId === member2.id)!.balance.toString()).toBe('-20')
    expect(transfers[0].amount.toNumber()).toBe(20)
  })
```

- [ ] **Step 2: Testes e2e que falham** (`frontend-endpoints.spec.ts`)

Troque o mock do cache de saldos por um espião:
```ts
const balancesCache = vi.hoisted(() => ({ invalidate: vi.fn(async () => {}) }))
vi.mock('../../infra/cache/group-balances-cache', () => ({
    getGroupBalancesCache: async () => null,
    setGroupBalancesCache: async () => {},
    invalidateGroupBalancesCache: balancesCache.invalidate,
}))
```
No `beforeEach`, acrescente `balancesCache.invalidate.mockClear()`. Depois, acrescente:
```ts
describe('Saldos descontam acertos confirmados e o cache acompanha (D-99)', () => {
    function seedSettlement(status: 'PENDING' | 'CONFIRMED') {
        const settlement = new Settlement(
            crypto.randomUUID(), group.id, brunoMember.id, anaMember.id, new Money('45.00'), status,
            status === 'CONFIRMED' ? new Date('2026-10-13T00:00:00Z') : undefined, undefined, 0, new Date('2026-10-12T00:00:00Z'),
        )
        repos.settlements.items.push(settlement)
        return settlement
    }

    it('zera saldo e transferência depois que o credor confirma o acerto', async () => {
        repos.expenses.items.push(makeExpense())
        seedSettlement('CONFIRMED')

        const res = await app.inject({ method: 'GET', url: `/groups/${group.id}/balances`, headers: bearer(ana) })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({
            memberBalances: [
                { memberId: anaMember.id, userId: ana.id, balance: '0.00' },
                { memberId: brunoMember.id, userId: bruno.id, balance: '0.00' },
            ],
            transfers: [],
        })
    })

    it('invalida o cache ao adicionar membro', async () => {
        const res = await app.inject({ method: 'POST', url: `/groups/${group.id}/members`, headers: bearer(ana), payload: { email: 'carla@example.com' } })

        expect(res.statusCode).toBe(201)
        expect(balancesCache.invalidate).toHaveBeenCalledWith(group.id)
    })

    it('invalida o cache ao remover membro', async () => {
        const res = await app.inject({ method: 'DELETE', url: `/groups/${group.id}/members/${brunoMember.id}`, headers: bearer(ana) })

        expect(res.statusCode).toBe(204)
        expect(balancesCache.invalidate).toHaveBeenCalledWith(group.id)
    })

    it('invalida o cache quando alguém sai do grupo', async () => {
        const res = await app.inject({ method: 'DELETE', url: `/groups/${group.id}/leave`, headers: bearer(bruno) })

        expect(res.statusCode).toBe(204)
        expect(balancesCache.invalidate).toHaveBeenCalledWith(group.id)
    })

    it('invalida o cache quando o credor confirma o recebimento', async () => {
        const pending = seedSettlement('PENDING')

        const res = await app.inject({ method: 'PATCH', url: `/settlements/${pending.id}/acknowledge`, headers: bearer(ana) })

        expect(res.statusCode).toBe(200)
        expect(balancesCache.invalidate).toHaveBeenCalledWith(group.id)
    })
})
```

- [ ] **Step 3: Ver falhar**

```powershell
npx vitest run src/tests/unit/use-cases/get-group-balances-use-case.spec.ts
npx vitest run src/tests/e2e/frontend-endpoints.spec.ts
```
Expected: o unitário falha na compilação (o construtor não aceita o 4º argumento). Os e2e falham porque o saldo vem
45/-45 e o cache não é invalidado.

- [ ] **Step 4: Implementar o use case**

`get-group-balances-use-case.ts`: importe `SettlementRepository` de `'../../repositories/settlement-repository'`,
acrescente `private settlementRepository: SettlementRepository,` ao construtor e troque a busca e o cálculo:
```ts
        const [members, expenses, confirmedSettlements] = await Promise.all([
            this.memberRepository.findByGroupId(groupId),
            this.expenseRepository.findByGroupId(groupId),
            this.settlementRepository.findConfirmedByGroup(groupId),
        ])
```
Logo depois do `for (const expense of expenses) { ... }`, acrescente:
```ts
        // D-99: mesma regra de ComputeSettlements e ConfirmSettlement. Quem pagou o acerto deve menos; quem recebeu
        // tem menos a receber. Acerto pendente não conta até o credor confirmar.
        for (const settlement of confirmedSettlements) {
            const amount = settlement.amount.toDecimal()
            balanceMap.set(settlement.fromMemberId, (balanceMap.get(settlement.fromMemberId) ?? new Decimal(0)).plus(amount))
            balanceMap.set(settlement.toMemberId, (balanceMap.get(settlement.toMemberId) ?? new Decimal(0)).minus(amount))
        }
```
`make-get-group-balances-use-case.ts`:
```ts
import { GetGroupBalancesUseCase } from '../../application/use-cases/groups/get-group-balances-use-case'
import { PrismaGroupRepository } from '../database/prisma/prismaGroupRepository'
import { PrismaMemberRepository } from '../database/prisma/prismaMemberRepository'
import { PrismaExpenseRepository } from '../database/prisma/prismaExpenseRepository'
import { PrismaSettlementRepository } from '../database/prisma/prismaSettlementRepository'

export function makeGetGroupBalancesUseCase() {
    const groupRepository = new PrismaGroupRepository()
    const memberRepository = new PrismaMemberRepository()
    const expenseRepository = new PrismaExpenseRepository()
    const settlementRepository = new PrismaSettlementRepository()
    return new GetGroupBalancesUseCase(groupRepository, memberRepository, expenseRepository, settlementRepository)
}
```

- [ ] **Step 5: Implementar a invalidação nos quatro controllers**

Em cada um, importe `import { invalidateGroupBalancesCache } from '../../cache/group-balances-cache'` e chame-o
**depois** do use case e **antes** de emitir o evento ou responder:
- `add-member-controller.ts`: `await invalidateGroupBalancesCache(groupId)` depois de montar `memberPayload`.
- `remove-member-controller.ts`: `await invalidateGroupBalancesCache(groupId)` depois de `await useCase.execute(...)`.
- `leave-group-controller.ts`: `await invalidateGroupBalancesCache(groupId)` depois de `await useCase.execute(...)`.
- `acknowledge-settlement-controller.ts`: `await invalidateGroupBalancesCache(settlement.groupId)` depois do
  `useCase.execute(...)`.

- [ ] **Step 6: Ver passar e verificar a fase**

```powershell
npx tsc --noEmit
npx vitest run
npx vitest run --coverage
npm run test:integration
```
Expected: tudo PASS, com os thresholds do ESTADO mantidos.

- [ ] **Step 7: Atualizar o ESTADO.md do back**: D-98, D-99, D-100 e D-104 saem de "não feitas" e entram como
  implementadas na seção da etapa; atualize a baseline de testes e a "Última atualização".

**Commits propostos (fechamento da Fase B, um por decisão):**
```powershell
git add src/shared/errors/invalid-credentials-error.ts src/shared/errors/user-already-exist-error.ts src/tests/e2e/frontend-endpoints.spec.ts
git commit -m "fix: translate login and register errors to portuguese" -m "- D-104: Email ou senha incorretos / Já existe uma conta com este email" -m "- e2e cobre os dois textos"
git add src/application/repositories/member-repository.ts src/infra/database/prisma/prismaMemberRepository.ts src/tests/doubles/in-memory-member-repository.ts src/infra/http/schemas/member.schema.ts src/infra/http/controllers/get-group-controller.ts src/tests/e2e src/tests/integration/database/prisma-member-repository.spec.ts
git commit -m "feat: expose userId on group members" -m "- D-100: GET /groups/:id e /members trazem userId (aditivo)" -m "- o front liga o pagador (userId) ao membro sem cruzar com /balances"
git add src/infra/http/schemas src/infra/http/controllers/create-expense-controller.ts src/tests/e2e/frontend-endpoints.spec.ts
git commit -m "feat: accept decimal strings for money in requests" -m "- D-98: amount de despesa, partes e acerto aceitam string com até 2 casas, além de number" -m "- PATCH de despesa ganha o mesmo tipo porque shareInput é compartilhado" -m "- string com vírgula, mais de 2 casas ou zero responde 400"
git add src/application/use-cases/groups/get-group-balances-use-case.ts src/infra/factories/make-get-group-balances-use-case.ts src/infra/http/controllers src/tests/unit/use-cases/get-group-balances-use-case.spec.ts src/tests/e2e/frontend-endpoints.spec.ts ESTADO.md
git commit -m "fix: count confirmed settlements in group balances" -m "- D-99: GET /balances desconta acertos CONFIRMED, como compute e confirm" -m "- cache de saldos invalidado ao adicionar e remover membro, sair do grupo e confirmar acerto" -m "- ESTADO.md com D-98, D-99, D-100 e D-104 implementadas"
```
As quatro tarefas mexem em `frontend-endpoints.spec.ts`, então um commit por decisão só funciona se cada commit sair
logo depois da sua tarefa. **Ao liberar a fase, pergunte ao usuário qual caminho prefere:**
- (a) ele aprova as quatro mensagens antes de a fase começar, e cada commit sai logo depois de a sua tarefa passar;
- (b) um commit só no fim (`fix: align the api contract with the frontend`), com as quatro decisões em bullets.

---

## Fase 4 — Sessão, cliente HTTP e codegen

**Branch:** `feat/front-fase-4-api`
**Pré-condição:** Fase B integrada no back.

### Task 4.1: `auth-store` (TDD)

**Files:**
- Create: `src/features/auth/auth-store.ts`
- Test: `src/features/auth/auth-store.test.ts`
- Modify: `vite.config.ts` (remove `passWithNoTests`, P-9)

**Interfaces:**
- Produces: `getToken(): string | null`, `setToken(token: string): void`, `clearToken(): void`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './auth-store'

describe('auth-store', () => {
  it('devolve null quando não há sessão', () => {
    expect(getToken()).toBeNull()
  })

  it('guarda o token sob uma chave própria do splittr', () => {
    setToken('abc.def.ghi')

    expect(getToken()).toBe('abc.def.ghi')
    expect(localStorage.getItem('splittr:token')).toBe('abc.def.ghi')
  })

  it('substitui o token anterior quando a sessão é renovada', () => {
    setToken('velho')
    setToken('novo')

    expect(getToken()).toBe('novo')
  })

  it('apaga só o token do splittr ao sair', () => {
    localStorage.setItem('outra-app', 'x')
    setToken('abc')

    clearToken()

    expect(getToken()).toBeNull()
    expect(localStorage.getItem('outra-app')).toBe('x')
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/auth/auth-store.test.ts
```
Expected: FAIL, `Failed to resolve import "./auth-store"`.

- [ ] **Step 3: Implementar**

```ts
const KEY = 'splittr:token'

export const getToken = (): string | null => localStorage.getItem(KEY)
export const setToken = (token: string): void => localStorage.setItem(KEY, token)
export const clearToken = (): void => localStorage.removeItem(KEY)
```

- [ ] **Step 4: Ver passar e tirar o `passWithNoTests`**

Em `vite.config.ts`, apague a linha `passWithNoTests: true,`.
```powershell
npm run test -- --run
```
Expected: 4 testes PASS.

### Task 4.2: Renovação de sessão com um único refresh (TDD)

**Files:**
- Create: `src/api/refresh-session.ts`, `src/features/auth/session-expired.ts`
- Test: `src/api/refresh-session.test.ts`

**Interfaces:**
- Consumes: `setToken`, `clearToken` (4.1)
- Produces: `createRefreshSession(requestToken: () => Promise<string>, storeToken: (token: string) => void): RefreshSession`,
  `type RefreshSession = () => Promise<string>`, `refreshSession: RefreshSession` e `expireSession(): void`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createRefreshSession } from './refresh-session'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('createRefreshSession', () => {
  it('faz um único POST /refresh para chamadas simultâneas e entrega o mesmo token a todas', async () => {
    const pending = deferred<string>()
    const requestToken = vi.fn(() => pending.promise)
    const storeToken = vi.fn()
    const refresh = createRefreshSession(requestToken, storeToken)

    const calls = [refresh(), refresh(), refresh()]
    pending.resolve('novo-token')

    await expect(Promise.all(calls)).resolves.toEqual(['novo-token', 'novo-token', 'novo-token'])
    expect(requestToken).toHaveBeenCalledTimes(1)
    expect(storeToken).toHaveBeenCalledExactlyOnceWith('novo-token')
  })

  it('pede um token novo na expiração seguinte, depois que a anterior terminou', async () => {
    const requestToken = vi.fn().mockResolvedValueOnce('t1').mockResolvedValueOnce('t2')
    const refresh = createRefreshSession(requestToken, vi.fn())

    await refresh()

    await expect(refresh()).resolves.toBe('t2')
    expect(requestToken).toHaveBeenCalledTimes(2)
  })

  it('rejeita todas as chamadas quando o refresh falha, sem gravar token, e tenta de novo na próxima', async () => {
    const requestToken = vi.fn().mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce('t2')
    const storeToken = vi.fn()
    const refresh = createRefreshSession(requestToken, storeToken)

    await expect(Promise.all([refresh(), refresh()])).rejects.toThrow('401')
    expect(storeToken).not.toHaveBeenCalled()
    await expect(refresh()).resolves.toBe('t2')
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/api/refresh-session.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

`src/api/refresh-session.ts`:
```ts
import Axios from 'axios'
import { setToken } from '@/features/auth/auth-store'

export type RefreshSession = () => Promise<string>

// Quando o access token vence, várias requisições recebem 401 juntas; todas esperam o mesmo POST /refresh (D-101).
export function createRefreshSession(
  requestToken: () => Promise<string>,
  storeToken: (token: string) => void,
): RefreshSession {
  let inFlight: Promise<string> | null = null

  return () => {
    inFlight ??= requestToken()
      .then((token) => {
        storeToken(token)
        return token
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }
}

// Axios puro, fora do cliente com interceptors: um 401 aqui não pode disparar outro refresh.
export const refreshSession = createRefreshSession(
  () =>
    Axios.post<{ accessToken: string }>('/refresh', null, {
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
    }).then((response) => response.data.accessToken),
  setToken,
)
```
`src/features/auth/session-expired.ts`:
```ts
import { clearToken } from './auth-store'

// Recarrega a página de propósito: some com o cache do TanStack Query e com o socket da sessão vencida.
export function expireSession(): void {
  clearToken()
  window.location.assign('/login')
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/api/refresh-session.test.ts
```
Expected: 3 PASS.

### Task 4.3: Cliente HTTP com renovação no 401 (D-101)

**Files:**
- Create: `src/api/http-client.ts`
- Test: `src/api/http-client.test.ts`

**Interfaces:**
- Consumes: `getToken` (4.1), `refreshSession`, `expireSession` (4.2)
- Produces: `installAuthInterceptors(instance: AxiosInstance, deps: AuthInterceptorDeps): void`, `api: AxiosInstance` e
  `httpClient<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T>` (mutator do orval)

- [ ] **Step 1: Teste que falha**

```ts
import Axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { installAuthInterceptors } from './http-client'

type Reply = { status: number; data?: unknown }

function setup(handler: (config: InternalAxiosRequestConfig) => Reply, refreshResult: () => Promise<string> = async () => 'novo') {
  const session = { token: 'velho' as string | null }
  const seen: InternalAxiosRequestConfig[] = []
  const instance = Axios.create({
    adapter: async (config) => {
      seen.push(config)
      const { status, data = {} } = handler(config)
      const response = { status, data, statusText: String(status), headers: {}, config }
      if (status >= 400) throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, undefined, response)
      return response
    },
  })
  const refresh = vi.fn(async () => {
    session.token = await refreshResult()
    return session.token
  })
  const onSessionExpired = vi.fn()
  installAuthInterceptors(instance, { getToken: () => session.token, refresh, onSessionExpired })
  return { instance, seen, refresh, onSessionExpired }
}

const authorization = (config: InternalAxiosRequestConfig) => config.headers.get('Authorization')

describe('installAuthInterceptors', () => {
  it('envia o token atual no Authorization', async () => {
    const { instance, seen } = setup(() => ({ status: 200 }))

    await instance.get('/groups')

    expect(authorization(seen[0])).toBe('Bearer velho')
  })

  it('num 401, renova a sessão uma vez e repete a requisição com o token novo', async () => {
    const { instance, seen, refresh } = setup((config) =>
      authorization(config) === 'Bearer velho' ? { status: 401 } : { status: 200, data: { ok: true } },
    )

    const response = await instance.get('/groups')

    expect(response.data).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
    expect(authorization(seen[1])).toBe('Bearer novo')
  })

  it.each(['/auth', '/refresh'])('não tenta renovar quando o 401 vem de %s', async (url) => {
    const { instance, refresh, onSessionExpired } = setup(() => ({ status: 401 }))

    await expect(instance.post(url, {})).rejects.toMatchObject({ response: { status: 401 } })
    expect(refresh).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('encerra a sessão quando o refresh falha', async () => {
    const { instance, onSessionExpired } = setup(
      () => ({ status: 401 }),
      async () => {
        throw new Error('refresh recusado')
      },
    )

    await expect(instance.get('/groups')).rejects.toMatchObject({ response: { status: 401 } })
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('não entra em laço se a requisição repetida também volta 401', async () => {
    const { instance, seen, refresh } = setup(() => ({ status: 401 }))

    await expect(instance.get('/groups')).rejects.toMatchObject({ response: { status: 401 } })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
  })

  it('repassa outros erros sem renovar', async () => {
    const { instance, refresh } = setup(() => ({ status: 403 }))

    await expect(instance.get('/groups/x')).rejects.toMatchObject({ response: { status: 403 } })
    expect(refresh).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/api/http-client.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import Axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { getToken } from '@/features/auth/auth-store'
import { expireSession } from '@/features/auth/session-expired'
import { refreshSession } from './refresh-session'

export interface AuthInterceptorDeps {
  getToken: () => string | null
  refresh: () => Promise<string>
  onSessionExpired: () => void
}

// 401 nestas rotas não é token vencido: é senha errada (/auth) ou o próprio refresh recusado.
const NO_REFRESH_URLS = new Set(['/auth', '/refresh'])

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export function installAuthInterceptors(instance: AxiosInstance, deps: AuthInterceptorDeps): void {
  instance.interceptors.request.use((config) => {
    const token = deps.getToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    return config
  })

  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const canRefresh =
      error.response?.status === 401 && config !== undefined && !config._retried && !NO_REFRESH_URLS.has(config.url ?? '')
    if (!canRefresh) throw error

    config._retried = true
    try {
      await deps.refresh()
    } catch {
      deps.onSessionExpired()
      throw error
    }
    return instance(config)
  })
}

export const api = Axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })

installAuthInterceptors(api, { getToken, refresh: refreshSession, onSessionExpired: expireSession })

export const httpClient = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
  api({ ...config, ...options }).then(({ data }) => data as T)
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/api/http-client.test.ts
```
Expected: 7 PASS (o `it.each` conta como 2).

### Task 4.4: Codegen com orval

**Files:**
- Create: `orval.config.ts`, `src/api/generated/**` (gerado), `src/api/types.ts`
- Modify: `package.json` (script `api:gen`)

**Interfaces:**
- Consumes: `httpClient` (4.3) como mutator
- Produces: os hooks e tipos listados no Step 4, e em `src/api/types.ts`: `GroupMember`, `MemberBalance`, `Transfer`,
  `Expense`, `Settlement`

- [ ] **Step 1: `orval.config.ts`**

```ts
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
```
O `tsconfig` faz o orval gerar `import type` (o template usa `verbatimModuleSyntax`). Em `package.json`, acrescente o
script `"api:gen": "orval"`.

- [ ] **Step 2: Subir o back em modo de desenvolvimento** (outro terminal, na pasta do back)

```powershell
docker compose up -d postgres redis
npm run dev
```
Expected: o back escuta em `:3333`, e http://localhost:3333/docs/json responde.

- [ ] **Step 3: Gerar**

```powershell
npm run api:gen
Get-ChildItem -Recurse src/api/generated -Filter *.ts | Select-Object FullName
```
Expected: pastas `endpoints/{auth,users,groups,expenses,settlements,health}`, `model/` e `zod/`.

- [ ] **Step 4: Conferir os nomes que as próximas fases importam**

```powershell
$expected = [ordered]@{ useGetUsersMe='users'; usePatchUsersPixKey='users'; getGetUsersMeQueryKey='users'; usePostAuth='auth'; usePostRegister='auth'; usePostLogout='auth'; useGetGroups='groups'; usePostGroups='groups'; getGetGroupsQueryKey='groups'; useGetGroupsGroupId='groups'; GetGroupsGroupIdQueryResult='groups'; useGetGroupsGroupIdBalances='groups'; GetGroupsGroupIdBalancesQueryResult='groups'; usePostGroupsGroupIdMembers='groups'; postGroupsGroupIdMembers='groups'; useGetGroupsGroupIdExpenses='expenses'; GetGroupsGroupIdExpensesQueryResult='expenses'; usePostGroupsGroupIdExpenses='expenses'; postGroupsGroupIdExpenses='expenses'; useGetGroupsGroupIdSettlements='settlements'; GetGroupsGroupIdSettlementsQueryResult='settlements'; usePostGroupsGroupIdSettlements='settlements'; usePatchSettlementsSettlementIdAcknowledge='settlements' }
foreach ($name in $expected.Keys) { $file = "src/api/generated/endpoints/$($expected[$name])/$($expected[$name]).ts"; if (-not (Select-String -Path $file -Pattern "export (const|function|type) $name\b" -Quiet)) { "FALTA: $name em $file" } }
```
Expected: nenhuma linha impressa. Se faltar algum nome, a versão do orval nomeia diferente: pare, use
`superpowers:systematic-debugging` e reporte. Não renomeie à mão.

- [ ] **Step 5: Conferir o contrato da Fase B no código gerado**

```powershell
Select-String -Path src/api/generated/model/*.ts -Pattern "userId|amount" | Select-Object -First 40
```
Expected: os membros do grupo têm `userId: string`, e os campos `amount` dos corpos de criar despesa e de acerto
aceitam `number | string`. Se não, o back rodando não tem a Fase B: pare.

- [ ] **Step 6: `src/api/types.ts`**

```ts
import type {
  GetGroupsGroupIdBalancesQueryResult,
  GetGroupsGroupIdQueryResult,
} from '@/api/generated/endpoints/groups/groups'
import type { GetGroupsGroupIdExpensesQueryResult } from '@/api/generated/endpoints/expenses/expenses'
import type { GetGroupsGroupIdSettlementsQueryResult } from '@/api/generated/endpoints/settlements/settlements'

// Derivados das respostas para não depender dos nomes internos que o orval dá aos tipos aninhados.
export type GroupMember = GetGroupsGroupIdQueryResult['group']['members'][number]
export type MemberBalance = GetGroupsGroupIdBalancesQueryResult['memberBalances'][number]
export type Transfer = GetGroupsGroupIdBalancesQueryResult['transfers'][number]
export type Expense = GetGroupsGroupIdExpensesQueryResult['expenses'][number]
export type Settlement = GetGroupsGroupIdSettlementsQueryResult['settlements'][number]
```

- [ ] **Step 7: Conferir que o gerado compila**

```powershell
npx tsc -b
```
Expected: sem erro. Se o erro vier de `src/api/generated/zod` (P-11) ou de outro arquivo gerado, não edite o gerado:
use `superpowers:systematic-debugging` e apresente a correção como decisão.

### Task 4.5: Erros da API e erros de formulário

**Files:**
- Create: `src/lib/api-error.ts`, `src/lib/form-errors.ts`
- Test: `src/lib/api-error.test.ts`, `src/lib/form-errors.test.ts`

**Interfaces:**
- Produces: `toApiError(error: unknown): ApiError`, `interface ApiError { status: number | null; message: string; issues: ApiIssue[] }`,
  `NETWORK_ERROR_MESSAGE`, `RATE_LIMIT_MESSAGE`,
  `reportFormError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, resolveField: (path: string) => Path<T> | null): string | null`
  e `fieldsNamed<T extends FieldValues>(...names: Path<T>[]): (path: string) => Path<T> | null`

- [ ] **Step 1: Testes que falham**

`src/lib/api-error.test.ts`:
```ts
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { NETWORK_ERROR_MESSAGE, RATE_LIMIT_MESSAGE, toApiError } from './api-error'

function httpError(status: number, data: unknown) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('toApiError', () => {
  it('lê message e issues do formato D-90', () => {
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'name', message: 'Obrigatório' }] })

    expect(toApiError(error)).toEqual({ status: 400, message: 'Dados inválidos.', issues: [{ path: 'name', message: 'Obrigatório' }] })
  })

  it('usa a message da API em erros de regra, sem issues', () => {
    expect(toApiError(httpError(409, { message: 'Já existe um acerto pendente entre esses membros' }))).toEqual({
      status: 409,
      message: 'Já existe um acerto pendente entre esses membros',
      issues: [],
    })
  })

  it('troca 429 por um aviso de espera', () => {
    expect(toApiError(httpError(429, { message: 'Rate limit exceeded' })).message).toBe(RATE_LIMIT_MESSAGE)
  })

  it('trata 5xx e falta de resposta como falha de conexão', () => {
    expect(toApiError(httpError(500, { message: 'Internal server error.' }))).toMatchObject({ status: 500, message: NETWORK_ERROR_MESSAGE })
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))).toEqual({ status: null, message: NETWORK_ERROR_MESSAGE, issues: [] })
  })

  it('ignora issues fora do formato', () => {
    expect(toApiError(httpError(400, { message: 'x', issues: [{ campo: 'y' }] })).issues).toEqual([])
  })
})
```
`src/lib/form-errors.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { fieldsNamed, reportFormError } from './form-errors'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

type Values = { email: string; password: string }

function httpError(status: number, data: unknown) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  return new AxiosError('x', 'ERR', config, undefined, { status, data, statusText: '', headers: {}, config } as AxiosResponse)
}

describe('reportFormError', () => {
  it('põe cada issue no campo correspondente e não devolve mensagem de topo', () => {
    const setError = vi.fn()
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'email', message: 'Email inválido' }] })

    expect(reportFormError<Values>(error, setError, fieldsNamed<Values>('email', 'password'))).toBeNull()
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email inválido' })
  })

  it('devolve para o topo as issues sem campo no formulário', () => {
    const setError = vi.fn()
    const error = httpError(400, { message: 'Dados inválidos.', issues: [{ path: 'groupId', message: 'UUID inválido' }] })

    expect(reportFormError<Values>(error, setError, fieldsNamed<Values>('email'))).toBe('UUID inválido')
    expect(setError).not.toHaveBeenCalled()
  })

  it('devolve a message da API quando é erro de regra', () => {
    expect(reportFormError<Values>(httpError(401, { message: 'Email ou senha incorretos.' }), vi.fn(), fieldsNamed<Values>('email'))).toBe(
      'Email ou senha incorretos.',
    )
  })

  it('mostra toast e não devolve nada em falha de conexão', () => {
    expect(reportFormError<Values>(new AxiosError('Network Error', 'ERR_NETWORK'), vi.fn(), fieldsNamed<Values>('email'))).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Não foi possível falar com o servidor. Tente de novo.')
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/lib
```
Expected: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar**

`src/lib/api-error.ts`:
```ts
import { isAxiosError } from 'axios'

export interface ApiIssue {
  path: string
  message: string
}

export interface ApiError {
  status: number | null
  message: string
  issues: ApiIssue[]
}

export const NETWORK_ERROR_MESSAGE = 'Não foi possível falar com o servidor. Tente de novo.'
export const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde um minuto e tente de novo.'
const FALLBACK_MESSAGE = 'Algo deu errado. Tente de novo.'

const isIssue = (value: unknown): value is ApiIssue =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ApiIssue).path === 'string' &&
  typeof (value as ApiIssue).message === 'string'

export function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error) || !error.response) return { status: null, message: NETWORK_ERROR_MESSAGE, issues: [] }

  const { status, data } = error.response
  if (status === 429) return { status, message: RATE_LIMIT_MESSAGE, issues: [] }
  if (status >= 500) return { status, message: NETWORK_ERROR_MESSAGE, issues: [] }

  const body = (typeof data === 'object' && data !== null ? data : {}) as { message?: unknown; issues?: unknown }
  return {
    status,
    message: typeof body.message === 'string' ? body.message : FALLBACK_MESSAGE,
    issues: Array.isArray(body.issues) ? body.issues.filter(isIssue) : [],
  }
}
```
`src/lib/form-errors.ts`:
```ts
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { toApiError } from './api-error'

/**
 * Leva o erro da API ao formulário (spec 2.3): issues vão para os campos, rede e 5xx viram toast, e o que não tem
 * campo volta como mensagem para o topo do formulário.
 */
export function reportFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  resolveField: (path: string) => Path<T> | null,
): string | null {
  const apiError = toApiError(error)
  if (apiError.status === null || apiError.status >= 500) {
    toast.error(apiError.message)
    return null
  }
  if (apiError.issues.length === 0) return apiError.message

  const unmapped: string[] = []
  for (const issue of apiError.issues) {
    const field = resolveField(issue.path)
    if (field) setError(field, { type: 'server', message: issue.message })
    else unmapped.push(issue.message)
  }
  return unmapped.length > 0 ? unmapped.join(' ') : null
}

export function fieldsNamed<T extends FieldValues>(...names: Path<T>[]): (path: string) => Path<T> | null {
  return (path) => names.find((name) => name === path) ?? null
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/lib
```
Expected: 9 PASS.

### Task 4.6: Rotas protegidas

**Files:**
- Create: `src/features/auth/ProtectedRoute.tsx`, `src/features/auth/GuestRoute.tsx`
- Modify: `src/app/router.tsx`
- Test: `src/features/auth/route-guards.test.tsx`

**Interfaces:**
- Consumes: `getToken` (4.1)
- Produces: `ProtectedRoute` (sem token → `/login`) e `GuestRoute` (com token → `/groups`)

- [ ] **Step 1: Teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { setToken } from './auth-store'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>tela de login</p>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/groups" element={<p>tela de grupos</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('guardas de rota', () => {
  it('manda para o login quem abre uma tela protegida sem sessão', () => {
    renderAt('/groups')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('deixa entrar quem tem sessão', () => {
    setToken('t')
    renderAt('/groups')
    expect(screen.getByText('tela de grupos')).toBeInTheDocument()
  })

  it('manda para os grupos quem já está logado e abre o login', () => {
    setToken('t')
    renderAt('/login')
    expect(screen.getByText('tela de grupos')).toBeInTheDocument()
  })

  it('mostra o login para quem não tem sessão', () => {
    renderAt('/login')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/auth/route-guards.test.tsx
```
Expected: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar**

`ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router'
import { getToken } from './auth-store'

export function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />
}
```
`GuestRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router'
import { getToken } from './auth-store'

export function GuestRoute() {
  return getToken() ? <Navigate to="/groups" replace /> : <Outlet />
}
```
`src/app/router.tsx`:
```tsx
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { GuestRoute } from '@/features/auth/GuestRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/groups', element: <GroupsPage /> },
      { path: '/groups/:groupId', element: <GroupDetailPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/groups" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run
```
Expected: todos PASS.

**Commits propostos (fechamento da Fase 4):**
```powershell
git add src/features/auth/auth-store.ts src/features/auth/auth-store.test.ts vite.config.ts
git commit -m "feat: add token store for the session" -m "- token em localStorage sob splittr:token" -m "- passWithNoTests sai com o primeiro teste"
git add src/api/refresh-session.ts src/api/refresh-session.test.ts src/features/auth/session-expired.ts
git commit -m "feat: refresh the session with a single shared request" -m "- D-101: chamadas simultâneas esperam o mesmo POST /refresh" -m "- falha encerra a sessão e volta para o login"
git add src/api/http-client.ts src/api/http-client.test.ts
git commit -m "feat: add http client that retries once after refreshing" -m "- Authorization com o token atual e withCredentials para o cookie de refresh" -m "- 401 de /auth e /refresh não disparam renovação"
git add orval.config.ts package.json src/api/generated src/api/types.ts
git commit -m "feat: generate api hooks with orval" -m "- hooks do TanStack Query e tipos a partir do OpenAPI do back" -m "- tipos derivados em src/api/types.ts"
git add src/lib/api-error.ts src/lib/api-error.test.ts src/lib/form-errors.ts src/lib/form-errors.test.ts
git commit -m "feat: map api errors to forms and toasts" -m "- issues do D-90 nos campos, regra de domínio no topo" -m "- rede e 5xx em toast; 429 com aviso de espera"
git add src/features/auth/ProtectedRoute.tsx src/features/auth/GuestRoute.tsx src/features/auth/route-guards.test.tsx src/app/router.tsx
git commit -m "feat: guard routes by session" -m "- sem token vai para /login; logado não vê login nem cadastro"
```

---

## Fase 5 — Dinheiro, datas e destaque de atualização

**Branch:** `feat/front-fase-5-dinheiro`

### Task 5.1: `lib/money.ts` (TDD)

**Files:**
- Create: `src/lib/money.ts`
- Test: `src/lib/money.test.ts`

**Interfaces:**
- Produces: `formatBRL(amount: string): string`, `isValidAmountInput(input: string): boolean`,
  `toApiAmount(input: string): string`, `isZeroApiAmount(amount: string): boolean`, `type BalanceTone`,
  `balanceTone(balance: string): BalanceTone`, `absoluteAmount(amount: string): string`,
  `splitBRL(amount: string): { symbol: string; integer: string; cents: string }` e
  `approxEqualShare(amount: string, participants: number): string | null`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import {
  absoluteAmount,
  approxEqualShare,
  balanceTone,
  formatBRL,
  isValidAmountInput,
  isZeroApiAmount,
  splitBRL,
  toApiAmount,
} from './money'

// O Intl põe espaço não separável depois do "R$"; comparar com espaço comum falha sem motivo aparente.
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('formatBRL', () => {
  it('formata o valor da API em reais', () => {
    expect(normalize(formatBRL('1234.50'))).toBe('R$ 1.234,50')
  })

  it('usa espaço não separável depois do R$', () => {
    expect(formatBRL('1.00')).not.toBe('R$ 1,00')
    expect(normalize(formatBRL('1.00'))).toBe('R$ 1,00')
  })

  it('formata zero', () => {
    expect(normalize(formatBRL('0.00'))).toBe('R$ 0,00')
  })
})

describe('toApiAmount', () => {
  it.each([
    ['12,5', '12.50'],
    ['1.234,56', '1234.56'],
    ['0,01', '0.01'],
    ['1.234', '1234.00'],
    ['10', '10.00'],
    [' 7,5 ', '7.50'],
    ['007,10', '7.10'],
    ['0', '0.00'],
    ['12345678901234567,89', '12345678901234567.89'],
  ])('normaliza %s para %s', (input, expected) => {
    expect(toApiAmount(input)).toBe(expected)
  })

  it.each(['abc', '12,345', '12.5', '1.23', '', '-5', '1,', 'R$ 10'])('recusa %s', (input) => {
    expect(() => toApiAmount(input)).toThrow('Valor inválido')
  })
})

describe('isValidAmountInput', () => {
  it('aceita o formato brasileiro e recusa ponto decimal', () => {
    expect(isValidAmountInput('1.234,56')).toBe(true)
    expect(isValidAmountInput('12.5')).toBe(false)
  })
})

describe('balanceTone', () => {
  it.each([
    ['-50.00', 'negative'],
    ['50.00', 'positive'],
    ['0.00', 'settled'],
    ['-0.00', 'settled'],
  ])('%s é %s', (balance, tone) => {
    expect(balanceTone(balance)).toBe(tone)
  })
})

describe('isZeroApiAmount e absoluteAmount', () => {
  it('reconhece zero com ou sem sinal', () => {
    expect(isZeroApiAmount('0.00')).toBe(true)
    expect(isZeroApiAmount('-0.00')).toBe(true)
    expect(isZeroApiAmount('0.01')).toBe(false)
  })

  it('tira só o sinal de menos', () => {
    expect(absoluteAmount('-50.00')).toBe('50.00')
    expect(absoluteAmount('50.00')).toBe('50.00')
  })
})

describe('splitBRL', () => {
  it('separa símbolo, parte inteira e centavos para a etiqueta de preço', () => {
    expect(splitBRL('1234.50')).toEqual({ symbol: 'R$', integer: '1.234', cents: '50' })
    expect(splitBRL('50.00')).toEqual({ symbol: 'R$', integer: '50', cents: '00' })
  })
})

describe('approxEqualShare', () => {
  it('mostra a prévia aproximada por pessoa', () => {
    expect(normalize(approxEqualShare('10.00', 3) ?? '')).toBe('≈ R$ 3,33 cada')
    expect(normalize(approxEqualShare('100.00', 2) ?? '')).toBe('≈ R$ 50,00 cada')
  })

  it('não mostra nada sem participantes', () => {
    expect(approxEqualShare('10.00', 0)).toBeNull()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/lib/money.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "1234.50" (API) → "R$ 1.234,50". Só exibição: o Number nunca entra em conta. */
export const formatBRL = (amount: string): string => brl.format(Number(amount))

// Ponto só como separador de milhar, em grupos de 3 ("1.234,56"). "12.5" é recusado em vez de virar 125 (P-7).
const PT_BR_AMOUNT = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/

export const isValidAmountInput = (input: string): boolean => PT_BR_AMOUNT.test(input.trim())

/** "1.234,5" (digitado) → "1234.50" (API). Só operações de texto. */
export function toApiAmount(input: string): string {
  const trimmed = input.trim()
  if (!PT_BR_AMOUNT.test(trimmed)) throw new Error('Valor inválido')
  const [integerPart, decimalPart = ''] = trimmed.replace(/\./g, '').split(',')
  const integer = integerPart.replace(/^0+(?=\d)/, '')
  return `${integer}.${decimalPart.padEnd(2, '0')}`
}

export const isZeroApiAmount = (amount: string): boolean => /^-?0+(\.0+)?$/.test(amount)

export type BalanceTone = 'negative' | 'settled' | 'positive'

/** Tom do saldo pelo texto da API, sem Number (spec 2.5). */
export function balanceTone(balance: string): BalanceTone {
  if (isZeroApiAmount(balance)) return 'settled'
  return balance.startsWith('-') ? 'negative' : 'positive'
}

export const absoluteAmount = (amount: string): string => amount.replace(/^-/, '')

export interface BRLParts {
  symbol: string
  integer: string
  cents: string
}

/** Divide o texto de formatBRL para a etiqueta de preço (DESIGN 5.2). Espera valor sem sinal. */
export function splitBRL(amount: string): BRLParts {
  const match = /^(R\$)\s(.+),(\d{2})$/u.exec(formatBRL(amount))
  if (!match) throw new Error(`Valor fora do formato BRL: ${amount}`)
  return { symbol: match[1], integer: match[2], cents: match[3] }
}

/**
 * Prévia da divisão igual (spec, Tela 4). É a única divisão do front: aproximada, só para exibir, nunca vai para a
 * API e não distribui o resto dos centavos.
 */
export function approxEqualShare(amount: string, participants: number): string | null {
  if (participants < 1) return null
  return `≈ ${brl.format(Number(amount) / participants)} cada`
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/lib/money.test.ts
```
Expected: todos PASS.

### Task 5.2: `lib/dates.ts`

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Produces: `formatDate(iso: string): string` (dd/mm/aaaa), `todayInputValue(now?: Date): string` (aaaa-mm-dd) e
  `toNoonIso(dateInput: string): string`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { formatDate, todayInputValue, toNoonIso } from './dates'

describe('datas (fuso dos testes: America/Sao_Paulo)', () => {
  it('roda no fuso de São Paulo', () => {
    expect(new Date('2026-10-13T12:00:00').getTimezoneOffset()).toBe(180)
  })

  it('formata a data no dia local', () => {
    expect(formatDate('2026-10-13T15:00:00.000Z')).toBe('13/10/2026')
    expect(formatDate('2026-10-14T01:30:00.000Z')).toBe('13/10/2026')
  })

  it('usa o dia local para o padrão do campo de data, mesmo tarde da noite', () => {
    expect(todayInputValue(new Date('2026-10-14T01:30:00.000Z'))).toBe('2026-10-13')
  })

  it('envia o meio-dia local em ISO para o fuso não trocar o dia', () => {
    expect(toNoonIso('2026-10-13')).toBe('2026-10-13T15:00:00.000Z')
    expect(formatDate(toNoonIso('2026-01-01'))).toBe('01/01/2026')
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/lib/dates.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso))

const pad = (value: number) => String(value).padStart(2, '0')

/** Valor do <input type="date"> para o dia local de `now`. */
export function todayInputValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "2026-10-13" → meio-dia local em ISO, para o fuso não trocar o dia da despesa (spec, Tela 4). */
export const toNoonIso = (dateInput: string): string => new Date(`${dateInput}T12:00:00`).toISOString()
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/lib/dates.test.ts
```
Expected: 4 PASS.

### Task 5.3: `MoneyDisplay` (etiqueta de preço)

**Files:**
- Create: `src/components/MoneyDisplay.tsx`
- Test: `src/components/MoneyDisplay.test.tsx`

**Interfaces:**
- Consumes: `formatBRL`, `splitBRL` (5.1)
- Produces: `<MoneyDisplay amount: string (sem sinal) size: 'md' | 'lg' className?: string />`

- [ ] **Step 1: Teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MoneyDisplay } from './MoneyDisplay'

describe('MoneyDisplay', () => {
  it('lê o valor completo para leitores de tela e esconde as partes visuais', () => {
    const { container } = render(<MoneyDisplay amount="1234.50" size="md" />)

    expect(screen.getByText((text) => text.replace(/\s/g, ' ') === 'R$ 1.234,50')).toHaveClass('sr-only')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/components/MoneyDisplay.test.tsx
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```tsx
import { formatBRL, splitBRL } from '@/lib/money'
import { cn } from '@/lib/utils'

interface MoneyDisplayProps {
  amount: string
  size: 'md' | 'lg'
  className?: string
}

const SIZE = { md: 'text-2xl', lg: 'text-4xl tracking-tight' } satisfies Record<MoneyDisplayProps['size'], string>

/** Etiqueta de preço (DESIGN 5.2): "R$" pequeno e centavos elevados. Recebe valor sem sinal. */
export function MoneyDisplay({ amount, size, className }: MoneyDisplayProps) {
  const { symbol, integer, cents } = splitBRL(amount)
  return (
    <span className={cn('inline-flex items-start leading-none font-medium tabular-nums', SIZE[size], className)}>
      <span className="sr-only">{formatBRL(amount)}</span>
      <span aria-hidden="true" className="mr-[0.15em] text-[0.5em] font-normal text-muted-foreground">
        {symbol}
      </span>
      <span aria-hidden="true">{integer}</span>
      <span aria-hidden="true" className="text-[0.55em]">
        ,{cents}
      </span>
    </span>
  )
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/components/MoneyDisplay.test.tsx
```
Expected: PASS.

### Task 5.4: `useChangedKeys` (destaque de atualização, DESIGN 9)

**Files:**
- Create: `src/lib/use-changed-keys.ts`
- Test: `src/lib/use-changed-keys.test.ts`

**Interfaces:**
- Produces: `useChangedKeys(entries: ReadonlyArray<readonly [key: string, value: string]> | undefined, durationMs?: number): ReadonlySet<string>`.
  `undefined` significa "ainda carregando".

- [ ] **Step 1: Teste que falha**

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChangedKeys } from './use-changed-keys'

type Entries = Array<readonly [string, string]> | undefined

function setup(initial: Entries) {
  return renderHook(({ entries }: { entries: Entries }) => useChangedKeys(entries), { initialProps: { entries: initial } })
}

describe('useChangedKeys', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('não destaca nada na primeira carga', () => {
    const hook = setup(undefined)

    hook.rerender({ entries: [['ana', '50.00']] })

    expect(hook.result.current.size).toBe(0)
  })

  it('destaca a chave cujo valor mudou e apaga depois de 1,2 s', () => {
    const hook = setup([['ana', '0.00'], ['bruno', '0.00']])

    hook.rerender({ entries: [['ana', '50.00'], ['bruno', '0.00']] })
    expect([...hook.result.current]).toEqual(['ana'])

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(hook.result.current.size).toBe(0)
  })

  it('destaca uma linha nova numa lista que já tinha carregado, mesmo vazia', () => {
    const hook = setup([])

    hook.rerender({ entries: [['bruno->ana', '50.00']] })

    expect([...hook.result.current]).toEqual(['bruno->ana'])
  })

  it('não destaca quando só a referência do array muda', () => {
    const hook = setup([['ana', '50.00']])

    hook.rerender({ entries: [['ana', '50.00']] })

    expect(hook.result.current.size).toBe(0)
  })

  it('limpa o destaque quando uma linha apenas some', () => {
    const hook = setup([['a', '1'], ['b', '2']])
    hook.rerender({ entries: [['a', '2'], ['b', '2']] })

    hook.rerender({ entries: [['a', '2']] })

    expect(hook.result.current.size).toBe(0)
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/lib/use-changed-keys.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import { useEffect, useState } from 'react'

type Entries = ReadonlyArray<readonly [key: string, value: string]>

const NONE: ReadonlySet<string> = new Set()

function changedKeys(previous: string, next: string): ReadonlySet<string> {
  const before = new Map(JSON.parse(previous) as [string, string][])
  const keys = (JSON.parse(next) as [string, string][])
    .filter(([key, value]) => before.get(key) !== value)
    .map(([key]) => key)
  return keys.length > 0 ? new Set(keys) : NONE
}

/**
 * Chaves cujo valor mudou (ou que surgiram) desde a última renderização com dados, durante `durationMs` (DESIGN 9).
 * `undefined` = carregando: a primeira carga nunca destaca nada.
 */
export function useChangedKeys(entries: Entries | undefined, durationMs = 1200): ReadonlySet<string> {
  const signature = entries === undefined ? null : JSON.stringify(entries)
  const [previous, setPrevious] = useState(signature)
  const [changed, setChanged] = useState(NONE)

  // Ajuste de estado durante a renderização (padrão do React para "valor anterior"), sem efeito extra.
  if (signature !== previous) {
    setPrevious(signature)
    if (previous !== null && signature !== null) setChanged(changedKeys(previous, signature))
  }

  useEffect(() => {
    if (changed.size === 0) return
    const timer = setTimeout(() => setChanged(NONE), durationMs)
    return () => clearTimeout(timer)
  }, [changed, durationMs])

  return changed
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/lib/use-changed-keys.test.ts
```
Expected: 5 PASS.

**Commits propostos (fechamento da Fase 5):**
```powershell
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat: add money formatting and input normalization" -m "- formatBRL e toApiAmount só com operações de texto" -m "- ponto só como milhar: 12.5 é recusado em vez de virar 125" -m "- tom do saldo pelo sinal da string e prévia aproximada isolada"
git add src/lib/dates.ts src/lib/dates.test.ts
git commit -m "feat: add date helpers pinned to the local day" -m "- data da despesa vai como meio-dia local em ISO"
git add src/components/MoneyDisplay.tsx src/components/MoneyDisplay.test.tsx
git commit -m "feat: add price-tag money display" -m "- R$ pequeno e centavos elevados, com texto completo para leitor de tela"
git add src/lib/use-changed-keys.ts src/lib/use-changed-keys.test.ts
git commit -m "feat: highlight rows that changed after a refetch" -m "- primeira carga não destaca; linha nova e valor alterado destacam por 1,2 s"
```

---

## Fase 6 — Tempo real

**Branch:** `feat/front-fase-6-tempo-real`

### Task 6.1: Invalidação das queries de um grupo

**Files:**
- Create: `src/lib/invalidate-group.ts`
- Test: `src/lib/invalidate-group.test.ts`

**Interfaces:**
- Produces: `isGroupQueryKey(queryKey: readonly unknown[], groupId: string): boolean` e
  `invalidateGroupQueries(queryClient: QueryClient, groupId: string): Promise<void>`

- [ ] **Step 1: Teste que falha**

```ts
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { invalidateGroupQueries, isGroupQueryKey } from './invalidate-group'

describe('isGroupQueryKey', () => {
  it('reconhece todas as queries do grupo', () => {
    for (const key of ['/groups/g1', '/groups/g1/balances', '/groups/g1/expenses']) {
      expect(isGroupQueryKey([key], 'g1')).toBe(true)
    }
  })

  it('ignora outros grupos, um id que começa igual e a lista de grupos', () => {
    for (const key of ['/groups', '/groups/g2/balances', '/groups/g10/balances', '/users/me']) {
      expect(isGroupQueryKey([key], 'g1')).toBe(false)
    }
  })
})

describe('invalidateGroupQueries', () => {
  it('marca como desatualizadas só as queries do grupo', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['/groups/g1/balances'], {})
    queryClient.setQueryData(['/groups/g2/balances'], {})

    await invalidateGroupQueries(queryClient, 'g1')

    expect(queryClient.getQueryState(['/groups/g1/balances'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['/groups/g2/balances'])?.isInvalidated).toBe(false)
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/lib/invalidate-group.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import type { QueryClient } from '@tanstack/react-query'

// As query keys do orval começam pela URL; tudo sob /groups/:id é do grupo.
export function isGroupQueryKey(queryKey: readonly unknown[], groupId: string): boolean {
  const [url] = queryKey
  const base = `/groups/${groupId}`
  return typeof url === 'string' && (url === base || url.startsWith(`${base}/`))
}

export function invalidateGroupQueries(queryClient: QueryClient, groupId: string): Promise<void> {
  return queryClient.invalidateQueries({ predicate: (query) => isGroupQueryKey(query.queryKey, groupId) })
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/lib/invalidate-group.test.ts
```
Expected: 3 PASS.

### Task 6.2: Socket e recuperação da autenticação

**Files:**
- Create: `src/realtime/socket.ts`, `src/realtime/socket-auth.ts`, `src/realtime/use-socket-status.ts`
- Test: `src/realtime/socket-auth.test.ts`

**Interfaces:**
- Consumes: `getToken` (4.1), `refreshSession` e `expireSession` (4.2)
- Produces: `socket: Socket`, `installSocketAuthRecovery(socket: Pick<Socket, 'on' | 'connect'>, deps: { refresh: () => Promise<string>; onSessionExpired: () => void }): void`
  e `useSocketConnected(): boolean`

- [ ] **Step 1: Teste que falha**

```ts
import type { Socket } from 'socket.io-client'
import { describe, expect, it, vi } from 'vitest'
import { installSocketAuthRecovery } from './socket-auth'

function setup(refresh: () => Promise<string>) {
  const handlers = new Map<string, (error: Error) => void>()
  const socket = {
    on: vi.fn((event: string, handler: (error: Error) => void) => handlers.set(event, handler)),
    connect: vi.fn(),
  }
  const onSessionExpired = vi.fn()
  installSocketAuthRecovery(socket as unknown as Pick<Socket, 'on' | 'connect'>, { refresh, onSessionExpired })
  const fail = (message: string) => handlers.get('connect_error')?.(new Error(message))
  return { socket, onSessionExpired, fail }
}

describe('installSocketAuthRecovery', () => {
  it('renova a sessão e reconecta quando o back recusa por TOKEN_EXPIRED', async () => {
    const { socket, onSessionExpired, fail } = setup(async () => 'novo')

    fail('TOKEN_EXPIRED')

    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1))
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('encerra a sessão se a renovação falhar', async () => {
    const { socket, onSessionExpired, fail } = setup(async () => {
      throw new Error('refresh recusado')
    })

    fail('TOKEN_EXPIRED')

    await vi.waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1))
    expect(socket.connect).not.toHaveBeenCalled()
  })

  it('encerra a sessão quando o token é inválido', () => {
    const refresh = vi.fn(async () => 'novo')
    const { onSessionExpired, fail } = setup(refresh)

    fail('UNAUTHORIZED')

    expect(onSessionExpired).toHaveBeenCalledTimes(1)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('deixa o socket.io tentar de novo sozinho em falha de rede', () => {
    const refresh = vi.fn(async () => 'novo')
    const { socket, onSessionExpired, fail } = setup(refresh)

    fail('xhr poll error')

    expect(refresh).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
    expect(socket.connect).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/realtime/socket-auth.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

`src/realtime/socket-auth.ts`:
```ts
import type { Socket } from 'socket.io-client'

interface SocketAuthDeps {
  refresh: () => Promise<string>
  onSessionExpired: () => void
}

/**
 * Recusa no middleware do back não reconecta sozinha. Com TOKEN_EXPIRED, renovamos e reconectamos (a função `auth` do
 * socket relê o token). Com UNAUTHORIZED, a sessão acabou (D-101).
 */
export function installSocketAuthRecovery(socket: Pick<Socket, 'on' | 'connect'>, deps: SocketAuthDeps): void {
  socket.on('connect_error', (error: Error) => {
    if (error.message === 'TOKEN_EXPIRED') {
      deps.refresh().then(
        () => socket.connect(),
        () => deps.onSessionExpired(),
      )
      return
    }
    if (error.message === 'UNAUTHORIZED') deps.onSessionExpired()
  })
}
```
`src/realtime/socket.ts`:
```ts
import { io } from 'socket.io-client'
import { refreshSession } from '@/api/refresh-session'
import { getToken } from '@/features/auth/auth-store'
import { expireSession } from '@/features/auth/session-expired'
import { installSocketAuthRecovery } from './socket-auth'

export const socket = io(import.meta.env.VITE_WS_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
})

installSocketAuthRecovery(socket, { refresh: refreshSession, onSessionExpired: expireSession })
```
`src/realtime/use-socket-status.ts`:
```ts
import { useSyncExternalStore } from 'react'
import { socket } from './socket'

function subscribe(onChange: () => void) {
  socket.on('connect', onChange)
  socket.on('disconnect', onChange)
  return () => {
    socket.off('connect', onChange)
    socket.off('disconnect', onChange)
  }
}

export const useSocketConnected = (): boolean => useSyncExternalStore(subscribe, () => socket.connected)
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/realtime/socket-auth.test.ts
```
Expected: 4 PASS.

### Task 6.3: `useGroupRealtime` (TDD)

**Files:**
- Create: `src/realtime/use-group-realtime.ts`
- Test: `src/realtime/use-group-realtime.test.tsx`

**Interfaces:**
- Consumes: `socket` (6.2), `invalidateGroupQueries` (6.1)
- Produces: `useGroupRealtime(groupId: string): void` e `GROUP_EVENTS`

- [ ] **Step 1: Teste que falha**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGroupRealtime } from './use-group-realtime'

const fake = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload?: unknown) => void>>()
  return {
    handlers,
    socket: {
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set())
        handlers.get(event)!.add(handler)
      }),
      off: vi.fn((event: string, handler: (payload?: unknown) => void) => {
        handlers.get(event)?.delete(handler)
      }),
    },
    fire(event: string, payload?: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload))
    },
  }
})

vi.mock('./socket', () => ({ socket: fake.socket }))

const G1_BALANCES = ['/groups/g1/balances']
const G2_BALANCES = ['/groups/g2/balances']

function setup(groupId = 'g1') {
  const queryClient = new QueryClient()
  queryClient.setQueryData(G1_BALANCES, { memberBalances: [] })
  queryClient.setQueryData(G2_BALANCES, { memberBalances: [] })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  const hook = renderHook(({ id }: { id: string }) => useGroupRealtime(id), { wrapper, initialProps: { id: groupId } })
  const invalidated = (key: string[]) => queryClient.getQueryState(key)?.isInvalidated
  return { hook, queryClient, invalidated }
}

describe('useGroupRealtime', () => {
  beforeEach(() => {
    fake.handlers.clear()
    fake.socket.connected = false
    vi.clearAllMocks()
  })

  it('entra na sala na hora quando o socket já está conectado', () => {
    fake.socket.connected = true

    setup()

    expect(fake.socket.emit).toHaveBeenCalledWith('join_group', 'g1')
    expect(fake.socket.connect).not.toHaveBeenCalled()
  })

  it('conecta quando está desconectado e entra na sala no connect, buscando tudo de novo', () => {
    const { invalidated } = setup()
    expect(fake.socket.connect).toHaveBeenCalledTimes(1)
    expect(fake.socket.emit).not.toHaveBeenCalled()

    fake.fire('connect')

    expect(fake.socket.emit).toHaveBeenCalledWith('join_group', 'g1')
    expect(invalidated(G1_BALANCES)).toBe(true)
  })

  it('reentra na sala a cada reconexão', () => {
    setup()

    fake.fire('connect')
    fake.fire('connect')

    expect(fake.socket.emit).toHaveBeenCalledTimes(2)
  })

  it('invalida só as queries do grupo ao receber um evento dele', () => {
    const { invalidated } = setup()

    fake.fire('expense_created', { groupId: 'g1' })

    expect(invalidated(G1_BALANCES)).toBe(true)
    expect(invalidated(G2_BALANCES)).toBe(false)
  })

  it('ignora evento de outro grupo', () => {
    const { invalidated } = setup()

    fake.fire('balances_updated', { groupId: 'g2' })

    expect(invalidated(G1_BALANCES)).toBe(false)
  })

  it('nunca escuta settlement_computed', () => {
    setup()

    expect(fake.handlers.has('settlement_computed')).toBe(false)
  })

  it('nunca grava o payload do evento no cache', () => {
    const { queryClient } = setup()
    const before = queryClient.getQueryData(G1_BALANCES)

    fake.fire('balances_updated', { groupId: 'g1', memberBalances: [{ memberId: 'x', balance: '999.00' }] })

    expect(queryClient.getQueryData(G1_BALANCES)).toBe(before)
  })

  it('remove os mesmos listeners ao desmontar, sem evento de saída e sem desconectar', () => {
    const { hook } = setup()

    hook.unmount()

    for (const handlers of fake.handlers.values()) expect(handlers.size).toBe(0)
    expect(fake.socket.emit).not.toHaveBeenCalled()
    expect(fake.socket.disconnect).not.toHaveBeenCalled()
  })

  it('troca de sala quando o grupo muda', () => {
    fake.socket.connected = true
    const { hook } = setup('g1')

    hook.rerender({ id: 'g2' })

    expect(fake.socket.emit).toHaveBeenLastCalledWith('join_group', 'g2')
    expect([...fake.handlers.get('expense_created')!]).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/realtime/use-group-realtime.test.tsx
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { socket } from './socket'

// `settlement_computed` fica de fora: o back emite em todo GET de /settlements/compute, e escutar criaria um ciclo de
// refetch entre as abas (spec 2.4).
export const GROUP_EVENTS = [
  'expense_created',
  'expense_updated',
  'expense_deleted',
  'expense_categorized',
  'balances_updated',
  'member_added',
  'member_removed',
  'settlement_confirmed',
] as const

/** O socket só avisa; quem traz os dados é o REST (spec 2.4). */
export function useGroupRealtime(groupId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const join = () => {
      socket.emit('join_group', groupId)
    }
    // Reconexão perde as salas e pode ter perdido eventos: entra de novo e busca tudo.
    const onConnect = () => {
      join()
      void invalidateGroupQueries(queryClient, groupId)
    }
    const onGroupEvent = (payload?: { groupId?: string }) => {
      if (payload?.groupId !== groupId) return
      void invalidateGroupQueries(queryClient, groupId)
    }

    socket.on('connect', onConnect)
    GROUP_EVENTS.forEach((event) => socket.on(event, onGroupEvent))
    if (socket.connected) join()
    else socket.connect()

    return () => {
      socket.off('connect', onConnect)
      GROUP_EVENTS.forEach((event) => socket.off(event, onGroupEvent))
    }
  }, [groupId, queryClient])
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/realtime
```
Expected: todos PASS.

**Commits propostos (fechamento da Fase 6):**
```powershell
git add src/lib/invalidate-group.ts src/lib/invalidate-group.test.ts
git commit -m "feat: invalidate every query of a group" -m "- casa /groups/:id e o que vem depois, sem confundir ids com o mesmo começo"
git add src/realtime/socket.ts src/realtime/socket-auth.ts src/realtime/socket-auth.test.ts src/realtime/use-socket-status.ts
git commit -m "feat: add socket with session recovery" -m "- token relido a cada conexão" -m "- TOKEN_EXPIRED renova e reconecta; UNAUTHORIZED encerra a sessão" -m "- hook de status para o indicador ao vivo"
git add src/realtime/use-group-realtime.ts src/realtime/use-group-realtime.test.tsx
git commit -m "feat: refetch group data on realtime events" -m "- join_group a cada connect e invalidação só do grupo" -m "- payload nunca vai para o cache; settlement_computed não é escutado" -m "- sem evento de saída (D-103): o cleanup só remove os listeners"
```

---

## Fase 7.1 — Login, cadastro e layout logado

**Branch:** `feat/front-fase-7-1-login`

### Task 7.1.1: Schemas e componentes de formulário

**Files:**
- Create: `src/features/auth/schemas.ts`, `src/components/form-field.tsx`, `src/components/section-error.tsx`
- Test: `src/features/auth/schemas.test.ts`

**Interfaces:**
- Produces: `loginSchema`, `LoginValues`, `registerSchema`, `RegisterValues`,
  `<FormField label htmlFor error? hint? children />`, `<FormAlert message />` e `<SectionError message onRetry />`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './schemas'

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? [])

describe('loginSchema', () => {
  it('pede email válido e senha com pelo menos 6 caracteres, como o back', () => {
    expect(messages(loginSchema.safeParse({ email: 'ana', password: '123' }))).toEqual([
      'Informe um email válido.',
      'A senha tem pelo menos 6 caracteres.',
    ])
  })
})

describe('registerSchema', () => {
  it('aceita telefone em branco', () => {
    expect(registerSchema.safeParse({ name: 'Ana', email: 'ana@example.com', password: '123456', phone: '' }).success).toBe(true)
  })

  it('recusa nome só com espaços', () => {
    expect(messages(registerSchema.safeParse({ name: '  ', email: 'ana@example.com', password: '123456', phone: '' }))).toEqual([
      'Informe seu nome.',
    ])
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/auth/schemas.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

`src/features/auth/schemas.ts`:
```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um email válido.'),
  password: z.string().min(6, 'A senha tem pelo menos 6 caracteres.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.'),
  email: z.email('Informe um email válido.'),
  password: z.string().min(6, 'Use pelo menos 6 caracteres.'),
  phone: z.string().trim(),
})
export type RegisterValues = z.infer<typeof registerSchema>
```
`src/components/form-field.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormAlert({ message }: { message: string | null | undefined }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}
```
`src/components/section-error.tsx`:
```tsx
import { Button } from '@/components/ui/button'

export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid gap-3 p-4">
      <p className="text-sm">{message}</p>
      <div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/auth/schemas.test.ts
```
Expected: 3 PASS.

### Task 7.1.2: Telas de login e cadastro (Tela 1)

**Files:**
- Create: `src/features/auth/components/AuthLayout.tsx`
- Modify: `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/RegisterPage.tsx`

**Interfaces:**
- Consumes: `usePostAuth`, `usePostRegister` (4.4), `setToken` (4.1), `reportFormError` e `fieldsNamed` (4.5),
  `FormField` e `FormAlert` (7.1.1)

- [ ] **Step 1: `AuthLayout.tsx`**

```tsx
import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <header className="grid gap-1">
        <p className="text-2xl font-semibold">splittr</p>
        <p className="text-sm text-muted-foreground">Divida as despesas do grupo e acerte por Pix.</p>
      </header>
      {children}
    </main>
  )
}
```

- [ ] **Step 2: `LoginPage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { usePostAuth } from '@/api/generated/endpoints/auth/auth'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { setToken } from '../auth-store'
import { AuthLayout } from '../components/AuthLayout'
import { type LoginValues, loginSchema } from '../schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const login = usePostAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const { accessToken } = await login.mutateAsync({ data: values })
      setToken(accessToken)
      navigate('/groups', { replace: true })
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<LoginValues>('email', 'password')))
    }
  })

  return (
    <AuthLayout>
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        <h1 className="text-base font-semibold">Entrar</h1>
        {notice ? (
          <p role="status" className="text-sm">
            {notice}
          </p>
        ) : null}
        <FormAlert message={formError} />
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </FormField>
        <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 3: `RegisterPage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { usePostAuth, usePostRegister } from '@/api/generated/endpoints/auth/auth'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { setToken } from '../auth-store'
import { AuthLayout } from '../components/AuthLayout'
import { type RegisterValues, registerSchema } from '../schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = usePostRegister()
  const login = usePostAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  })

  const onSubmit = handleSubmit(async ({ name, email, password, phone }) => {
    setFormError(null)
    try {
      await registerUser.mutateAsync({ data: { name, email, password, ...(phone ? { phone } : {}) } })
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<RegisterValues>('name', 'email', 'password', 'phone')))
      return
    }
    try {
      const { accessToken } = await login.mutateAsync({ data: { email, password } })
      setToken(accessToken)
      navigate('/groups', { replace: true })
    } catch {
      navigate('/login', { replace: true, state: { notice: 'Conta criada. Entre com seu email e senha.' } })
    }
  })

  return (
    <AuthLayout>
      <form noValidate onSubmit={onSubmit} className="grid gap-4">
        <h1 className="text-base font-semibold">Criar conta</h1>
        <FormAlert message={formError} />
        <FormField label="Nome" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </FormField>
        <FormField label="Senha" htmlFor="password" hint="Pelo menos 6 caracteres." error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Telefone"
          htmlFor="phone"
          hint="Opcional. Permite que te adicionem a grupos pelo número."
          error={errors.phone?.message}
        >
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
```

### Task 7.1.3: Layout logado e logout

**Files:**
- Create: `src/app/AppLayout.tsx`, `src/features/auth/use-logout.ts`
- Modify: `src/app/router.tsx`

**Interfaces:**
- Consumes: `useGetUsersMe`, `usePostLogout` (4.4), `clearToken` (4.1), `socket` (6.2), `toApiError` (4.5)
- Produces: `useLogout(): () => Promise<void>` e `AppLayout` (cabeçalho e `<Outlet />`)

- [ ] **Step 1: `use-logout.ts`**

```ts
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { usePostLogout } from '@/api/generated/endpoints/auth/auth'
import { socket } from '@/realtime/socket'
import { clearToken } from './auth-store'

export function useLogout(): () => Promise<void> {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { mutateAsync } = usePostLogout()

  return useCallback(async () => {
    try {
      await mutateAsync()
    } catch {
      // O logout do back é idempotente; a saída local acontece mesmo se ele falhar (spec 2.2).
    }
    clearToken()
    socket.disconnect()
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [mutateAsync, queryClient, navigate])
}
```

- [ ] **Step 2: `AppLayout.tsx`**

```tsx
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet } from 'react-router'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/use-logout'
import { toApiError } from '@/lib/api-error'

export function AppLayout() {
  const me = useGetUsersMe()
  const logout = useLogout()
  const userGone = me.isError && toApiError(me.error).status === 404

  // Token válido de um usuário que não existe mais (spec 2.2).
  useEffect(() => {
    if (userGone) void logout()
  }, [userGone, logout])

  return (
    <div className="min-h-svh">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
          <Link to="/groups" className="mr-auto text-2xl font-semibold">
            splittr
          </Link>
          {me.data ? <span className="hidden text-sm sm:inline">{me.data.user.name}</span> : null}
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: `router.tsx`**: o bloco protegido passa a envolver as páginas com o layout:

```tsx
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/groups', element: <GroupsPage /> },
          { path: '/groups/:groupId', element: <GroupDetailPage /> },
        ],
      },
    ],
  },
```
Acrescente `import { AppLayout } from '@/app/AppLayout'`.

- [ ] **Step 4: Conferir com o back rodando**

```powershell
npm run dev
```
Expected:
- cadastro novo entra direto em `/groups`, com o nome no cabeçalho;
- login com senha errada mostra "Email ou senha incorretos." no topo;
- email repetido no cadastro mostra "Já existe uma conta com este email.";
- "Sair" volta para `/login`, e `/groups` passa a redirecionar para o login.

**Commits propostos (fechamento da Fase 7.1):**
```powershell
git add src/features/auth/schemas.ts src/features/auth/schemas.test.ts src/components/form-field.tsx src/components/section-error.tsx
git commit -m "feat: add auth schemas and form primitives" -m "- regras de login e cadastro iguais às do back" -m "- campo com rótulo, erro e dica; alerta de topo; erro de seção com nova tentativa"
git add src/features/auth/components/AuthLayout.tsx src/features/auth/pages
git commit -m "feat: add login and register screens" -m "- cadastro entra logado em seguida; se o login falhar, vai para o login com aviso" -m "- erros da API nos campos ou no topo do formulário"
git add src/app/AppLayout.tsx src/features/auth/use-logout.ts src/app/router.tsx
git commit -m "feat: add signed-in layout with logout" -m "- cabeçalho com nome e Sair" -m "- logout limpa token, socket e cache mesmo se o POST falhar" -m "- usuário inexistente (404 em /users/me) sai da sessão"
```

---

## Fase 7.2 — Grupos (Tela 2)

**Branch:** `feat/front-fase-7-2-grupos`

### Task 7.2.1: Schemas dos grupos

**Files:**
- Create: `src/features/groups/schemas.ts`
- Test: `src/features/groups/schemas.test.ts`

**Interfaces:**
- Produces: `createGroupSchema`, `CreateGroupValues`, `addMemberSchema`, `AddMemberValues` e
  `toAddMemberBody(values: AddMemberValues): { email: string } | { phone: string }` (usado na 7.3)

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { addMemberSchema, createGroupSchema, toAddMemberBody } from './schemas'

describe('createGroupSchema', () => {
  it('exige nome e aceita descrição vazia', () => {
    expect(createGroupSchema.safeParse({ name: 'Viagem', description: '' }).success).toBe(true)
    expect(createGroupSchema.safeParse({ name: ' ', description: '' }).success).toBe(false)
  })
})

describe('addMemberSchema', () => {
  it('confere o formato só quando a busca é por email', () => {
    expect(addMemberSchema.safeParse({ kind: 'email', contact: 'bruno' }).success).toBe(false)
    expect(addMemberSchema.safeParse({ kind: 'phone', contact: '(11) 98765-4321' }).success).toBe(true)
  })

  it('envia exatamente um entre email e telefone, como o D-77 exige', () => {
    expect(toAddMemberBody({ kind: 'email', contact: 'bruno@example.com' })).toEqual({ email: 'bruno@example.com' })
    expect(toAddMemberBody({ kind: 'phone', contact: '11987654321' })).toEqual({ phone: '11987654321' })
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/groups/schemas.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao grupo.'),
  description: z.string().trim(),
})
export type CreateGroupValues = z.infer<typeof createGroupSchema>

export const addMemberSchema = z
  .object({
    kind: z.enum(['email', 'phone']),
    contact: z.string().trim().min(1, 'Informe o contato.'),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'email' && !z.email().safeParse(values.contact).success) {
      ctx.addIssue({ code: 'custom', path: ['contact'], message: 'Informe um email válido.' })
    }
  })
export type AddMemberValues = z.infer<typeof addMemberSchema>

export function toAddMemberBody({ kind, contact }: AddMemberValues): { email: string } | { phone: string } {
  return kind === 'email' ? { email: contact } : { phone: contact }
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/groups/schemas.test.ts
```
Expected: 3 PASS.

### Task 7.2.2: Tela de grupos e diálogo de criação

**Files:**
- Create: `src/features/groups/components/CreateGroupDialog.tsx`
- Modify: `src/features/groups/pages/GroupsPage.tsx`

**Interfaces:**
- Consumes: `useGetGroups`, `usePostGroups`, `getGetGroupsQueryKey` (4.4), `SectionError`, `FormField` e
  `FormAlert` (7.1.1), `reportFormError` e `toApiError` (4.5)

- [ ] **Step 1: `CreateGroupDialog.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getGetGroupsQueryKey, usePostGroups } from '@/api/generated/endpoints/groups/groups'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { type CreateGroupValues, createGroupSchema } from '../schemas'

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createGroup = usePostGroups()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupValues>({ resolver: zodResolver(createGroupSchema), defaultValues: { name: '', description: '' } })

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setFormError(null)
    }
  }

  const onSubmit = handleSubmit(async ({ name, description }) => {
    setFormError(null)
    try {
      const { group } = await createGroup.mutateAsync({ data: { name, ...(description ? { description } : {}) } })
      toast.success('Grupo criado')
      void queryClient.invalidateQueries({ queryKey: getGetGroupsQueryKey() })
      changeOpen(false)
      navigate(`/groups/${group.id}`)
    } catch (error) {
      setFormError(reportFormError(error, setError, fieldsNamed<CreateGroupValues>('name', 'description')))
    }
  })

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button>Criar grupo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>Depois de criar, adicione as pessoas pelo email ou telefone.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="grid gap-4">
          <FormAlert message={formError} />
          <FormField label="Nome" htmlFor="group-name" error={errors.name?.message}>
            <Input id="group-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          </FormField>
          <FormField label="Descrição" htmlFor="group-description" hint="Opcional." error={errors.description?.message}>
            <Input id="group-description" {...register('description')} />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Criar grupo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: `GroupsPage.tsx`**

```tsx
import { Link } from 'react-router'
import { useGetGroups } from '@/api/generated/endpoints/groups/groups'
import { SectionError } from '@/components/section-error'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiError } from '@/lib/api-error'
import { CreateGroupDialog } from '../components/CreateGroupDialog'

function GroupsContent() {
  const { data, isPending, isError, error, refetch } = useGetGroups()

  if (isPending) {
    return (
      <ul className="divide-y">
        {[0, 1, 2].map((row) => (
          <li key={row} className="grid gap-2 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </li>
        ))}
      </ul>
    )
  }
  if (isError) return <SectionError message={toApiError(error).message} onRetry={() => void refetch()} />
  if (data.groups.length === 0) {
    return (
      <div className="grid gap-3 p-4">
        <p className="max-w-prose text-sm">
          Você ainda não participa de nenhum grupo. Crie um ou peça para alguém te adicionar pelo seu email.
        </p>
        <div>
          <CreateGroupDialog />
        </div>
      </div>
    )
  }
  return (
    <ul className="divide-y">
      {data.groups.map((group) => (
        <li key={group.id}>
          <Link
            to={`/groups/${group.id}`}
            className="block p-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <span className="block font-medium">{group.name}</span>
            {group.description ? <span className="block text-sm text-muted-foreground">{group.description}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function GroupsPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Seus grupos</h1>
        <CreateGroupDialog />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <GroupsContent />
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Conferir com o back rodando**

Expected:
- lista vazia mostra o texto do estado vazio e o botão;
- "Criar grupo" com nome em branco mostra "Dê um nome ao grupo.";
- criar leva ao detalhe do grupo novo;
- com o back desligado, a lista mostra a mensagem e "Tentar de novo".

**Commits propostos (fechamento da Fase 7.2):**
```powershell
git add src/features/groups/schemas.ts src/features/groups/schemas.test.ts
git commit -m "feat: add group and member form schemas" -m "- nome obrigatório; convite por exatamente um entre email e telefone"
git add src/features/groups/components/CreateGroupDialog.tsx src/features/groups/pages/GroupsPage.tsx
git commit -m "feat: add groups screen with create dialog" -m "- lista num único card, com estados de carregando, vazio e erro" -m "- criar grupo leva ao detalhe; toast Grupo criado"
```

---

## Fase 7.3 — Detalhe do grupo (Tela 3)

**Branch:** `feat/front-fase-7-3-detalhe`

### Task 7.3.1: Leitura dos dados do grupo

**Files:**
- Create: `src/features/groups/group-view.ts`, `src/features/expenses/expense-view.ts`
- Test: `src/features/groups/group-view.test.ts`, `src/features/expenses/expense-view.test.ts`

**Interfaces:**
- Consumes: `GroupMember` (4.4)
- Produces: `FORMER_MEMBER`, `memberName(members, memberId): string`, `nameByUserId(members, userId): string`,
  `findMyMember(members, userId?): GroupMember | undefined`, `type Pair = { fromMemberId: string; toMemberId: string }`,
  `samePair(a, b): boolean`, `transferKey(pair): string`, `type TransferAction = 'pay' | 'awaiting' | 'none'`,
  `transferAction(transfer, myMemberId, pending): TransferAction` e
  `myShareAmount(shares, myMemberId): string | null`

- [ ] **Step 1: Testes que falham**

`group-view.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import type { GroupMember } from '@/api/types'
import { FORMER_MEMBER, findMyMember, memberName, nameByUserId, transferAction, transferKey } from './group-view'

const members = [
  { id: 'm-ana', userId: 'u-ana', name: 'Ana', email: 'ana@example.com', role: 'OWNER', joinedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'm-bruno', userId: 'u-bruno', name: 'Bruno', email: 'bruno@example.com', role: 'MEMBER', joinedAt: '2026-10-02T00:00:00.000Z' },
] as GroupMember[]

describe('nomes', () => {
  it('acha o nome pelo membro e pelo usuário', () => {
    expect(memberName(members, 'm-bruno')).toBe('Bruno')
    expect(nameByUserId(members, 'u-ana')).toBe('Ana')
  })

  it('chama de ex-membro quem já saiu do grupo', () => {
    expect(memberName(members, 'm-saiu')).toBe(FORMER_MEMBER)
    expect(nameByUserId(members, 'u-saiu')).toBe(FORMER_MEMBER)
  })

  it('acha o meu membro pelo meu usuário', () => {
    expect(findMyMember(members, 'u-bruno')?.id).toBe('m-bruno')
    expect(findMyMember(members, undefined)).toBeUndefined()
  })
})

describe('transferAction', () => {
  const bruno2ana = { fromMemberId: 'm-bruno', toMemberId: 'm-ana' }

  it('oferece Pagar só para quem deve', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [])).toBe('pay')
    expect(transferAction(bruno2ana, 'm-ana', [])).toBe('none')
    expect(transferAction(bruno2ana, undefined, [])).toBe('none')
  })

  it('mostra aguardando quando já existe acerto pendente do mesmo par', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [bruno2ana])).toBe('awaiting')
    expect(transferAction(bruno2ana, 'm-ana', [bruno2ana])).toBe('awaiting')
  })

  it('não confunde com o par invertido', () => {
    expect(transferAction(bruno2ana, 'm-bruno', [{ fromMemberId: 'm-ana', toMemberId: 'm-bruno' }])).toBe('pay')
  })

  it('gera uma chave estável por par', () => {
    expect(transferKey(bruno2ana)).toBe('m-bruno->m-ana')
  })
})
```
`expense-view.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { myShareAmount } from './expense-view'

describe('myShareAmount', () => {
  const shares = [
    { id: 's1', memberId: 'm-ana', amount: '33.34' },
    { id: 's2', memberId: 'm-bruno', amount: '33.33' },
  ]

  it('devolve a minha parte exatamente como veio da API', () => {
    expect(myShareAmount(shares, 'm-bruno')).toBe('33.33')
  })

  it('devolve null quando não participo', () => {
    expect(myShareAmount(shares, 'm-carla')).toBeNull()
    expect(myShareAmount(shares, undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/groups/group-view.test.ts src/features/expenses/expense-view.test.ts
```
Expected: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar**

`group-view.ts`:
```ts
import type { GroupMember } from '@/api/types'

export const FORMER_MEMBER = 'ex-membro'

export const memberName = (members: GroupMember[], memberId: string): string =>
  members.find((member) => member.id === memberId)?.name ?? FORMER_MEMBER

export const nameByUserId = (members: GroupMember[], userId: string): string =>
  members.find((member) => member.userId === userId)?.name ?? FORMER_MEMBER

export const findMyMember = (members: GroupMember[], userId: string | undefined): GroupMember | undefined =>
  userId === undefined ? undefined : members.find((member) => member.userId === userId)

export type Pair = { fromMemberId: string; toMemberId: string }

export const samePair = (a: Pair, b: Pair): boolean => a.fromMemberId === b.fromMemberId && a.toMemberId === b.toMemberId

export const transferKey = (pair: Pair): string => `${pair.fromMemberId}->${pair.toMemberId}`

export type TransferAction = 'pay' | 'awaiting' | 'none'

/** O que a linha de "Quem paga quem" oferece (spec, Tela 3). */
export function transferAction(transfer: Pair, myMemberId: string | undefined, pending: Pair[]): TransferAction {
  if (pending.some((settlement) => samePair(settlement, transfer))) return 'awaiting'
  return transfer.fromMemberId === myMemberId ? 'pay' : 'none'
}
```
`expense-view.ts`:
```ts
/** "Sua parte" é uma busca na resposta da API, não uma conta (spec, Tela 3). */
export function myShareAmount(shares: { memberId: string; amount: string }[], myMemberId: string | undefined): string | null {
  if (myMemberId === undefined) return null
  return shares.find((share) => share.memberId === myMemberId)?.amount ?? null
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/groups/group-view.test.ts src/features/expenses/expense-view.test.ts
```
Expected: todos PASS.

### Task 7.3.2: Card de saldos e Quem paga quem

**Files:**
- Create: `src/features/groups/components/BalancesCard.tsx`, `src/features/groups/components/TransfersList.tsx`

**Interfaces:**
- Consumes: `useGetGroupsGroupIdBalances`, `useGetGroupsGroupIdSettlements` (4.4), `balanceTone`, `absoluteAmount`,
  `formatBRL` (5.1), `MoneyDisplay` (5.3), `useChangedKeys` (5.4) e o que vem da 7.3.1
- Produces: `<BalancesCard groupId members myMemberId onPay? />` (a 7.5 acrescenta `onAcknowledge?` e `onViewPix?`) e
  `<TransfersList transfers members pending myMemberId highlighted onPay? />`

- [ ] **Step 1: `TransfersList.tsx`**

```tsx
import type { GroupMember, Settlement, Transfer } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/money'
import { cn } from '@/lib/utils'
import { memberName, transferAction, transferKey } from '../group-view'

interface TransfersListProps {
  transfers: Transfer[]
  members: GroupMember[]
  pending: Settlement[]
  myMemberId: string | undefined
  highlighted: ReadonlySet<string>
  onPay?: (transfer: Transfer) => void
}

export function TransfersList({ transfers, members, pending, myMemberId, highlighted, onPay }: TransfersListProps) {
  if (transfers.length === 0) return <p className="text-sm text-muted-foreground">Ninguém deve nada. Tudo quitado.</p>

  return (
    <ul className="-mx-2 grid">
      {transfers.map((transfer) => {
        const key = transferKey(transfer)
        const action = transferAction(transfer, myMemberId, pending)
        const from = transfer.fromMemberId === myMemberId ? 'Você' : memberName(members, transfer.fromMemberId)
        const to = transfer.toMemberId === myMemberId ? 'você' : memberName(members, transfer.toMemberId)
        return (
          <li
            key={key}
            className={cn(
              'grid gap-2 rounded-md px-2 py-3 transition-colors duration-700 motion-reduce:transition-none',
              highlighted.has(key) && 'bg-highlight',
            )}
          >
            <div className="flex items-baseline gap-3">
              <span>
                <span className="font-medium">{from}</span> paga <span className="font-medium">{to}</span>
              </span>
              <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(transfer.amount)}</span>
            </div>
            {action === 'pay' && onPay ? (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => onPay(transfer)}>
                  Pagar
                </Button>
              </div>
            ) : null}
            {action === 'awaiting' ? (
              <p className="text-right text-xs text-muted-foreground">Pagamento registrado, aguardando confirmação.</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: `BalancesCard.tsx`**

```tsx
import { useGetGroupsGroupIdBalances } from '@/api/generated/endpoints/groups/groups'
import { useGetGroupsGroupIdSettlements } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Transfer } from '@/api/types'
import { MoneyDisplay } from '@/components/MoneyDisplay'
import { SectionError } from '@/components/section-error'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiError } from '@/lib/api-error'
import { absoluteAmount, type BalanceTone, balanceTone } from '@/lib/money'
import { useChangedKeys } from '@/lib/use-changed-keys'
import { cn } from '@/lib/utils'
import { memberName, transferKey } from '../group-view'
import { TransfersList } from './TransfersList'

const TONE_LABEL = { negative: 'deve', positive: 'a receber', settled: 'quitado' } satisfies Record<BalanceTone, string>
const TONE_CLASS = { negative: 'text-negative', positive: 'text-positive', settled: 'text-settled' } satisfies Record<
  BalanceTone,
  string
>

interface BalancesCardProps {
  groupId: string
  members: GroupMember[]
  myMemberId: string | undefined
  onPay?: (transfer: Transfer) => void
}

export function BalancesCard({ groupId, members, myMemberId, onPay }: BalancesCardProps) {
  const balances = useGetGroupsGroupIdBalances(groupId)
  const pending = useGetGroupsGroupIdSettlements(groupId, { status: 'PENDING' })
  const changedBalances = useChangedKeys(balances.data?.memberBalances.map((b) => [b.memberId, b.balance] as const))
  const changedTransfers = useChangedKeys(balances.data?.transfers.map((t) => [transferKey(t), t.amount] as const))

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <section aria-labelledby="balances-title" className="grid gap-2 p-4">
        <h2 id="balances-title" className="text-base font-semibold">
          Saldos
        </h2>
        {balances.isPending ? (
          <div className="grid gap-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : balances.isError ? (
          <SectionError message={toApiError(balances.error).message} onRetry={() => void balances.refetch()} />
        ) : (
          <ul className="-mx-2 grid">
            {balances.data.memberBalances.map((entry) => {
              const tone = balanceTone(entry.balance)
              return (
                <li
                  key={entry.memberId}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-3 transition-colors duration-700 motion-reduce:transition-none',
                    changedBalances.has(entry.memberId) && 'bg-highlight',
                  )}
                >
                  <span className="font-medium">{memberName(members, entry.memberId)}</span>
                  {entry.memberId === myMemberId ? <span className="text-xs text-muted-foreground">você</span> : null}
                  <span className={cn('ml-auto text-sm', TONE_CLASS[tone])}>{TONE_LABEL[tone]}</span>
                  {tone === 'settled' ? null : (
                    <MoneyDisplay amount={absoluteAmount(entry.balance)} size="md" className={TONE_CLASS[tone]} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="transfers-title" className="grid gap-2 border-t p-4">
        <h2 id="transfers-title" className="text-base font-semibold">
          Quem paga quem
        </h2>
        {balances.data ? (
          <TransfersList
            transfers={balances.data.transfers}
            members={members}
            pending={pending.data?.settlements ?? []}
            myMemberId={myMemberId}
            highlighted={changedTransfers}
            onPay={onPay}
          />
        ) : (
          <Skeleton className="h-6 w-full" />
        )}
      </section>
    </Card>
  )
}
```

### Task 7.3.3: Lista de despesas, membros e adicionar membro

**Files:**
- Create: `src/features/expenses/components/ExpenseList.tsx`, `src/features/groups/components/MembersList.tsx`,
  `src/features/groups/components/AddMemberForm.tsx`

**Interfaces:**
- Consumes: `useGetGroupsGroupIdExpenses`, `usePostGroupsGroupIdMembers` (4.4), `formatBRL` (5.1), `formatDate` (5.2),
  `useChangedKeys` (5.4), `invalidateGroupQueries` (6.1), `nameByUserId` (7.3.1), `myShareAmount` (7.3.1) e
  `addMemberSchema`/`toAddMemberBody` (7.2.1)
- Produces: `<ExpenseList groupId members myMemberId onAddExpense? />`, `<MembersList groupId members myUserId />` e
  `<AddMemberForm groupId />`

- [ ] **Step 1: `ExpenseList.tsx`**

```tsx
import { keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { useGetGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import type { Expense, GroupMember } from '@/api/types'
import { SectionError } from '@/components/section-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { nameByUserId } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/dates'
import { formatBRL } from '@/lib/money'
import { useChangedKeys } from '@/lib/use-changed-keys'
import { cn } from '@/lib/utils'
import { myShareAmount } from '../expense-view'

const PAGE_SIZE = 20

interface ExpenseListProps {
  groupId: string
  members: GroupMember[]
  myMemberId: string | undefined
  onAddExpense?: () => void
}

function ExpenseRows({ expenses, members, myMemberId, loadingPage }: {
  expenses: Expense[]
  members: GroupMember[]
  myMemberId: string | undefined
  loadingPage: boolean
}) {
  // Enquanto a página nova não chega, nada é comparado: trocar de página não é "mudou".
  const changed = useChangedKeys(
    loadingPage ? undefined : expenses.map((e) => [e.id, `${e.amount}|${e.description}|${e.category ?? ''}`] as const),
  )
  return (
    <ul className="divide-y">
      {expenses.map((expense) => {
        const share = myShareAmount(expense.shares, myMemberId)
        return (
          <li
            key={expense.id}
            className={cn(
              'grid gap-1 px-4 py-3 transition-colors duration-700 motion-reduce:transition-none',
              changed.has(expense.id) && 'bg-highlight',
            )}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-medium">{expense.description}</span>
              <Badge variant="secondary">{expense.category ?? 'Categorizando…'}</Badge>
              <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(expense.amount)}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>{formatDate(expense.occurredAt)}</span>
              <span>pago por {nameByUserId(members, expense.payerId)}</span>
              <span>{share ? `sua parte: ${formatBRL(share)}` : 'você não participa'}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ExpenseList({ groupId, members, myMemberId, onAddExpense }: ExpenseListProps) {
  const [page, setPage] = useState(1)
  const expenses = useGetGroupsGroupIdExpenses(
    groupId,
    { page, limit: PAGE_SIZE },
    { query: { placeholderData: keepPreviousData } },
  )

  let content
  if (expenses.isPending) {
    content = (
      <div className="grid gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  } else if (expenses.isError) {
    content = <SectionError message={toApiError(expenses.error).message} onRetry={() => void expenses.refetch()} />
  } else if (expenses.data.total === 0) {
    content = (
      <div className="grid gap-3 px-4 pb-4">
        <p className="text-sm text-muted-foreground">Nenhuma despesa ainda.</p>
        {onAddExpense ? (
          <div>
            <Button onClick={onAddExpense}>Adicionar despesa</Button>
          </div>
        ) : null}
      </div>
    )
  } else {
    const { total } = expenses.data
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    content = (
      <>
        <ExpenseRows
          key={page}
          expenses={expenses.data.expenses}
          members={members}
          myMemberId={myMemberId}
          loadingPage={expenses.isPlaceholderData}
        />
        <div className="flex items-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
          <span className="mr-auto">
            {total} {total === 1 ? 'despesa' : 'despesas'}
          </span>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      </>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <h2 className="p-4 text-base font-semibold">Despesas</h2>
      {content}
    </Card>
  )
}
```

- [ ] **Step 2: `AddMemberForm.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { usePostGroupsGroupIdMembers } from '@/api/generated/endpoints/groups/groups'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { reportFormError } from '@/lib/form-errors'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { type AddMemberValues, addMemberSchema, toAddMemberBody } from '../schemas'

export function AddMemberForm({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient()
  const addMember = usePostGroupsGroupIdMembers()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberValues>({ resolver: zodResolver(addMemberSchema), defaultValues: { kind: 'email', contact: '' } })
  const kind = useWatch({ control, name: 'kind' })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await addMember.mutateAsync({ groupId, data: toAddMemberBody(values) })
      toast.success('Membro adicionado')
      reset({ kind: values.kind, contact: '' })
      void invalidateGroupQueries(queryClient, groupId)
    } catch (error) {
      // 404 (ninguém com esse contato) e 400 (já é membro) também ficam no campo (spec, Tela 3).
      const message = reportFormError(error, setError, (path) => (path === 'email' || path === 'phone' ? 'contact' : null))
      if (message) setError('contact', { type: 'server', message })
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-3">
      <h3 className="text-sm font-medium">Adicionar membro</h3>
      <fieldset className="flex gap-4 text-sm">
        <legend className="sr-only">Buscar por</legend>
        <label className="flex items-center gap-2">
          <input type="radio" value="email" className="accent-primary" {...register('kind')} />
          Email
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="phone" className="accent-primary" {...register('kind')} />
          Telefone
        </label>
      </fieldset>
      <FormField label={kind === 'email' ? 'Email' : 'Telefone'} htmlFor="member-contact" error={errors.contact?.message}>
        <Input
          id="member-contact"
          type={kind === 'email' ? 'email' : 'tel'}
          aria-invalid={Boolean(errors.contact)}
          {...register('contact')}
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Adicionar membro'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: `MembersList.tsx`**

```tsx
import type { GroupMember } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AddMemberForm } from './AddMemberForm'

interface MembersListProps {
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
}

export function MembersList({ groupId, members, myUserId }: MembersListProps) {
  const iAmOwner = members.some((member) => member.userId === myUserId && member.role === 'OWNER')

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <section aria-labelledby="members-title" className="grid gap-2 p-4">
        <h2 id="members-title" className="text-base font-semibold">
          Membros
        </h2>
        <ul className="-mx-4 divide-y">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="font-medium">{member.name}</span>
              {member.userId === myUserId ? <span className="text-xs text-muted-foreground">você</span> : null}
              <span className="text-sm text-muted-foreground">{member.email}</span>
              {member.role === 'OWNER' ? (
                <Badge variant="outline" className="ml-auto">
                  dono
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
        {members.length === 1 ? (
          <p className="text-sm text-muted-foreground">Adicione alguém pelo email para dividir despesas.</p>
        ) : null}
      </section>
      {iAmOwner ? (
        <div className="border-t p-4">
          <AddMemberForm groupId={groupId} />
        </div>
      ) : null}
    </Card>
  )
}
```

### Task 7.3.4: Página de detalhe com tempo real

**Files:**
- Create: `src/features/groups/components/GroupHeader.tsx`, `src/features/groups/components/GroupUnavailable.tsx`
- Modify: `src/features/groups/pages/GroupDetailPage.tsx`

**Interfaces:**
- Consumes: `useGetGroupsGroupId`, `useGetUsersMe` (4.4), `useGroupRealtime` (6.3), `useSocketConnected` (6.2) e os
  componentes da 7.3.2/7.3.3
- Produces: `<GroupHeader name description? connected actions? />` e `<GroupUnavailable error onRetry />`

- [ ] **Step 1: `GroupHeader.tsx`**

```tsx
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

interface GroupHeaderProps {
  name: string
  description?: string
  connected: boolean
  actions?: ReactNode
}

export function GroupHeader({ name, description, connected, actions }: GroupHeaderProps) {
  return (
    <div className="grid gap-3">
      <Link to="/groups" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Grupos
      </Link>
      <div className="flex flex-wrap items-start gap-4">
        <div className="mr-auto grid gap-1">
          <h1 className="text-2xl font-semibold">{name}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <p role="status" className="flex items-center gap-2 self-center text-xs text-muted-foreground">
          <span aria-hidden="true" className={cn('size-2 rounded-full', connected ? 'bg-positive' : 'bg-settled')} />
          {connected ? 'ao vivo' : 'reconectando…'}
        </p>
        {actions}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `GroupUnavailable.tsx`**

```tsx
import { Link } from 'react-router'
import { SectionError } from '@/components/section-error'
import { toApiError } from '@/lib/api-error'

export function GroupUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { status, message } = toApiError(error)
  const title =
    status === 403 ? 'Você não faz parte deste grupo.' : status === 404 || status === 400 ? 'Grupo não encontrado.' : null

  if (title === null) return <SectionError message={message} onRetry={onRetry} />
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Link to="/groups" className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline">
        Voltar para seus grupos
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: `GroupDetailPage.tsx`**

```tsx
import { useParams } from 'react-router'
import { useGetGroupsGroupId } from '@/api/generated/endpoints/groups/groups'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpenseList } from '@/features/expenses/components/ExpenseList'
import { useGroupRealtime } from '@/realtime/use-group-realtime'
import { useSocketConnected } from '@/realtime/use-socket-status'
import { BalancesCard } from '../components/BalancesCard'
import { GroupHeader } from '../components/GroupHeader'
import { GroupUnavailable } from '../components/GroupUnavailable'
import { MembersList } from '../components/MembersList'
import { findMyMember } from '../group-view'

export function GroupDetailPage() {
  const { groupId = '' } = useParams()
  const group = useGetGroupsGroupId(groupId)
  const me = useGetUsersMe()
  const connected = useSocketConnected()
  useGroupRealtime(groupId)

  if (group.isError) return <GroupUnavailable error={group.error} onRetry={() => void group.refetch()} />
  if (group.isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { name, description, members } = group.data.group
  const myUserId = me.data?.user.id
  const myMemberId = findMyMember(members, myUserId)?.id

  return (
    <div className="grid gap-6">
      <GroupHeader name={name} description={description} connected={connected} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <BalancesCard groupId={groupId} members={members} myMemberId={myMemberId} />
        <div className="grid gap-6">
          <ExpenseList groupId={groupId} members={members} myMemberId={myMemberId} />
          <MembersList groupId={groupId} members={members} myUserId={myUserId} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Conferir com o back e duas janelas** (uma normal e uma anônima)

Expected:
- o cabeçalho mostra "ao vivo";
- Ana adiciona Bruno pelo email e a lista de membros atualiza;
- uma despesa lançada pelo Postman (como Ana) aparece **na janela do Bruno sem recarregar**, com o saldo em "deve
  R$ 50,⁰⁰" e a linha destacada por um instante;
- um id inválido em `/groups/x` mostra "Grupo não encontrado.";
- desligar o back mostra "reconectando…", e religar volta a "ao vivo" e busca os dados de novo.

**Commits propostos (fechamento da Fase 7.3):**
```powershell
git add src/features/groups/group-view.ts src/features/groups/group-view.test.ts src/features/expenses/expense-view.ts src/features/expenses/expense-view.test.ts
git commit -m "feat: add read helpers for group screens" -m "- nomes por membro e por usuário, ex-membro para quem saiu" -m "- ação de cada transferência e minha parte, só por busca"
git add src/features/groups/components/BalancesCard.tsx src/features/groups/components/TransfersList.tsx
git commit -m "feat: show balances and who pays whom" -m "- tom do saldo com rótulo, etiqueta de preço e quitado sem valor" -m "- linhas destacadas quando mudam depois de um refetch"
git add src/features/expenses/components/ExpenseList.tsx src/features/groups/components/MembersList.tsx src/features/groups/components/AddMemberForm.tsx
git commit -m "feat: list expenses and members with invite form" -m "- despesas em páginas de 20 com categoria, pagador e minha parte" -m "- dono adiciona membro por email ou telefone"
git add src/features/groups/components/GroupHeader.tsx src/features/groups/components/GroupUnavailable.tsx src/features/groups/pages/GroupDetailPage.tsx
git commit -m "feat: add group detail page with realtime" -m "- indicador ao vivo / reconectando" -m "- estados de sem acesso e não encontrado" -m "- duas colunas no desktop, uma no celular"
```

---

## Fase 7.4 — Nova despesa (Tela 4)

**Branch:** `feat/front-fase-7-4-despesa`

### Task 7.4.1: Schema do formulário de despesa (TDD)

**Files:**
- Create: `src/features/expenses/schemas.ts`
- Test: `src/features/expenses/schemas.test.ts`

**Interfaces:**
- Consumes: `isValidAmountInput`, `toApiAmount` (5.1)
- Produces: `EXPENSE_CATEGORIES`, `AUTO_CATEGORY`, `CATEGORY_OPTIONS`, `SPLIT_METHODS`, `expenseFormSchema` e
  `ExpenseFormValues`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { type ExpenseFormValues, expenseFormSchema } from './schemas'

const valid = (overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  description: 'Jantar',
  amount: '100,00',
  payerId: 'u-ana',
  occurredAt: '2026-10-13',
  category: 'auto',
  splitMethod: 'EQUAL',
  participants: [
    { memberId: 'm-ana', selected: true, amount: '', percentage: '' },
    { memberId: 'm-bruno', selected: true, amount: '', percentage: '' },
  ],
  ...overrides,
})

const issuesOf = (values: unknown) => {
  const result = expenseFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
}

const participants = (...rows: Array<[selected: boolean, amount: string, percentage: string]>) =>
  rows.map(([selected, amount, percentage], index) => ({ memberId: `m-${index}`, selected, amount, percentage }))

describe('expenseFormSchema', () => {
  it('aceita uma divisão igual válida', () => {
    expect(issuesOf(valid())).toEqual([])
  })

  it('exige descrição', () => {
    expect(issuesOf(valid({ description: '  ' }))).toEqual([{ path: 'description', message: 'Descreva a despesa.' }])
  })

  it('recusa ponto decimal em vez de ler 12.5 como 125', () => {
    expect(issuesOf(valid({ amount: '12.5' }))).toEqual([{ path: 'amount', message: 'Valor inválido. Use o formato 1.234,56.' }])
  })

  it('recusa valor zero', () => {
    expect(issuesOf(valid({ amount: '0,00' }))).toEqual([{ path: 'amount', message: 'O valor precisa ser maior que zero.' }])
  })

  it('recusa categoria fora da lista da API', () => {
    expect(issuesOf(valid({ category: 'Bebidas' as ExpenseFormValues['category'] })).map((i) => i.path)).toEqual(['category'])
  })

  it('exige ao menos um participante', () => {
    expect(issuesOf(valid({ participants: participants([false, '', ''], [false, '', '']) }))).toEqual([
      { path: 'participants', message: 'Escolha ao menos um participante.' },
    ])
  })

  it('em Valores, exige a parte só de quem participa', () => {
    const values = valid({ splitMethod: 'FIXED', participants: participants([true, '', ''], [false, '', '']) })

    expect(issuesOf(values)).toEqual([{ path: 'participants.0.amount', message: 'Informe a parte desta pessoa, maior que zero.' }])
  })

  it('em Valores, não confere se as partes fecham o total (regra do back)', () => {
    expect(issuesOf(valid({ splitMethod: 'FIXED', participants: participants([true, '10,00', ''], [true, '10,00', '']) }))).toEqual([])
  })

  it('em Percentual, recusa zero e ponto decimal e aceita vírgula', () => {
    const values = valid({ splitMethod: 'PERCENTAGE', participants: participants([true, '', '0'], [true, '', '33.3'], [true, '', '33,33']) })

    expect(issuesOf(values).map((i) => i.path)).toEqual(['participants.0.percentage', 'participants.1.percentage'])
  })

  it('em Percentual, não confere se soma 100 (regra do back)', () => {
    expect(issuesOf(valid({ splitMethod: 'PERCENTAGE', participants: participants([true, '', '10'], [true, '', '10']) }))).toEqual([])
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/expenses/schemas.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import { z } from 'zod'
import { isValidAmountInput, toApiAmount } from '@/lib/money'

// Mesmas categorias da API (EXPENSE_CATEGORIES do back). O tsc acusa divergência quando o corpo gerado não aceitar.
export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Assinaturas',
  'Saúde',
  'Compras',
  'Outros',
] as const
export const AUTO_CATEGORY = 'auto'
export const CATEGORY_OPTIONS = [AUTO_CATEGORY, ...EXPENSE_CATEGORIES] as const
export const SPLIT_METHODS = ['EQUAL', 'FIXED', 'PERCENTAGE'] as const

const PERCENTAGE_INPUT = /^\d{1,3}(,\d{1,2})?$/

const isPositiveAmountInput = (input: string) => isValidAmountInput(input) && toApiAmount(input) !== '0.00'
const isPositivePercentageInput = (input: string) => {
  const trimmed = input.trim()
  return PERCENTAGE_INPUT.test(trimmed) && !/^0+(,0+)?$/.test(trimmed)
}

const participantSchema = z.object({
  memberId: z.string(),
  selected: z.boolean(),
  amount: z.string(),
  percentage: z.string(),
})

/**
 * Valida só formato. Se as partes fecham o total ou se os percentuais somam 100 é regra de domínio: o back responde
 * 400 e a mensagem aparece no formulário.
 */
export const expenseFormSchema = z
  .object({
    description: z.string().trim().min(1, 'Descreva a despesa.'),
    amount: z
      .string()
      .trim()
      .min(1, 'Informe o valor.')
      .refine((value) => value === '' || isValidAmountInput(value), 'Valor inválido. Use o formato 1.234,56.')
      .refine((value) => !isValidAmountInput(value) || toApiAmount(value) !== '0.00', 'O valor precisa ser maior que zero.'),
    payerId: z.string().min(1, 'Escolha quem pagou.'),
    occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.'),
    category: z.enum(CATEGORY_OPTIONS),
    splitMethod: z.enum(SPLIT_METHODS),
    participants: z.array(participantSchema),
  })
  .superRefine((values, ctx) => {
    const selected = values.participants.flatMap((participant, index) => (participant.selected ? [{ participant, index }] : []))
    if (selected.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['participants'], message: 'Escolha ao menos um participante.' })
    }
    for (const { participant, index } of selected) {
      if (values.splitMethod === 'FIXED' && !isPositiveAmountInput(participant.amount)) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'amount'],
          message: 'Informe a parte desta pessoa, maior que zero.',
        })
      }
      if (values.splitMethod === 'PERCENTAGE' && !isPositivePercentageInput(participant.percentage)) {
        ctx.addIssue({
          code: 'custom',
          path: ['participants', index, 'percentage'],
          message: 'Informe um percentual maior que zero, como 33,33.',
        })
      }
    }
  })

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
```
No Zod 4, a `superRefine` do objeto pode deixar de rodar quando um campo já falhou. Por isso os testes de participantes
partem de uma base válida, e a pessoa vê os erros das partes depois de corrigir os campos de cima.

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/expenses/schemas.test.ts
```
Expected: 10 PASS. Se o teste "recusa ponto decimal" trouxer uma segunda issue no mesmo campo, confira se os guardas
dos `refine` estão como acima.

### Task 7.4.2: Do formulário ao corpo da API

**Files:**
- Create: `src/features/expenses/to-create-expense-body.ts`
- Test: `src/features/expenses/to-create-expense-body.test.ts`

**Interfaces:**
- Consumes: `postGroupsGroupIdExpenses` (4.4), `toApiAmount` (5.1), `toNoonIso` (5.2), `ExpenseFormValues` e
  `AUTO_CATEGORY` (7.4.1)
- Produces: `type CreateExpenseBody`,
  `toCreateExpenseBody(values: ExpenseFormValues): { body: CreateExpenseBody; shareMemberIds: string[] }` e
  `fieldForIssuePath(path: string, shareMemberIds: string[], participantMemberIds: string[]): Path<ExpenseFormValues> | null`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import type { ExpenseFormValues } from './schemas'
import { fieldForIssuePath, toCreateExpenseBody } from './to-create-expense-body'

const base: ExpenseFormValues = {
  description: 'Mercado',
  amount: '1.234,56',
  payerId: 'u-ana',
  occurredAt: '2026-10-13',
  category: 'auto',
  splitMethod: 'EQUAL',
  participants: [
    { memberId: 'm-ana', selected: true, amount: '', percentage: '' },
    { memberId: 'm-bruno', selected: false, amount: '', percentage: '' },
    { memberId: 'm-carla', selected: true, amount: '', percentage: '' },
  ],
}

describe('toCreateExpenseBody', () => {
  it('em Igual, envia só os participantes, o valor em string e o meio-dia local, sem categoria automática', () => {
    const { body, shareMemberIds } = toCreateExpenseBody(base)

    expect(body).toEqual({
      description: 'Mercado',
      amount: '1234.56',
      payerId: 'u-ana',
      occurredAt: '2026-10-13T15:00:00.000Z',
      splitMethod: 'EQUAL',
      shares: [{ memberId: 'm-ana' }, { memberId: 'm-carla' }],
    })
    expect(shareMemberIds).toEqual(['m-ana', 'm-carla'])
  })

  it('em Valores, envia cada parte como string da API', () => {
    const participants = base.participants.map((p) => ({ ...p, amount: p.memberId === 'm-ana' ? '1.000,00' : '234,56' }))

    const { body } = toCreateExpenseBody({ ...base, splitMethod: 'FIXED', participants })

    expect(body.shares).toEqual([
      { memberId: 'm-ana', amount: '1000.00' },
      { memberId: 'm-carla', amount: '234.56' },
    ])
  })

  it('em Percentual, envia o percentual como number, porque não é dinheiro', () => {
    const participants = base.participants.map((p) => ({ ...p, percentage: p.memberId === 'm-ana' ? '66,67' : '33,33' }))

    const { body } = toCreateExpenseBody({ ...base, splitMethod: 'PERCENTAGE', participants })

    expect(body.shares).toEqual([
      { memberId: 'm-ana', percentage: 66.67 },
      { memberId: 'm-carla', percentage: 33.33 },
    ])
  })

  it('envia a categoria escolhida', () => {
    expect(toCreateExpenseBody({ ...base, category: 'Compras' }).body.category).toBe('Compras')
  })
})

describe('fieldForIssuePath', () => {
  const shareMemberIds = ['m-ana', 'm-carla']
  const participantMemberIds = ['m-ana', 'm-bruno', 'm-carla']

  it('leva o erro da parte à linha da pessoa certa, não à posição do array enviado', () => {
    expect(fieldForIssuePath('shares.1.amount', shareMemberIds, participantMemberIds)).toBe('participants.2.amount')
    expect(fieldForIssuePath('shares.0.percentage', shareMemberIds, participantMemberIds)).toBe('participants.0.percentage')
  })

  it('mantém os campos de topo', () => {
    expect(fieldForIssuePath('amount', shareMemberIds, participantMemberIds)).toBe('amount')
  })

  it('devolve null para o que não tem campo', () => {
    expect(fieldForIssuePath('shares.5.amount', shareMemberIds, participantMemberIds)).toBeNull()
    expect(fieldForIssuePath('shares', shareMemberIds, participantMemberIds)).toBeNull()
    expect(fieldForIssuePath('groupId', shareMemberIds, participantMemberIds)).toBeNull()
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/expenses/to-create-expense-body.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import type { Path } from 'react-hook-form'
import type { postGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import { toNoonIso } from '@/lib/dates'
import { toApiAmount } from '@/lib/money'
import { AUTO_CATEGORY, type ExpenseFormValues } from './schemas'

export type CreateExpenseBody = Parameters<typeof postGroupsGroupIdExpenses>[1]

// Percentual não é dinheiro: segue como number, como a API espera (o D-98 só mudou os campos de valor).
const toApiPercentage = (input: string): number => Number(input.trim().replace(',', '.'))

export function toCreateExpenseBody(values: ExpenseFormValues): { body: CreateExpenseBody; shareMemberIds: string[] } {
  const selected = values.participants.filter((participant) => participant.selected)
  const shares = selected.map((participant) => {
    if (values.splitMethod === 'FIXED') return { memberId: participant.memberId, amount: toApiAmount(participant.amount) }
    if (values.splitMethod === 'PERCENTAGE') {
      return { memberId: participant.memberId, percentage: toApiPercentage(participant.percentage) }
    }
    return { memberId: participant.memberId }
  })

  return {
    body: {
      description: values.description,
      amount: toApiAmount(values.amount),
      payerId: values.payerId,
      occurredAt: toNoonIso(values.occurredAt),
      splitMethod: values.splitMethod,
      shares,
      ...(values.category === AUTO_CATEGORY ? {} : { category: values.category }),
    },
    shareMemberIds: selected.map((participant) => participant.memberId),
  }
}

const TOP_LEVEL_FIELDS = new Set(['description', 'amount', 'payerId', 'occurredAt', 'category', 'splitMethod'])

/** Leva o caminho de uma issue da API ("shares.1.amount") ao campo do formulário ("participants.2.amount"). */
export function fieldForIssuePath(
  path: string,
  shareMemberIds: string[],
  participantMemberIds: string[],
): Path<ExpenseFormValues> | null {
  const share = /^shares\.(\d+)\.(amount|percentage)$/.exec(path)
  if (share) {
    const memberId = shareMemberIds[Number(share[1])]
    const participantIndex = memberId === undefined ? -1 : participantMemberIds.indexOf(memberId)
    return participantIndex === -1 ? null : (`participants.${participantIndex}.${share[2]}` as Path<ExpenseFormValues>)
  }
  return TOP_LEVEL_FIELDS.has(path) ? (path as Path<ExpenseFormValues>) : null
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/expenses/to-create-expense-body.test.ts
npx tsc -b
```
Expected: 7 PASS e `tsc` limpo. Se o `tsc` acusar `category` ou `amount` incompatíveis com `CreateExpenseBody`, o back
rodando no `api:gen` não tinha a Fase B, ou as categorias divergiram: pare e reporte.

### Task 7.4.3: Formulário e diálogo de nova despesa

**Files:**
- Create: `src/features/expenses/components/NativeSelect.tsx`, `src/features/expenses/components/ExpenseForm.tsx`,
  `src/features/expenses/components/AddExpenseDialog.tsx`
- Modify: `src/features/groups/pages/GroupDetailPage.tsx`

**Interfaces:**
- Consumes: `usePostGroupsGroupIdExpenses` (4.4), `approxEqualShare`, `isValidAmountInput`, `toApiAmount` (5.1),
  `todayInputValue` (5.2), `invalidateGroupQueries` (6.1), `reportFormError`, `toApiError` (4.5) e o que vem da
  7.4.1/7.4.2
- Produces: `<AddExpenseDialog open onOpenChange groupId members myUserId />`

- [ ] **Step 1: `NativeSelect.tsx`**

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: `ExpenseForm.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { usePostGroupsGroupIdExpenses } from '@/api/generated/endpoints/expenses/expenses'
import type { GroupMember } from '@/api/types'
import { FormAlert, FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toApiError } from '@/lib/api-error'
import { todayInputValue } from '@/lib/dates'
import { reportFormError } from '@/lib/form-errors'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { approxEqualShare, isValidAmountInput, toApiAmount } from '@/lib/money'
import { AUTO_CATEGORY, EXPENSE_CATEGORIES, type ExpenseFormValues, expenseFormSchema } from '../schemas'
import { fieldForIssuePath, toCreateExpenseBody } from '../to-create-expense-body'
import { NativeSelect } from './NativeSelect'

const SPLIT_OPTIONS = [
  { value: 'EQUAL', label: 'Igual' },
  { value: 'FIXED', label: 'Valores' },
  { value: 'PERCENTAGE', label: 'Percentual' },
] as const

interface ExpenseFormProps {
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
  onDone: () => void
}

export function ExpenseForm({ groupId, members, myUserId, onDone }: ExpenseFormProps) {
  const queryClient = useQueryClient()
  const createExpense = usePostGroupsGroupIdExpenses()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: '',
      payerId: myUserId ?? members[0]?.userId ?? '',
      occurredAt: todayInputValue(),
      category: AUTO_CATEGORY,
      splitMethod: 'EQUAL',
      participants: members.map((member) => ({ memberId: member.id, selected: true, amount: '', percentage: '' })),
    },
  })
  const [amount, splitMethod, participants] = useWatch({ control, name: ['amount', 'splitMethod', 'participants'] })
  const selectedCount = participants.filter((participant) => participant.selected).length
  const preview =
    splitMethod === 'EQUAL' && isValidAmountInput(amount) ? approxEqualShare(toApiAmount(amount), selectedCount) : null

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const { body, shareMemberIds } = toCreateExpenseBody(values)
    try {
      await createExpense.mutateAsync({ groupId, data: body })
      toast.success('Despesa adicionada')
      void invalidateGroupQueries(queryClient, groupId)
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 403) {
        toast.error(apiError.message)
        onDone()
        return
      }
      const participantMemberIds = values.participants.map((participant) => participant.memberId)
      setFormError(reportFormError(error, setError, (path) => fieldForIssuePath(path, shareMemberIds, participantMemberIds)))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4">
      <FormField label="Descrição" htmlFor="expense-description" error={errors.description?.message}>
        <Input id="expense-description" aria-invalid={Boolean(errors.description)} {...register('description')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Valor" htmlFor="expense-amount" hint="Ex.: 1.234,56" error={errors.amount?.message}>
          <Input
            id="expense-amount"
            inputMode="decimal"
            autoComplete="off"
            className="text-right tabular-nums"
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
        </FormField>
        <FormField label="Data" htmlFor="expense-date" error={errors.occurredAt?.message}>
          <Input id="expense-date" type="date" aria-invalid={Boolean(errors.occurredAt)} {...register('occurredAt')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Pago por" htmlFor="expense-payer" error={errors.payerId?.message}>
          <NativeSelect id="expense-payer" {...register('payerId')}>
            {members.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.userId === myUserId ? `${member.name} (você)` : member.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Categoria" htmlFor="expense-category" error={errors.category?.message}>
          <NativeSelect id="expense-category" {...register('category')}>
            <option value={AUTO_CATEGORY}>Automática</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Divisão</legend>
        <FormAlert message={formError} />
        <div className="flex flex-wrap gap-4 text-sm">
          {SPLIT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" value={option.value} className="accent-primary" {...register('splitMethod')} />
              {option.label}
            </label>
          ))}
        </div>
        <ul className="grid gap-2">
          {members.map((member, index) => {
            const selected = participants[index]?.selected ?? false
            const rowError =
              errors.participants?.[index]?.amount?.message ?? errors.participants?.[index]?.percentage?.message
            return (
              <li key={member.id} className="grid gap-1">
                <div className="flex min-h-9 items-center gap-3">
                  <label className="flex flex-1 items-center gap-2">
                    <input type="checkbox" className="size-4 accent-primary" {...register(`participants.${index}.selected`)} />
                    {member.name}
                  </label>
                  {splitMethod === 'FIXED' && selected ? (
                    <Input
                      aria-label={`Parte de ${member.name}`}
                      inputMode="decimal"
                      className="w-32 text-right tabular-nums"
                      aria-invalid={Boolean(errors.participants?.[index]?.amount)}
                      {...register(`participants.${index}.amount`)}
                    />
                  ) : null}
                  {splitMethod === 'PERCENTAGE' && selected ? (
                    <Input
                      aria-label={`Percentual de ${member.name}`}
                      inputMode="decimal"
                      className="w-24 text-right tabular-nums"
                      aria-invalid={Boolean(errors.participants?.[index]?.percentage)}
                      {...register(`participants.${index}.percentage`)}
                    />
                  ) : null}
                </div>
                {rowError ? <p className="text-sm text-destructive">{rowError}</p> : null}
              </li>
            )
          })}
        </ul>
        {errors.participants?.message ?? errors.participants?.root?.message ? (
          <p className="text-sm text-destructive">{errors.participants?.message ?? errors.participants?.root?.message}</p>
        ) : null}
        {preview ? <p className="text-xs text-muted-foreground">{preview}</p> : null}
      </fieldset>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Adicionar despesa'}
        </Button>
      </DialogFooter>
    </form>
  )
}
```
Os campos de parte e percentual somem quando a pessoa é desmarcada, em vez de ficarem `disabled`: com `disabled`, o
react-hook-form manda `undefined` e o schema recusaria o envio.

- [ ] **Step 3: `AddExpenseDialog.tsx`**

```tsx
import type { GroupMember } from '@/api/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExpenseForm } from './ExpenseForm'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  members: GroupMember[]
  myUserId: string | undefined
}

export function AddExpenseDialog({ open, onOpenChange, groupId, members, myUserId }: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>A parte exata de cada pessoa é calculada pela API ao salvar.</DialogDescription>
        </DialogHeader>
        <ExpenseForm groupId={groupId} members={members} myUserId={myUserId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: `GroupDetailPage.tsx`** (versão da 7.4: hooks antes de qualquer `return`)

```tsx
import { useState } from 'react'
import { useParams } from 'react-router'
import { useGetGroupsGroupId } from '@/api/generated/endpoints/groups/groups'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddExpenseDialog } from '@/features/expenses/components/AddExpenseDialog'
import { ExpenseList } from '@/features/expenses/components/ExpenseList'
import { useGroupRealtime } from '@/realtime/use-group-realtime'
import { useSocketConnected } from '@/realtime/use-socket-status'
import { BalancesCard } from '../components/BalancesCard'
import { GroupHeader } from '../components/GroupHeader'
import { GroupUnavailable } from '../components/GroupUnavailable'
import { MembersList } from '../components/MembersList'
import { findMyMember } from '../group-view'

export function GroupDetailPage() {
  const { groupId = '' } = useParams()
  const group = useGetGroupsGroupId(groupId)
  const me = useGetUsersMe()
  const connected = useSocketConnected()
  const [addingExpense, setAddingExpense] = useState(false)
  useGroupRealtime(groupId)

  if (group.isError) return <GroupUnavailable error={group.error} onRetry={() => void group.refetch()} />
  if (group.isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { name, description, members } = group.data.group
  const myUserId = me.data?.user.id
  const myMemberId = findMyMember(members, myUserId)?.id
  const openAddExpense = () => setAddingExpense(true)

  return (
    <div className="grid gap-6">
      <GroupHeader
        name={name}
        description={description}
        connected={connected}
        actions={<Button onClick={openAddExpense}>Adicionar despesa</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <BalancesCard groupId={groupId} members={members} myMemberId={myMemberId} />
        <div className="grid gap-6">
          <ExpenseList groupId={groupId} members={members} myMemberId={myMemberId} onAddExpense={openAddExpense} />
          <MembersList groupId={groupId} members={members} myUserId={myUserId} />
        </div>
      </div>
      <AddExpenseDialog
        open={addingExpense}
        onOpenChange={setAddingExpense}
        groupId={groupId}
        members={members}
        myUserId={myUserId}
      />
    </div>
  )
}
```

- [ ] **Step 5: Conferir com o back e duas janelas**

Expected:
- R$ 100,00 dividido igualmente entre 3 mostra "≈ R$ 33,33 cada";
- "12.5" no valor mostra "Valor inválido. Use o formato 1.234,56.";
- em Valores, partes que não fecham o total voltam com a mensagem do back no topo da Divisão;
- salvar fecha o diálogo, mostra o toast "Despesa adicionada", e **a outra janela atualiza sozinha**.

**Commits propostos (fechamento da Fase 7.4):**
```powershell
git add src/features/expenses/schemas.ts src/features/expenses/schemas.test.ts
git commit -m "feat: add expense form schema" -m "- só formato: soma das partes e 100% ficam com o back" -m "- ponto decimal recusado; parte exigida só de quem participa"
git add src/features/expenses/to-create-expense-body.ts src/features/expenses/to-create-expense-body.test.ts
git commit -m "feat: build the create expense body from the form" -m "- valores em string (D-98), percentual em number e data ao meio-dia local" -m "- erro em shares.N cai na linha da pessoa certa"
git add src/features/expenses/components src/features/groups/pages/GroupDetailPage.tsx
git commit -m "feat: add new expense dialog" -m "- Igual, Valores e Percentual com prévia aproximada só na divisão igual" -m "- Adicionar despesa no cabeçalho e no estado vazio"
```

---

## Fase 7.5 — Acerto e Pix (Tela 5) e chave Pix (D-102)

**Branch:** `feat/front-fase-7-5-acerto`

### Task 7.5.1: Ação de cada acerto pendente

**Files:**
- Create: `src/features/settlements/settlement-view.ts`
- Test: `src/features/settlements/settlement-view.test.ts`

**Interfaces:**
- Consumes: `Settlement` (4.4)
- Produces: `type PendingAction = 'acknowledge' | 'view-pix' | 'none'` e
  `pendingAction(settlement: Settlement, myMemberId: string | undefined): PendingAction`

- [ ] **Step 1: Teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import type { Settlement } from '@/api/types'
import { pendingAction } from './settlement-view'

const settlement = (pixCopyPaste: string | null): Settlement =>
  ({
    id: 's1',
    fromMemberId: 'm-bruno',
    toMemberId: 'm-ana',
    amount: '50.00',
    status: 'PENDING',
    pixCopyPaste,
    createdAt: '2026-10-13T00:00:00.000Z',
  }) as Settlement

describe('pendingAction', () => {
  it('o credor confirma o recebimento', () => {
    expect(pendingAction(settlement('000201'), 'm-ana')).toBe('acknowledge')
  })

  it('o devedor revê o Pix quando existe código', () => {
    expect(pendingAction(settlement('000201'), 'm-bruno')).toBe('view-pix')
    expect(pendingAction(settlement(null), 'm-bruno')).toBe('none')
  })

  it('quem está de fora só lê', () => {
    expect(pendingAction(settlement('000201'), 'm-carla')).toBe('none')
  })
})
```

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/settlements/settlement-view.test.ts
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```ts
import type { Settlement } from '@/api/types'

export type PendingAction = 'acknowledge' | 'view-pix' | 'none'

export function pendingAction(settlement: Settlement, myMemberId: string | undefined): PendingAction {
  if (myMemberId !== undefined && settlement.toMemberId === myMemberId) return 'acknowledge'
  if (myMemberId !== undefined && settlement.fromMemberId === myMemberId && settlement.pixCopyPaste) return 'view-pix'
  return 'none'
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/settlements/settlement-view.test.ts
```
Expected: 3 PASS.

### Task 7.5.2: Botão de copiar o Pix

**Files:**
- Create: `src/features/settlements/components/PixCopyButton.tsx`
- Test: `src/features/settlements/components/PixCopyButton.test.tsx`

**Interfaces:**
- Produces: `<PixCopyButton code: string />` (campo somente leitura e botão de copiar)

- [ ] **Step 1: Teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { PixCopyButton } from './PixCopyButton'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const CODE = '00020126580014br.gov.bcb.pix0136ana@example.com5204000053039865406100.005802BR6304ABCD'

function mockClipboard(implementation: (text: string) => Promise<void>) {
  const writeText = vi.fn(implementation)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

describe('PixCopyButton', () => {
  it('copia o código e confirma com "Copiado!"', async () => {
    const user = userEvent.setup()
    const writeText = mockClipboard(async () => {})
    render(<PixCopyButton code={CODE} />)

    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }))

    expect(writeText).toHaveBeenCalledWith(CODE)
    expect(await screen.findByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
  })

  it('seleciona o código e avisa quando a cópia falha', async () => {
    const user = userEvent.setup()
    mockClipboard(async () => {
      throw new Error('sem permissão')
    })
    render(<PixCopyButton code={CODE} />)

    await user.click(screen.getByRole('button', { name: 'Copiar código Pix' }))

    const field = screen.getByLabelText<HTMLTextAreaElement>('Código Pix copia-e-cola')
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, CODE.length])
    expect(toast.error).toHaveBeenCalledWith('Não foi possível copiar. Selecione o código e copie manualmente.')
  })
})
```
O `userEvent.setup()` instala um clipboard falso; o `mockClipboard` precisa vir **depois** dele.

- [ ] **Step 2: Ver falhar**

```powershell
npm run test -- --run src/features/settlements/components/PixCopyButton.test.tsx
```
Expected: FAIL, import não resolvido.

- [ ] **Step 3: Implementar**

```tsx
import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function PixCopyButton({ code }: { code: string }) {
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Sem permissão ou fora de HTTPS: o código fica selecionado para copiar à mão.
      fieldRef.current?.select()
      toast.error('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="pix-code">Código Pix copia-e-cola</Label>
      <Textarea id="pix-code" ref={fieldRef} readOnly rows={4} value={code} className="resize-none bg-muted text-sm break-all" />
      <Button type="button" className="w-full" onClick={() => void copy()}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Copiado!' : 'Copiar código Pix'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Ver passar**

```powershell
npm run test -- --run src/features/settlements/components/PixCopyButton.test.tsx
```
Expected: 2 PASS.

### Task 7.5.3: Registrar pagamento, rever o Pix e confirmar recebimento

**Files:**
- Create: `src/features/settlements/components/SettleDialog.tsx`,
  `src/features/settlements/components/AcknowledgeDialog.tsx`,
  `src/features/settlements/components/PendingSettlementsList.tsx`
- Modify: `src/features/groups/components/BalancesCard.tsx`, `src/features/groups/pages/GroupDetailPage.tsx`

**Interfaces:**
- Consumes: `usePostGroupsGroupIdSettlements`, `usePatchSettlementsSettlementIdAcknowledge` (4.4), `MoneyDisplay` (5.3),
  `formatBRL` (5.1), `invalidateGroupQueries` (6.1), `memberName` (7.3.1), `pendingAction` (7.5.1) e
  `PixCopyButton` (7.5.2)
- Produces: `type SettleTarget = { mode: 'pay'; transfer: Transfer } | { mode: 'view'; settlement: Settlement }`,
  `<SettleDialog groupId target members onClose />`, `<AcknowledgeDialog groupId settlement members onClose />` e
  `<PendingSettlementsList pending members myMemberId onAcknowledge onViewPix />`

- [ ] **Step 1: `SettleDialog.tsx`**

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePostGroupsGroupIdSettlements } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Settlement, Transfer } from '@/api/types'
import { FormAlert } from '@/components/form-field'
import { MoneyDisplay } from '@/components/MoneyDisplay'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { memberName } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { PixCopyButton } from './PixCopyButton'

export type SettleTarget = { mode: 'pay'; transfer: Transfer } | { mode: 'view'; settlement: Settlement }

type PixSettlement = { amount: string; pixCopyPaste?: string | null }

interface SettleDialogProps {
  groupId: string
  target: SettleTarget | null
  members: GroupMember[]
  onClose: () => void
}

export function SettleDialog({ groupId, target, members, onClose }: SettleDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {target ? <SettleContent groupId={groupId} target={target} members={members} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SettleContent({ groupId, target, members, onClose }: SettleDialogProps & { target: SettleTarget }) {
  const queryClient = useQueryClient()
  const registerPayment = usePostGroupsGroupIdSettlements()
  const [settlement, setSettlement] = useState<PixSettlement | null>(target.mode === 'view' ? target.settlement : null)
  const [error, setError] = useState<string | null>(null)
  const pair = target.mode === 'pay' ? target.transfer : target.settlement
  const creditor = memberName(members, pair.toMemberId)

  async function register(transfer: Transfer) {
    setError(null)
    try {
      const { settlement: created } = await registerPayment.mutateAsync({
        groupId,
        data: { fromMemberId: transfer.fromMemberId, toMemberId: transfer.toMemberId, amount: transfer.amount },
      })
      setSettlement(created)
      toast.success('Pagamento registrado')
      void invalidateGroupQueries(queryClient, groupId)
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.status === 403) {
        toast.error(apiError.message)
        onClose()
        return
      }
      if (apiError.status === null || apiError.status >= 500) {
        toast.error(apiError.message)
        return
      }
      // 409 (pendente com outro valor) e 422 (excede a dívida): o saldo mudou com o diálogo aberto.
      setError(apiError.message)
      void invalidateGroupQueries(queryClient, groupId)
    }
  }

  if (settlement === null && target.mode === 'pay') {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            O pagamento fica pendente até {creditor} confirmar que recebeu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          <MoneyDisplay amount={target.transfer.amount} size="lg" />
          <p className="text-sm text-muted-foreground">para {creditor}</p>
        </div>
        <FormAlert message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={registerPayment.isPending} onClick={() => void register(target.transfer)}>
            {registerPayment.isPending ? 'Registrando…' : 'Registrar pagamento'}
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (settlement === null) return null
  return (
    <>
      <DialogHeader>
        <DialogTitle>Pagar com Pix</DialogTitle>
        <DialogDescription>
          Pague com Pix copia-e-cola no app do seu banco. O acerto fica pendente até {creditor} confirmar o recebimento.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1">
        <MoneyDisplay amount={settlement.amount} size="lg" />
        <p className="text-sm text-muted-foreground">para {creditor}</p>
      </div>
      {settlement.pixCopyPaste ? (
        <PixCopyButton code={settlement.pixCopyPaste} />
      ) : (
        <p className="max-w-prose text-sm">
          {creditor} não cadastrou chave Pix. Combine o pagamento por fora. O acerto fica pendente até {creditor} confirmar.
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </>
  )
}
```

- [ ] **Step 2: `AcknowledgeDialog.tsx`**

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePatchSettlementsSettlementIdAcknowledge } from '@/api/generated/endpoints/settlements/settlements'
import type { GroupMember, Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { memberName } from '@/features/groups/group-view'
import { toApiError } from '@/lib/api-error'
import { invalidateGroupQueries } from '@/lib/invalidate-group'
import { formatBRL } from '@/lib/money'

interface AcknowledgeDialogProps {
  groupId: string
  settlement: Settlement | null
  members: GroupMember[]
  onClose: () => void
}

export function AcknowledgeDialog({ groupId, settlement, members, onClose }: AcknowledgeDialogProps) {
  const queryClient = useQueryClient()
  const acknowledge = usePatchSettlementsSettlementIdAcknowledge()

  async function confirm(target: Settlement) {
    try {
      await acknowledge.mutateAsync({ settlementId: target.id })
      toast.success('Recebimento confirmado')
    } catch (error) {
      // 409 (alterado, já confirmado ou cancelado) e 403: a tela relê o estado atual.
      toast.error(toApiError(error).message)
    }
    void invalidateGroupQueries(queryClient, groupId)
    onClose()
  }

  return (
    <Dialog open={settlement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {settlement ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar recebimento</DialogTitle>
              <DialogDescription>
                Confirmar que você recebeu {formatBRL(settlement.amount)} de {memberName(members, settlement.fromMemberId)}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button disabled={acknowledge.isPending} onClick={() => void confirm(settlement)}>
                {acknowledge.isPending ? 'Confirmando…' : 'Confirmar recebimento'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: `PendingSettlementsList.tsx`**

```tsx
import type { GroupMember, Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { memberName } from '@/features/groups/group-view'
import { formatBRL } from '@/lib/money'
import { pendingAction } from '../settlement-view'

interface PendingSettlementsListProps {
  pending: Settlement[]
  members: GroupMember[]
  myMemberId: string | undefined
  onAcknowledge: (settlement: Settlement) => void
  onViewPix: (settlement: Settlement) => void
}

export function PendingSettlementsList({ pending, members, myMemberId, onAcknowledge, onViewPix }: PendingSettlementsListProps) {
  if (pending.length === 0) return null

  return (
    <section aria-labelledby="pending-title" className="grid gap-2 border-t p-4">
      <h2 id="pending-title" className="text-base font-semibold">
        Aguardando confirmação
      </h2>
      <ul className="-mx-2 grid">
        {pending.map((settlement) => {
          const action = pendingAction(settlement, myMemberId)
          const from = settlement.fromMemberId === myMemberId ? 'Você' : memberName(members, settlement.fromMemberId)
          const to = settlement.toMemberId === myMemberId ? 'você' : memberName(members, settlement.toMemberId)
          return (
            <li key={settlement.id} className="grid gap-2 px-2 py-3">
              <div className="flex items-baseline gap-3">
                <span>
                  <span className="font-medium">{from}</span> pagou a <span className="font-medium">{to}</span>
                </span>
                <span className="ml-auto shrink-0 font-medium tabular-nums">{formatBRL(settlement.amount)}</span>
              </div>
              {action === 'acknowledge' ? (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => onAcknowledge(settlement)}>
                    Confirmar recebimento
                  </Button>
                </div>
              ) : null}
              {action === 'view-pix' ? (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => onViewPix(settlement)}>
                    Ver Pix
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: `BalancesCard.tsx`**: a seção de pendentes entra no fim do card

Troque a interface e a assinatura, e acrescente o bloco abaixo logo antes do `</Card>` final:
```tsx
interface BalancesCardProps {
  groupId: string
  members: GroupMember[]
  myMemberId: string | undefined
  onPay?: (transfer: Transfer) => void
  onAcknowledge?: (settlement: Settlement) => void
  onViewPix?: (settlement: Settlement) => void
}

export function BalancesCard({ groupId, members, myMemberId, onPay, onAcknowledge, onViewPix }: BalancesCardProps) {
```
```tsx
      {onAcknowledge && onViewPix ? (
        <PendingSettlementsList
          pending={pending.data?.settlements ?? []}
          members={members}
          myMemberId={myMemberId}
          onAcknowledge={onAcknowledge}
          onViewPix={onViewPix}
        />
      ) : null}
    </Card>
```
Imports: acrescente `Settlement` ao `import type` de `@/api/types` e
`import { PendingSettlementsList } from '@/features/settlements/components/PendingSettlementsList'`.

- [ ] **Step 5: `GroupDetailPage.tsx`** (versão final)

```tsx
import { useState } from 'react'
import { useParams } from 'react-router'
import { useGetGroupsGroupId } from '@/api/generated/endpoints/groups/groups'
import { useGetUsersMe } from '@/api/generated/endpoints/users/users'
import type { Settlement } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddExpenseDialog } from '@/features/expenses/components/AddExpenseDialog'
import { ExpenseList } from '@/features/expenses/components/ExpenseList'
import { AcknowledgeDialog } from '@/features/settlements/components/AcknowledgeDialog'
import { type SettleTarget, SettleDialog } from '@/features/settlements/components/SettleDialog'
import { useGroupRealtime } from '@/realtime/use-group-realtime'
import { useSocketConnected } from '@/realtime/use-socket-status'
import { BalancesCard } from '../components/BalancesCard'
import { GroupHeader } from '../components/GroupHeader'
import { GroupUnavailable } from '../components/GroupUnavailable'
import { MembersList } from '../components/MembersList'
import { findMyMember } from '../group-view'

export function GroupDetailPage() {
  const { groupId = '' } = useParams()
  const group = useGetGroupsGroupId(groupId)
  const me = useGetUsersMe()
  const connected = useSocketConnected()
  const [addingExpense, setAddingExpense] = useState(false)
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null)
  const [acknowledging, setAcknowledging] = useState<Settlement | null>(null)
  useGroupRealtime(groupId)

  if (group.isError) return <GroupUnavailable error={group.error} onRetry={() => void group.refetch()} />
  if (group.isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const { name, description, members } = group.data.group
  const myUserId = me.data?.user.id
  const myMemberId = findMyMember(members, myUserId)?.id
  const openAddExpense = () => setAddingExpense(true)

  return (
    <div className="grid gap-6">
      <GroupHeader
        name={name}
        description={description}
        connected={connected}
        actions={<Button onClick={openAddExpense}>Adicionar despesa</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <BalancesCard
          groupId={groupId}
          members={members}
          myMemberId={myMemberId}
          onPay={(transfer) => setSettleTarget({ mode: 'pay', transfer })}
          onAcknowledge={setAcknowledging}
          onViewPix={(settlement) => setSettleTarget({ mode: 'view', settlement })}
        />
        <div className="grid gap-6">
          <ExpenseList groupId={groupId} members={members} myMemberId={myMemberId} onAddExpense={openAddExpense} />
          <MembersList groupId={groupId} members={members} myUserId={myUserId} />
        </div>
      </div>
      <AddExpenseDialog
        open={addingExpense}
        onOpenChange={setAddingExpense}
        groupId={groupId}
        members={members}
        myUserId={myUserId}
      />
      <SettleDialog groupId={groupId} target={settleTarget} members={members} onClose={() => setSettleTarget(null)} />
      <AcknowledgeDialog groupId={groupId} settlement={acknowledging} members={members} onClose={() => setAcknowledging(null)} />
    </div>
  )
}
```

### Task 7.5.4: Diálogo "Minha chave Pix" (D-102)

**Files:**
- Create: `src/features/profile/schemas.ts`, `src/features/profile/components/PixKeyDialog.tsx`
- Modify: `src/app/AppLayout.tsx`

**Interfaces:**
- Consumes: `useGetUsersMe`, `usePatchUsersPixKey`, `getGetUsersMeQueryKey` (4.4), `reportFormError`, `fieldsNamed` (4.5)
- Produces: `<PixKeyDialog />` (gatilho e diálogo)

- [ ] **Step 1: `schemas.ts`**

```ts
import { z } from 'zod'

export const pixKeySchema = z.object({
  pixKey: z.string().trim().min(1, 'Informe a chave Pix.'),
})
export type PixKeyValues = z.infer<typeof pixKeySchema>
```

- [ ] **Step 2: `PixKeyDialog.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getGetUsersMeQueryKey, useGetUsersMe, usePatchUsersPixKey } from '@/api/generated/endpoints/users/users'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fieldsNamed, reportFormError } from '@/lib/form-errors'
import { type PixKeyValues, pixKeySchema } from '../schemas'

export function PixKeyDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const me = useGetUsersMe()
  const updatePixKey = usePatchUsersPixKey()
  const current = me.data?.user.pixKey ?? ''
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PixKeyValues>({ resolver: zodResolver(pixKeySchema), values: { pixKey: current } })

  async function save(pixKey: string | null) {
    try {
      await updatePixKey.mutateAsync({ data: { pixKey } })
      toast.success(pixKey ? 'Chave Pix salva' : 'Chave Pix removida')
      await queryClient.invalidateQueries({ queryKey: getGetUsersMeQueryKey() })
      setOpen(false)
    } catch (error) {
      const message = reportFormError(error, setError, fieldsNamed<PixKeyValues>('pixKey'))
      if (message) setError('pixKey', { type: 'server', message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Chave Pix
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Minha chave Pix</DialogTitle>
          <DialogDescription>Quem te pagar num acerto recebe um código Pix copia-e-cola com esta chave.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit(({ pixKey }) => save(pixKey))} className="grid gap-4">
          <FormField label="Chave Pix" htmlFor="pix-key" hint="Email, telefone, CPF ou chave aleatória." error={errors.pixKey?.message}>
            <Input id="pix-key" autoComplete="off" aria-invalid={Boolean(errors.pixKey)} {...register('pixKey')} />
          </FormField>
          <DialogFooter className="sm:justify-between">
            {current ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={updatePixKey.isPending}
                onClick={() => void save(null)}
              >
                Remover chave
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={updatePixKey.isPending}>
              {updatePixKey.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: `AppLayout.tsx`**: antes do botão "Sair", acrescente `<PixKeyDialog />` e
  `import { PixKeyDialog } from '@/features/profile/components/PixKeyDialog'`.

- [ ] **Step 4: Conferir o fluxo completo com o back e duas janelas**

Expected:
- Ana salva a chave Pix (toast "Chave Pix salva");
- Bruno clica em Pagar, registra e vê o código Pix copia-e-cola; "Copiar código Pix" vira "Copiado!";
- a janela da Ana mostra "Aguardando confirmação" **sem recarregar**;
- Ana confirma e, **nas duas janelas**, os saldos ficam quitados e a transferência some;
- sem chave Pix, o diálogo do Bruno mostra o aviso de combinar por fora.

**Commits propostos (fechamento da Fase 7.5):**
```powershell
git add src/features/settlements/settlement-view.ts src/features/settlements/settlement-view.test.ts
git commit -m "feat: decide the action of each pending settlement" -m "- credor confirma; devedor revê o Pix; quem está de fora só lê"
git add src/features/settlements/components/PixCopyButton.tsx src/features/settlements/components/PixCopyButton.test.tsx
git commit -m "feat: add pix copy-and-paste button" -m "- Copiado! por 2 s; se a cópia falhar, seleciona o código e avisa"
git add src/features/settlements/components src/features/groups/components/BalancesCard.tsx src/features/groups/pages/GroupDetailPage.tsx
git commit -m "feat: register payments and confirm receipt" -m "- Pagar registra o acerto e mostra o Pix; Ver Pix reabre o código" -m "- credor confirma o recebimento; 409 e 422 relêem o estado do grupo" -m "- seção Aguardando confirmação no card de saldos"
git add src/features/profile src/app/AppLayout.tsx
git commit -m "feat: let users set their pix key" -m "- D-102: diálogo Minha chave Pix no cabeçalho, com salvar e remover"
```

---

## Fase 8 — Verificação do MVP

**Branch:** `feat/front-fase-8-mvp`

### Task 8.1: Rotas da SPA na Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
Sem isso, abrir `/groups/<id>` direto na Vercel dá 404. O deploy em si depende de o back ter deploy (backlog do back) e
de `VITE_API_URL`/`VITE_WS_URL` configuradas no projeto da Vercel.

### Task 8.2: Roteiro do critério de pronto (spec 5)

- [ ] **Step 1: Ambiente**: na pasta do back, `docker compose up -d postgres redis` e `npm run dev`; na pasta do
  front, `npm run dev`.
- [ ] **Step 2: Duas sessões isoladas**: janela normal (Ana) e janela anônima (Bruno), as duas em http://localhost:5173.
- [ ] **Step 3: Rodar o roteiro da spec, seção 5, passo a passo**, anotando para cada passo "ok" ou o que aconteceu.
- [ ] **Step 4: Sessão de 15 minutos sem esperar**: no `.env` do back, troque `JWT_EXPIRES_IN=15m` por
  `JWT_EXPIRES_IN=1m` e reinicie o back. Use a tela do grupo por 2 minutos. Expected: nenhuma volta ao login e, na
  aba Network, um `POST /refresh` por expiração. Depois **volte o valor para `15m`** e reinicie.
- [ ] **Step 5: Queda de rede**: com a tela do grupo aberta, pare o back por 10 segundos e suba de novo. Expected:
  "reconectando…" e depois "ao vivo", com os dados buscados de novo.
- [ ] **Step 6: Registrar** no relatório da fase a tabela "passo / resultado". Tudo "ok" significa MVP pronto.

**Commit proposto (fechamento da Fase 8):**
```powershell
git add vercel.json
git commit -m "chore: add spa rewrites for vercel" -m "- rotas profundas como /groups/:id abrem direto" -m "- roteiro do critério de pronto executado e registrado no PR"
```
