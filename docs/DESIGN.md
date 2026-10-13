# splittr-web — Direção visual

**Data:** 2026-10-13 · **Status:** aprovado em 2026-10-13
**Base:** shadcn/ui sobre Tailwind v4. Este documento só define tokens e regras; os componentes continuam
sendo os do shadcn.
**Orçamento:** abaixo de meio dia de implementação no total (seção 11).

---

## 1. Direção

**Assunto:** amigos dividindo contas em reais e acertando por Pix.
**Público:** quem avalia o portfólio, assistindo ao vídeo ou abrindo duas janelas.
**Função principal da interface:** deixar óbvio quem deve quanto a quem e mostrar isso mudando sozinho.

**Conceito: caderneta de fiado com etiqueta de preço.** Dois elementos do dia a dia brasileiro com dinheiro
guiam as escolhas:
- **A caderneta:** tinta azul de caneta sobre papel, e o vermelho para quem está devendo ("no vermelho").
- **A etiqueta de preço de mercado:** o "R$" pequeno e os centavos menores e elevados (R$ 50,⁰⁰).

**Onde a ousadia mora:** só nos valores em destaque (seção 5.2). Todo o resto é quieto: superfícies
brancas, bordas finas, nenhuma sombra em card, nenhum gradiente, nenhuma ilustração.

**Princípios**
1. A cor só aparece onde existe uma obrigação. "Deve" é vermelho, "a receber" é verde e "quitado" é cinza,
   porque não há nada a fazer.
2. A cor nunca anda sozinha: sempre vai junto do rótulo em texto ("deve", "a receber", "quitado").
3. As frases são em português comum: "Bruno paga Ana", e não "Bruno → Ana".
4. Os números ficam alinhados à direita, em coluna, com algarismos de largura fixa.

---

## 2. Tipografia

**Família única:** IBM Plex Sans, via Google Fonts, nos pesos 400, 500 e 600. Ela foi escolhida pela precisão
de desenho técnico (é a fonte da IBM, empresa de máquinas de escritório e de calcular) e pelos algarismos bem
diferenciados: 0 e O, 1 e l.

```html
<!-- index.html, dentro de <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Checagem obrigatória na Fase 2 (1 minuto):** renderizar `R$ 111,11` sobre `R$ 888,88` com `tabular-nums`.
Se as larguras forem diferentes, a fonte não tem algarismos tabulares. Nesse caso, trocar `--font-sans` pelo
system stack (`ui-sans-serif, system-ui, "Segoe UI", sans-serif`) e registrar a troca neste arquivo.

**Escala** (valores da escala clássica de Bringhurst)

| Uso | Tamanho | Peso | Entrelinha | Classe Tailwind |
|---|---|---|---|---|
| Legenda (data, "sua parte", ajuda de campo) | 12px | 400 | 1.4 | `text-xs` |
| Rótulo, botão, badge, texto secundário | 14px | 400 / 500 | 1.45 | `text-sm` |
| Corpo, linhas de lista | 16px | 400 | 1.5 | `text-base` |
| Título de seção (h2) | 16px | 600 | 1.3 | `text-base font-semibold` |
| Título de página (h1), marca "splittr" | 24px | 600 | 1.25 | `text-2xl font-semibold` |
| Valor em destaque (saldos) | 24px | 500 | 1 | `text-2xl font-medium tabular-nums` |
| Valor do acerto (diálogo) | 36px | 500 | 1 | `text-4xl font-medium tabular-nums tracking-tight` |

**Regras**
- Sem caixa-alta em rótulos, sem rótulo pequeno acima de títulos e sem itálico ou cor para destacar uma
  palavra de um título.
- Nome de pessoa em `font-medium`. O resto do texto da linha fica em 400.
- Blocos de texto corrido, como descrições de diálogo e estados vazios, com no máximo `max-w-prose`
  (cerca de 65 caracteres).
- Sem segunda família: o código Pix também usa a Plex Sans (seção 6.5).

---

## 3. Cores

### 3.1 Paleta base

| Nome | Hex | Papel | Contraste |
|---|---|---|---|
| Papel | `#F3F5F9` | fundo da página | — |
| Folha | `#FFFFFF` | cards, diálogos, popovers, campos | — |
| Tinta | `#1A2238` | texto principal (azul-marinho de caneta, não um "quase preto") | 15,8:1 na folha |
| Grafite | `#5A6478` | texto secundário e saldo quitado | 6,0:1 na folha · 5,5:1 no papel |
| Pauta | `#D9DEE8` | bordas e contorno de campos | — |
| Azul caneta | `#2347C5` | ação principal, links, foco | 7,6:1 com texto branco |
| Verde | `#13795B` | saldo a receber | 5,4:1 na folha |
| Vermelho | `#C0322B` | saldo devedor, erros e ações destrutivas | 5,6:1 na folha |

Todas as combinações de texto passam no WCAG AA (4,5:1).

O vermelho serve ao mesmo tempo para "deve" e para erro. Isso é intencional: as duas coisas pedem atenção,
e o contexto (rótulo "deve" × mensagem de erro) separa os casos.

### 3.2 Tokens para `src/index.css`

O `shadcn init` escreve o próprio bloco de variáveis em oklch. A Fase 2 **substitui** esses valores pelos de
baixo (hex vale em CSS variables) e **apaga o bloco `.dark`**, porque tema escuro está fora do escopo e
tokens sem uso ficariam sem manutenção. As variáveis `--chart-*` e `--sidebar-*` geradas pelo init ficam como
vieram, porque não são usadas.

```css
:root {
  --radius: 0.375rem;

  --background: #F3F5F9;          /* papel */
  --foreground: #1A2238;          /* tinta */
  --card: #FFFFFF;
  --card-foreground: #1A2238;
  --popover: #FFFFFF;
  --popover-foreground: #1A2238;

  --primary: #2347C5;             /* azul caneta */
  --primary-foreground: #FFFFFF;
  --secondary: #E9EDF4;
  --secondary-foreground: #1A2238;
  --muted: #E9EDF4;
  --muted-foreground: #5A6478;    /* grafite */
  --accent: #E9EDF4;
  --accent-foreground: #1A2238;
  --destructive: #C0322B;

  --border: #D9DEE8;              /* pauta */
  --input: #D9DEE8;
  --ring: #2347C5;

  /* semânticas do splittr */
  --positive: #13795B;            /* a receber */
  --negative: #C0322B;            /* deve */
  --settled: #5A6478;             /* quitado */
  --highlight: #E3E9FB;           /* destaque de atualização (seção 9) */
}

@theme inline {
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --color-settled: var(--settled);
  --color-highlight: var(--highlight);
}

body {
  @apply bg-background text-foreground font-sans antialiased;
}
```

O bloco `@theme inline` gerado pelo shadcn já mapeia `--color-primary`, `--color-border` e as outras
variáveis. Só é preciso **acrescentar** as linhas acima a ele. Com isso funcionam as classes `text-positive`,
`text-negative`, `text-settled` e `bg-highlight`.

---

## 4. Densidade, espaço, raio, bordas

- **Densidade média:** linhas de lista com `py-3` (cerca de 48px de altura) e alvos de toque de pelo menos
  40px. Os controles do shadcn ficam no tamanho padrão (`h-9`).
- **Espaço:** só a escala do Tailwind. Usar `gap-6` entre seções, `gap-4` dentro de um card, `gap-2` entre
  rótulo e campo, e `px-4` de margem lateral no celular.
- **Largura:** `max-w-5xl` (1024px) no detalhe do grupo, `max-w-2xl` na lista de grupos e `max-w-sm` em login
  e cadastro.
- **Raio:** `--radius: 0.375rem`. Pelas fórmulas do shadcn, controles (botão, campo, badge, `rounded-md`)
  ficam com 4px e containers (card, diálogo, `rounded-xl`) com 10px. A diferença marca a hierarquia: quem
  contém é mais redondo do que quem é clicado.
- **Bordas:** 1px na cor pauta. As linhas de uma lista são separadas por `divide-y` dentro do card, e não
  viram cards próprios.
- **Sombras:** nenhuma em cards. Remover `shadow-sm` de `components/ui/card.tsx` depois do `shadcn add`. O
  diálogo e o popover mantêm a sombra padrão, porque flutuam sobre a página.

---

## 5. Dinheiro na tela

### 5.1 Regra geral (listas, linhas e textos)
- Sempre o texto de `formatBRL`, em `tabular-nums`, alinhado à direita da linha (`text-right`, numa coluna
  de largura `shrink-0`).
- Valor em `font-medium` e na cor do texto da linha.
- Valor de despesa é **neutro** (tinta), porque uma despesa não é boa nem ruim. Só saldo tem cor.
- "Sua parte" e a prévia "≈ R$ 3,33 cada" ficam em `text-xs text-muted-foreground`.

### 5.2 Valor em destaque (o elemento memorável)
É a etiqueta de preço, usada **apenas** em dois lugares: os saldos da seção Saldos e o valor do acerto no
`SettleDialog`.

```
 R$ 50,⁰⁰       "R$": 0.5em, peso 400, cor grafite, alinhado ao topo dos algarismos
                inteiro: tamanho cheio, peso 500
                ",00": 0.55em, peso 500, elevado (vertical-align: super em 0.55em)
```

- Componente `MoneyDisplay` em `src/components/` (será usado por `groups` e `settlements`). Ele divide o
  texto de `formatBRL` em símbolo, parte inteira e centavos **só com operações de string**. A função de divisão
  fica em `lib/money.ts` e entra no TDD da Fase 5.
- Acessibilidade: o contêiner recebe `aria-label` com o texto completo ("R$ 50,00"), e as partes visuais
  ficam com `aria-hidden`.

### 5.3 Saldo
| Saldo (texto da API) | Rótulo | Cor | Valor |
|---|---|---|---|
| começa com `-` | deve | `text-negative` | sem o `-` |
| `0.00` ou `-0.00` | quitado | `text-settled` | **omitido**: o rótulo basta |
| qualquer outro | a receber | `text-positive` | como veio |

O rótulo fica à esquerda do valor, na mesma linha, em `text-sm`.

---

## 6. Layout

O texto é sempre alinhado à esquerda e os valores à direita. Nada centralizado, exceto a coluna de login e
cadastro.

### 6.1 Cabeçalho (todas as telas logadas)
```
┌────────────────────────────────────────────────────────────────────┐
│ splittr                                Ana Souza  Chave Pix   Sair │
└────────────────────────────────────────────────────────────────────┘
```
Folha branca com borda inferior. "splittr" em 24px/600 na cor tinta, sem logotipo. "Chave Pix" e "Sair" são
botões `ghost`. No celular, o nome do usuário some e os dois botões ficam.

### 6.2 Login e cadastro
```
                    splittr
                    Divida as despesas do grupo e acerte por Pix.

                    Email      [                        ]
                    Senha      [                        ]
                    [            Entrar                 ]
                    Não tem conta? Criar conta
```
Coluna `max-w-sm` centralizada, rótulo acima do campo e botão de largura total. Sem card em volta: o papel é
o fundo.

### 6.3 Grupos
```
 Seus grupos                                         [Criar grupo]
 ┌──────────────────────────────────────────────────────────────┐
 │ Viagem                                                       │
 │ Rateio da viagem de julho                                    │
 ├──────────────────────────────────────────────────────────────┤
 │ Casa                                                         │
 │ Contas do apartamento                                        │
 └──────────────────────────────────────────────────────────────┘
```
É **uma lista dentro de um card**, e não uma grade de cards iguais. A linha inteira é clicável, com fundo
`accent` no hover e anel de foco visível.

### 6.4 Detalhe do grupo
Desktop (`lg`, 1024px ou mais): duas colunas. À esquerda fica a resolução (quem deve a quem); à direita, o
histórico.
```
 Grupos
 Viagem                                              ● ao vivo
 Rateio da viagem de julho                   [Adicionar despesa]

 ┌ Saldos ───────────────────────┐  ┌ Despesas ──────────────────────────┐
 │ Ana  você      a receber R$ 50,⁰⁰│ Jantar             [Alimentação]   │
 │ Bruno               deve R$ 50,⁰⁰│ 13/10/2026  pago por Ana  R$ 100,00 │
 ├ Quem paga quem ───────────────┤  │ sua parte: R$ 50,00                │
 │ Bruno paga Ana        R$ 50,00│  ├────────────────────────────────────┤
 │                       [Pagar] │  │ ...                                │
 ├ Aguardando confirmação ───────┤  │ 12 despesas   [Anterior] [Próxima] │
 │ Bruno pagou R$ 50,00 a Ana    │  └────────────────────────────────────┘
 │        [Confirmar recebimento]│  ┌ Membros ───────────────────────────┐
 └───────────────────────────────┘  │ Ana Souza  ana@…        [dono]     │
                                    │ Bruno Lima bruno@…                 │
                                    │ Adicionar membro (Email | Telefone)│
                                    └────────────────────────────────────┘
```
- Grade `lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`. A coluna da esquerda é **um único card** com três
  seções separadas por borda: Saldos, Quem paga quem e Aguardando confirmação (esta só existe quando há
  pendentes).
- No celular, a ordem é: cabeçalho, card de saldos, Despesas, Membros. O botão "Adicionar despesa" fica no
  cabeçalho do grupo, nunca flutuando.
- "Quem paga quem" é o título visível da seção de transferências sugeridas da spec. Em português, a palavra
  "transferências" soa como operação bancária já feita.
- O indicador "ao vivo" é um ponto de 8px na cor verde mais texto `text-xs text-muted-foreground`. Quando
  desconectado: ponto grafite e "reconectando…". **Sem pulsar.**

### 6.5 Diálogos
- Largura padrão do shadcn (`sm:max-w-lg`). No celular, ocupam a largura com margem de 16px.
- **Nova despesa:** um campo por linha. Os participantes viram uma lista de checkboxes com o campo de valor
  ou percentual à direita, no mesmo alinhamento da regra 5.1. A prévia "≈ R$ 3,33 cada" fica abaixo da lista.
  O botão principal "Adicionar despesa" fica no rodapé à direita, com "Cancelar" `outline` ao lado.
- **Acerto:** o valor em destaque de 36px (5.2) no topo, com a frase "para Ciclano" logo abaixo. O código
  Pix fica num `textarea` somente leitura com fundo `muted`, `text-sm`, `break-all`, 4 linhas e a mesma
  família. O botão "Copiar código Pix" ocupa a largura toda, com o ícone `Copy` do lucide, que vira `Check`
  e "Copiado!" por 2 segundos.
- **Chave Pix:** um campo, mais "Salvar" e "Remover chave" (`ghost` em `text-destructive`).

---

## 7. Componentes shadcn: uso e ajustes

| Componente | Uso | Ajuste |
|---|---|---|
| Button | `default` para a ação principal de cada tela (uma por vez), `outline` para as secundárias, `ghost` no cabeçalho | nenhum |
| Card | seções das telas 2 e 3 | remover `shadow-sm` |
| Badge | categoria (`secondary`) e papel "dono" (`outline`) | nenhum |
| Input, Label | todos os formulários (react-hook-form direto, conforme o setup) | nenhum |
| Dialog | Novo grupo, Nova despesa, Acerto, Chave Pix, confirmação de recebimento | nenhum |
| Skeleton | listas e saldos, com a mesma altura da linha real | nenhum |
| Sonner (Toaster) | toasts de sucesso e de erro | `position="bottom-center"`, sem `richColors` |
| Table | **não usar**: as listas são `divide-y`, e a tabela do shadcn não se adapta ao celular | — |

Ícones do lucide (que vem com o shadcn) só onde ajudam a reconhecer a ação: `Copy`/`Check` no Pix,
`ChevronLeft` no "Grupos" do detalhe e `LogOut` em "Sair". Nenhum ícone decorativo em título.

---

## 8. Texto da interface

- Frase com inicial maiúscula só na primeira palavra, verbos diretos e nada de enchimento.
- **A ação tem o mesmo nome do começo ao fim:** o botão "Adicionar despesa" gera o toast "Despesa
  adicionada", e "Registrar pagamento" gera "Pagamento registrado".
- Erros dizem o que aconteceu e o que fazer, sem pedir desculpa.
- O estado vazio é uma frase mais uma ação.
- Nada de "·" juntando informações nem de "→" no fim de links e botões.

**Ajustes de texto em relação à spec das telas** (aprovados e já aplicados na spec; nenhum fluxo muda)

| Spec | Aqui | Motivo |
|---|---|---|
| botão "Novo grupo" | **"Criar grupo"** (o título do diálogo continua "Novo grupo") | verbo de ação, combina com o toast "Grupo criado" |
| botão "Nova despesa" | **"Adicionar despesa"** (o título do diálogo continua "Nova despesa") | combina com o toast "Despesa adicionada" |
| seção "Transferências sugeridas" | **"Quem paga quem"** | linguagem de quem usa (6.4) |
| seção "Acertos aguardando confirmação" | **"Aguardando confirmação"** | o card já deixa claro o assunto |

---

## 9. Movimento

Por padrão, só as transições que o shadcn já traz (abrir e fechar diálogo, toast).

**Destaque de atualização (aprovado):** quando uma linha de Saldos, Quem paga quem ou Despesas
muda depois de um refetch, e não na primeira carga, o fundo da linha acende em `bg-highlight` e volta ao
normal em 1,2s (`transition-colors`).
- É o único movimento que não vem de um clique, e existe para o critério de pronto: na janela B, o olho vai
  direto para o que mudou.
- A comparação é entre o texto anterior e o atual da linha (`useRef`), sem conta nenhuma.
- Com `prefers-reduced-motion: reduce`, a linha fica destacada por 1,2s e volta ao normal sem transição.
- Custo: cerca de 30 minutos, num hook pequeno.

---

## 10. Acessibilidade (piso, sem anúncio)

- Contrastes da seção 3.1, todos em AA.
- Foco visível em tudo que é clicável, com o anel padrão do shadcn na cor `--ring` (azul caneta).
- Cor sempre acompanhada de texto (princípio 2).
- `aria-label` nos valores em destaque (5.2). O indicador "ao vivo" usa `role="status"`.
- O layout funciona a partir de 360px de largura, sem rolagem horizontal.

---

## 11. Custo estimado

| Item | Tempo |
|---|---|
| Fonte, tokens no `index.css`, remover `.dark` e a sombra do Card | 30 min |
| `MoneyDisplay` e a divisão do texto em `lib/money.ts` (com teste) | 45 min |
| Tom do saldo (5.3) | dentro do tempo das telas (é regra de exibição já prevista na spec) |
| Destaque de atualização | 30 min |
| Ajustes de layout das telas (grade do detalhe, listas `divide-y`) | dentro do tempo das telas |
| **Total específico de design** | **cerca de 1h45** |

---

## 12. Fora daqui

Tema escuro, ilustrações, logotipo, segunda família tipográfica, animações de entrada, gradientes, sombras em
card e cores por categoria de despesa.
