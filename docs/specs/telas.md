# splittr-web — Spec das telas do MVP

**Data:** 2026-10-13 · **Status:** aprovada em 2026-10-13
**Fontes:** `docs/FRONTEND_SETUP.md` (stack, pastas e trechos-base) e o código do back em
`../ProjetoRachamentoDeContas` (rotas, schemas, eventos). Esta spec não rediscute a stack nem a estrutura de pastas.

**Objetivo:** frontend de demonstração para um portfólio de back-end. É um MVP funcional, limpo e rápido de
entregar. O critério de pronto está no fim do documento.

---

## 1. Pré-requisitos

### 1.1 Decisões aprovadas (2026-10-13, todas na opção A)

| ID | O quê | Onde |
|---|---|---|
| D-97 | Front em repositório próprio, pasta irmã do back | feito (pasta movida; `git init` na Fase 0) |
| D-98 | Back aceita valor monetário como string decimal (até 2 casas) nas requisições, além de number | back, antes da Fase 4 |
| D-99 | `GET /groups/:id/balances` desconta acertos CONFIRMED; cache de saldos invalidado ao adicionar/remover membro, sair do grupo e confirmar acerto | back, antes da Fase 4 |
| D-100 | Membros (`GET /groups/:id` e `/members`) passam a trazer `userId` | back, antes da Fase 4 |
| D-101 | 401 → um único `/refresh` compartilhado → repete a requisição; se falhar, vai para `/login`. Socket com `TOKEN_EXPIRED` faz refresh e reconecta | front |
| D-102 | Diálogo "Minha chave Pix" no cabeçalho | front |
| D-103 | Sem `leave_group`: ao sair da tela, o front só remove os listeners | front |
| D-104 | Back traduz "Email or Password incorrect" e "User With Email Already Exist" para português | back, antes da Fase 4 |

**Ordem:** D-98, D-99 e D-100 mudam o OpenAPI. O primeiro `npm run api:gen` (Fase 4) só roda depois deles.

### 1.2 Valores do back (encontrados no código, confirmados pelo usuário em 2026-10-13)

| Valor | Encontrado |
|---|---|
| `VITE_API_URL` | `http://localhost:3333` |
| `VITE_WS_URL` | `http://localhost:3333` (mesmo servidor) |
| JSON do Swagger | `/docs/json`. Só existe com `NODE_ENV` diferente de `production`: rode `api:gen` contra o `npm run dev` do back, não contra o `app` do compose |
| Token no handshake | `auth: { token }` → `socket.handshake.auth.token` |
| Falhas no handshake | `connect_error` com `message` = `UNAUTHORIZED` ou `TOKEN_EXPIRED` |
| Entrar na sala | `socket.emit('join_group', groupId)` com o id como **string pura**. Respostas: `joined_group { groupId }` ou `error { code, message }` |
| Sair da sala | não existe (D-103) |
| Eventos escutados | `expense_created`, `expense_updated`, `expense_deleted`, `expense_categorized`, `balances_updated`, `member_added`, `member_removed`, `settlement_confirmed` |
| Evento ignorado | `settlement_computed` (ver 2.4) |
| Zod | v4 (`zod ^4.3.6` no back) |
| CORS | o back aceita `http://localhost:5173` por padrão (`CORS_ORIGIN`) |

---

## 2. Regras que valem para todas as telas

### 2.1 Rotas e layout

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/login`, `/register` | pública; quem já está logado vai para `/groups` | Tela 1 |
| `/groups` | protegida | Tela 2 |
| `/groups/:groupId` | protegida | Tela 3, com as Telas 4 e 5 como diálogos |
| `/` e qualquer outra | redireciona para `/groups` | — |

- `ProtectedRoute` só confere se existe token. Sem token, vai para `/login`.
- Layout logado: cabeçalho com "splittr" (link para `/groups`), nome do usuário (`GET /users/me`), botão
  **Chave Pix** (D-102) e botão **Sair**.
- Depois do login, o destino é sempre `/groups`. Não há volta à rota de origem.

### 2.2 Sessão (D-101)
- O access token fica no `localStorage` (`auth-store`). O refresh token é um cookie httpOnly que o back
  define. O axios usa `withCredentials: true`.
- Num 401, o cliente chama `POST /refresh` **uma vez**, e as requisições simultâneas esperam a mesma
  promessa. Se o refresh der certo, o cliente grava o token novo e repete a requisição original. Se falhar,
  faz o logout local e vai para `/login`.
- Um 401 vindo de `/auth` ou do próprio `/refresh` **não** dispara refresh.
- Logout: `POST /logout` (idempotente) e, mesmo que ele falhe, `clearToken()`, `socket.disconnect()`,
  `queryClient.clear()` e navegação para `/login`.
- `GET /users/me` com 404 (usuário não existe mais) leva ao logout.

### 2.3 Erros HTTP

| Resposta | Tratamento |
|---|---|
| 400 com `issues` (D-90) | cada `path` vira erro no campo correspondente (`setError`). Issue sem campo vai para o topo do formulário |
| 400 sem `issues` (regra de domínio) | `message` da API no topo do formulário |
| 403 | `message` da API em toast; na Tela 3, estado "sem acesso" |
| 404 | estado "não encontrado" na tela; em formulário, `message` da API |
| 409 | `message` da API em toast e refetch das queries do grupo |
| 422 | `message` da API no diálogo (hoje só "excede a dívida", no acerto) |
| 429 | "Muitas tentativas. Aguarde um minuto e tente de novo." |
| 5xx ou rede | toast "Não foi possível falar com o servidor. Tente de novo." O formulário mantém o que foi digitado |

Loading: `Skeleton` no lugar de listas e cards. Durante uma mutação, o botão de envio fica desabilitado e o
rótulo vira "Salvando…".

### 2.4 Tempo real (D-103)
- `useGroupRealtime(groupId)` roda só na Tela 3. O socket conecta na primeira vez que o hook monta e só
  desconecta no logout.
- **A cada `connect`, inclusive na primeira conexão e em toda reconexão:** emitir `join_group` e invalidar as
  queries do grupo. Uma reconexão perde as salas e pode ter perdido eventos.
- Se o socket já estiver conectado quando o hook monta, emitir `join_group` na hora.
- Handler dos eventos escutados (1.2): se `payload.groupId !== groupId`, ignorar. Caso contrário, chamar
  `invalidateQueries` com o predicado das query keys que contêm `/groups/${groupId}`. **O payload nunca entra
  no cache.**
- **Não escutar `settlement_computed`.** O back emite esse evento em todo `GET .../settlements/compute`, e
  invalidar com ele criaria um ciclo de refetch entre as abas. O front não chama essa rota.
- `connect_error`: com `TOKEN_EXPIRED`, refresh (a mesma promessa da 2.2) e depois reconexão; com
  `UNAUTHORIZED`, logout.
- `error` com `code: 'FORBIDDEN'`: não faz nada além do registro. O próximo GET devolve 403 e a tela mostra o
  estado "sem acesso".
- Cleanup: `off` de cada listener com a mesma referência de função. Sem `emit` de saída e sem `disconnect`.
- Indicador discreto no cabeçalho do grupo: "ao vivo" quando conectado, "reconectando…" quando não.

### 2.5 Dinheiro
- A API devolve valores como string com 2 casas (`"1234.50"`). O front exibe com `formatBRL` e alinha à
  direita com `tabular-nums` (detalhes no `docs/DESIGN.md`).
- A entrada do usuário passa por `toApiAmount`, que devolve string. Com o D-98, essa string vai **como está**
  no corpo da requisição.
- O tom do saldo sai do texto, sem `Number`: prefixo `-` é **negativo** ("deve"); `0.00` ou `-0.00` é
  **quitado**; o resto é **positivo** ("a receber"). O valor aparece sem o sinal (o `-` é removido da string)
  ao lado do rótulo. A cor sempre vem acompanhada do rótulo em texto.
- Nenhuma soma, divisão ou comparação numérica de dinheiro. A **única** exceção é a prévia aproximada da
  divisão igual (Tela 4), isolada em uma função de `lib/money.ts` que só serve para exibição.

---

## 3. Telas

### Tela 1 — Login / Cadastro

**Login** (`/login`)
- Campos: email e senha. O Zod do formulário espelha o `authBody` do back: email válido e senha com no
  mínimo 6 caracteres.
- Fluxo: `POST /auth` → `setToken(accessToken)` → `/groups`. O layout carrega o `GET /users/me`.
- Link para "Criar conta".

**Cadastro** (`/register`)
- Campos: nome (obrigatório), email, senha (mínimo 6) e telefone (opcional, texto livre; o back normaliza
  para E.164).
- Fluxo: `POST /register` responde 201 sem corpo. Em seguida, `POST /auth` com as mesmas credenciais e
  navegação para `/groups`.
- Se o cadastro der certo e o login automático falhar, o usuário vai para `/login` com o aviso "Conta criada.
  Entre com seu email e senha."
- Link para "Já tenho conta".

| Estado | Login | Cadastro |
|---|---|---|
| Loading | botão "Entrando…" desabilitado | botão "Criando conta…" desabilitado |
| 400 | issues nos campos | issues nos campos (telefone inválido cai em `phone`) |
| 401 | `message` da API no topo ("Email ou senha incorretos.", D-104) | — |
| 409 | — | `message` da API no topo (email ou telefone já usados) |
| 429 | aviso do 2.3 (limite de 5/min) | aviso do 2.3 |
| Rede | toast do 2.3 | toast do 2.3 |
| Vazio | não se aplica | não se aplica |

### Tela 2 — Grupos (`/groups`)

**Dados:** `GET /groups` → `{ groups: [{ id, name, currency, description? }] }`.

**Fluxo**
- Lista de grupos com nome e descrição. Clicar abre `/groups/:id`.
- **Criar grupo** abre o `Dialog` "Novo grupo" com nome (obrigatório) e descrição (opcional). O envio faz `POST /groups`
  sem `currency` (o back usa BRL), mostra o toast "Grupo criado", invalida a lista e navega para o grupo novo.
- A lista **não** mostra saldo por grupo: a API não fornece esse dado e calcular no front é proibido.
- Não há tempo real nesta tela, porque o usuário não está em sala nenhuma. Um grupo em que alguém acabou de
  adicionar o usuário aparece quando a aba volta a ter foco (`refetchOnWindowFocus`, padrão do TanStack
  Query) ou ao recarregar.

| Estado | Comportamento |
|---|---|
| Loading | 3 skeletons de linha |
| Vazio | "Você ainda não participa de nenhum grupo. Crie um ou peça para alguém te adicionar pelo seu email." e o botão Criar grupo |
| Erro | mensagem e botão "Tentar de novo" (refetch) |
| Erro no diálogo | issues no campo nome; rede vira toast e o diálogo fica aberto |

### Tela 3 — Detalhe do grupo (`/groups/:groupId`)

**Dados** (queries independentes, cada seção com seus próprios estados):

| Query | Uso |
|---|---|
| `GET /groups/:id` | nome, descrição e membros `{ id, userId, role, name, email }` (D-100) |
| `GET /groups/:id/balances` | `memberBalances` e `transfers` (descontando acertos confirmados, D-99) |
| `GET /groups/:id/expenses?page=N&limit=20` | `expenses` e `total` |
| `GET /groups/:id/settlements?status=PENDING` | acertos aguardando confirmação |
| `GET /users/me` (já em cache) | "eu" é o membro cujo `userId` é igual a `me.id` |

Os nomes saem dos membros, pelo `memberId`. O pagador de uma despesa sai do `payerId`, que é um **userId**.
Se o pagador já saiu do grupo, a lista mostra "ex-membro".

**Cabeçalho:** nome, descrição, indicador de tempo real (2.4) e botão **Adicionar despesa** (Tela 4).

**Seção Saldos (`BalancesCard`)**
- Uma linha por membro: nome (com "você" ao lado do próprio), rótulo e valor com o tom da 2.5.

**Seção Quem paga quem (`TransfersList`, as transferências sugeridas)**
- Cada linha mostra "Fulano → Ciclano" e o valor.
- Se o devedor sou eu e **não** existe acerto pendente do mesmo par: botão **Pagar**, que abre a Tela 5.
- Se existe acerto pendente do mesmo par: o texto "pagamento registrado, aguardando confirmação" no lugar do
  botão.
- Vazio: "Ninguém deve nada. Tudo quitado."

**Seção Aguardando confirmação** (acertos pendentes; aparece só quando há algum)
- Cada linha mostra "Fulano pagou R$ X a Ciclano".
- Se o credor sou eu: botão **Confirmar recebimento** (Tela 5, passo 3).
- Se o devedor sou eu e existe `pixCopyPaste`: botão **Ver Pix**, que reabre a Tela 5 no passo 2.

**Seção Despesas (`ExpenseList`)**
- Ordem do back: `occurredAt` decrescente.
- Linha: descrição, categoria em `Badge` ("Categorizando…" enquanto não houver `category`; o evento
  `expense_categorized` atualiza), "pago por", data (dd/mm/aaaa) e valor à direita.
- "Sua parte: R$ Y" vem da `share` cujo `memberId` é o meu. É uma busca, não uma conta. Sem `share` minha,
  aparece "você não participa".
- Paginação: 20 por página (padrão do back), botões Anterior e Próxima e o texto "N despesas".
- Sem editar nem excluir no MVP.

**Seção Membros (`MembersList`)**
- Linha: nome, email, papel (`Badge` "dono" para OWNER) e "você".
- Só para OWNER: formulário **Adicionar membro** com seletor **Email | Telefone**. O seletor existe porque a
  API exige exatamente um dos dois (D-77) e evita adivinhar o tipo. O envio faz
  `POST /groups/:id/members`, mostra o toast "Membro adicionado" e invalida as queries.
- Erros no campo: 404 "Nenhum usuário registrado com esse contato", 400 "O usuário já é membro do grupo"
  (mensagens da API) e issues.
- Só eu no grupo: dica "Adicione alguém pelo email para dividir despesas."

| Estado | Comportamento |
|---|---|
| Loading | skeleton por seção; cada seção aparece quando a sua query chega |
| 403 | tela "Você não faz parte deste grupo" com link para `/groups`. Vale também para quem foi removido com a tela aberta: o próximo refetch devolve 403 |
| 404 ou 400 (id inválido) | tela "Grupo não encontrado" com link para `/groups` |
| Erro numa seção (5xx ou rede) | mensagem e "Tentar de novo" só naquela seção |
| Sem despesas | "Nenhuma despesa ainda" e o botão Adicionar despesa |

**Tempo real:** `useGroupRealtime(groupId)` fica ativo enquanto a tela está montada (2.4).

### Tela 4 — Nova despesa (`Dialog` sobre a Tela 3)

A despesa nova é um diálogo, e não uma rota, por dois motivos: a Tela 3 continua montada (com o tempo real
ativo) e a estrutura de pastas não prevê `pages/` em `expenses`.

**Campos** (o Zod fica em `features/expenses/schemas.ts`, com TDD)

| Campo | Regra no front | Vai para a API |
|---|---|---|
| Descrição | obrigatória | `description` |
| Valor | `toApiAmount` válido e diferente de zero (checagem do texto: `0`, `0,0`, `0,00`) | `amount` em string (D-98) |
| Pago por | select de membros; padrão "eu" | `payerId` (userId, D-100) |
| Data | input de data; padrão hoje | `occurredAt` em ISO, ao meio-dia local, para o fuso não trocar o dia |
| Categoria | "Automática" (padrão) ou uma das 8 da API | `category`, omitida quando é Automática |
| Divisão | Igual, Valores ou Percentual | `splitMethod` EQUAL, FIXED ou PERCENTAGE |
| Participantes | checkbox por membro, todos marcados por padrão; pelo menos um | `shares[]` |

As 8 categorias: Alimentação, Transporte, Moradia, Lazer, Assinaturas, Saúde, Compras e Outros.

**Por método de divisão**
- **Igual:** `shares: [{ memberId }]` dos marcados. Prévia "≈ R$ 3,33 cada", produzida pela função de exibição
  da 2.5. Ela não distribui o resto dos centavos e nunca vai para a API.
- **Valores:** um campo de valor por participante, com `toApiAmount`, gerando `{ memberId, amount }` em
  string.
- **Percentual:** um campo de percentual por participante, gerando `{ memberId, percentage }` como number.
  Percentual não é dinheiro, e o D-98 não mudou esse campo. A vírgula é normalizada para ponto.
- O front **não** confere se as partes fecham o total nem se os percentuais somam 100: é regra de domínio. O
  400 do back aparece no topo da seção de divisão. As issues com caminho `shares.N.amount` ou
  `shares.N.percentage` caem no participante da posição N do array enviado.

**Fluxo:** `POST /groups/:id/expenses` → fecha o diálogo → toast "Despesa adicionada" → invalida as queries do
grupo. As outras abas recebem `expense_created` e `balances_updated`.

| Estado | Comportamento |
|---|---|
| Enviando | botão "Salvando…" e campos travados |
| 400 | issues nos campos ou nos participantes; regra de domínio no topo |
| 403 | toast e diálogo fechado |
| Rede | toast; o diálogo fica aberto com os dados |
| Fechar com dados | descarta sem confirmar |

### Tela 5 — Acerto e Pix (`SettleDialog` e `PixCopyButton`)

**Passo 1 — Confirmar (devedor, a partir de "Pagar")**
- Texto: "Você vai registrar um pagamento de R$ X para Ciclano." O valor é o da transferência sugerida e não
  pode ser editado. Não há pagamento parcial no MVP.
- Botão **Registrar pagamento**, que faz `POST /groups/:id/settlements` com
  `{ fromMemberId: eu, toMemberId, amount }`. O `amount` vai como a string da API (D-98).
- O back é idempotente: se já existe um pendente do mesmo par com o mesmo valor, devolve esse acerto.

**Passo 2 — Pix**
- Com `pixCopyPaste`: o código aparece num campo somente leitura, ao lado de **Copiar código Pix**
  (`navigator.clipboard.writeText`). Depois do clique, o botão mostra "Copiado!" por 2 segundos. Se a cópia
  falhar, o texto fica selecionado e um toast diz "Não foi possível copiar. Selecione o código e copie
  manualmente." Instrução: "Pague com Pix copia-e-cola no app do seu banco. O acerto fica pendente até
  Ciclano confirmar o recebimento."
- Com `pixCopyPaste` nulo: "Ciclano não cadastrou chave Pix. Combine o pagamento por fora. O acerto fica
  pendente até Ciclano confirmar." A chave entra no código no momento do registro; trocar a chave depois não
  altera acertos já pendentes.
- Ao fechar, as queries do grupo são invalidadas. O credor recebe `settlement_confirmed` e passa a ver o
  pendente.

**Passo 3 — Reconhecimento (credor, a partir de "Confirmar recebimento")**
- Confirmação: "Confirmar que você recebeu R$ X de Fulano?"
- `PATCH /settlements/:id/acknowledge` → toast "Recebimento confirmado" → invalida as queries.
- Com o D-99, o saldo dos dois vai para quitado e a transferência some. A outra aba recebe
  `settlement_confirmed`.

| Estado | Comportamento |
|---|---|
| Enviando | botão desabilitado com "Registrando…" ou "Confirmando…" |
| 422 "excede a dívida" | `message` no diálogo e refetch (o saldo mudou com o diálogo aberto) |
| 409 "já existe um acerto pendente" | `message` e refetch (existe um pendente com outro valor) |
| 409 no acknowledge ("alterado por outra operação", "já confirmado" ou "cancelado") | `message` e refetch |
| 403 | toast e diálogo fechado |

### Diálogo Minha chave Pix (D-102, no cabeçalho)
- Mostra a `pixKey` atual (`GET /users/me`) num campo editável.
- **Salvar** faz `PATCH /users/pix-key { pixKey }`. **Remover** faz `PATCH { pixKey: null }`. Os dois mostram
  um toast e invalidam `/users/me`.
- Erros: issues no campo; rede vira toast.

---

## 4. Fora do escopo do MVP

Editar ou excluir despesa, histórico de revisões, remover membro, mudar papel, sair do grupo, editar ou excluir
grupo, grupo em moeda diferente de BRL, editar telefone, recategorizar, filtros da lista de despesas, pagamento
parcial, notificações fora da Tela 3, tema escuro, i18n e animações elaboradas.

---

## 5. Critério de pronto: roteiro do demo

> **Duas sessões precisam de dois navegadores isolados:** uma janela normal e uma anônima, ou dois perfis.
> Abas do mesmo perfil dividem o `localStorage` (token) e o cookie de refresh, então logar o Bruno numa aba
> transformaria a outra em Bruno também.

1. **Janela A:** Ana se cadastra e salva a chave Pix no cabeçalho.
2. **Janela B:** Bruno se cadastra.
3. **A:** Ana cria o grupo "Viagem" e adiciona Bruno pelo email.
4. **B:** a lista de grupos mostra "Viagem" quando a janela volta a ter foco. Bruno abre o grupo.
5. **A:** Ana lança "Jantar", R$ 100,00, divisão igual entre os dois.
   **B, sem recarregar:** a despesa aparece, o saldo de Bruno fica em "deve R$ 50,00" e surge a transferência
   Bruno → Ana.
6. **B:** Bruno clica em Pagar, registra o pagamento, vê o Pix copia-e-cola e copia.
7. **A, sem recarregar:** aparece o acerto aguardando confirmação. Ana clica em Confirmar recebimento.
   **Nas duas janelas:** os dois ficam quitados e a transferência some.

---

## 6. Escolhas feitas nesta spec (para revisão)

1. Nova despesa e acerto são diálogos sobre a Tela 3, não rotas próprias.
2. O cadastro faz login automático em seguida.
3. Só BRL: o formulário de grupo não oferece moeda e toda exibição usa `formatBRL`.
4. Prévia da divisão igual em "≈ R$ 3,33 cada", conforme o exemplo do prompt. Interpreto "sem centavos" como
   "sem calcular a distribuição exata dos centavos", não como arredondar para reais inteiros.
5. Tom do saldo pelo sinal do texto, sem `Number`.
6. Percentual enviado como number; só os campos de dinheiro mudam com o D-98.
7. Pagamento sempre pelo valor integral da transferência sugerida.
8. Adicionar membro com seletor Email | Telefone.
9. Despesas em páginas de 20, com Anterior e Próxima.
10. O front não tem mensagens de erro próprias para respostas da API; mostra sempre a `message` (com o D-104,
    em português também no login e no cadastro). As exceções são 429, 5xx e rede (2.3).
11. Data da despesa enviada como meio-dia local em ISO.
12. Indicador "ao vivo" ou "reconectando…" no cabeçalho do grupo.
