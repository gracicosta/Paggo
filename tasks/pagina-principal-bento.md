# Task: Nova página principal (opção C, em blocos)

- **ID:** `pagina-principal-bento`
- **Status:** `done`
- **Data:** 2026-11-23
- **Design de referência:** `Paggo_designs/pagina-principal/04_opcao_C_modo_claro.png` e `05_opcao_C_modo_escuro.png`

---

## 📋 Resumo
A página principal (dashboard) foi refeita no layout em blocos aprovado (opção C), com **modo claro e escuro**,
na identidade roxa do login v5. A barra lateral azul deu lugar a um **menu superior**. Todos os números
continuam vindo do `FinanceContext`, ou seja, dos dados do perfil (ou do perfil demonstrativo).
Os ícones são os mesmos que o projeto já usava (react-icons).

## 🧱 Blocos da página
| Bloco | O que mostra | De onde vem |
|---|---|---|
| Saldo atual (roxo, grande) | Saldo, variação vs mês anterior, % da renda que sobrou e gráfico dos últimos 5 meses | `currentBalance`, `monthlyChartData` |
| Receitas / Despesas | Totais e variação vs mês anterior | `totalIncome`, `totalExpenses`, `monthlyChartData` |
| Taxa de economia | Quanto da renda sobrou, comparado à meta de 30% (`SAVINGS_TARGET`) | calculado |
| Insight da IA | Em quantas semanas o cofrinho mais próximo fica pronto guardando R$ 150/semana (`WEEKLY_SAVING`) | `piggyBanks` |
| Limites por categoria | As 5 categorias com maior % do limite usado | `categoryBudgets` |
| Cofrinhos | Até 3 cofrinhos com % concluído + atalho "Criar novo cofrinho" | `piggyBanks` |
| Boletos a vencer | Até 4 boletos, vencidos primeiro, com status | `fixedBills` |
| Assinaturas | Até 3 assinaturas, total por mês e por ano | `subscriptions` |

## 🌗 Modo claro e escuro
- Botão da lua no menu superior alterna o tema. A escolha fica salva em `localStorage` (`paggo_theme`).
- Na primeira visita, o tema segue o que foi escolhido na tela de login; se não houver escolha, segue o sistema.
- As cores ficam em variáveis CSS em `HomeLayout.module.css`.

## 📱 Responsivo
- Até 1180px: blocos em 2 colunas e o saldo ocupa a largura toda.
- Até 980px: as abas do menu descem para uma linha própria.
- Até 620px (celular): 1 coluna, abas só com ícone, botão de configurações e nome do perfil escondidos.

## 📁 Arquivos
| Arquivo | Alteração |
|---|---|
| `src/App.tsx` | Usa o novo `HomeLayout` no lugar de `NavBar` + `Dashboard` |
| `src/components/layout/HomeLayout/*` | Novo: tema claro/escuro, mês selecionado e cores da página |
| `src/components/layout/TopNav/*` | Novo: menu superior (logo, abas, mês, notificações, configurações, tema, perfil, sair) |
| `src/pages/Dashboard/Dashboard.tsx` | Reescrito: layout em blocos |
| `src/pages/Dashboard/Dashboard.module.css` | Reescrito: estilos dos blocos |
| `src/assets/images/paggo-logo-escura.png` | Novo: logo com letras escuras para o modo claro |

## ⚠️ Observações
- **Componentes antigos não foram apagados:** `NavBar`, `MonthFilter`, `MonthlyChart` e os cards em
  `src/components/cards/*` deixaram de ser usados na página, mas continuam no projeto caso queira reaproveitar.
- **Botões ainda sem ação** (como já era antes): abas Transações/Metas/Insights, "Nova transação",
  "Pedir plano à IA", "Criar lembrete", "Ver todos", notificações e configurações.
- O seletor de mês muda o texto da página, mas os dados ainda não são filtrados por mês (o `FinanceContext` não tem dados por mês).
- O gráfico usa a projeção de 5 meses do `FinanceContext`, rotulada com os 5 meses até o mês atual.

## ✅ Verificação
- `tsc -b` e `eslint` sem erros nos arquivos alterados.
- Testado no navegador em 1440px, 1024px e celular (375px), nos modos claro e escuro.

---

## 🔧 Ajustes (2026-11-23, segunda rodada)
- **Sem scroll no notebook:** a partir de 1181px de largura, a página ocupa exatamente a altura da tela.
  Os blocos se dividem em 3 linhas que se ajustam à altura disponível. Em telas baixas (até 940px de altura)
  tudo fica um pouco mais compacto e, até 820px (ex.: 1366×768), aparecem 4 categorias e some o atalho "Criar novo cofrinho".
  Testado em 1366×768, 1440×900, 1536×864 e 1920×1080.
- **Largura total:** tirado o limite de 1440px; agora a página cobre a tela toda com 24px de margem nas laterais.
- **Perfil:** virou um botão de 42px, igual aos outros ícones. O nome aparece ao passar o mouse.
- **Contraste para daltônicos:** novo botão no menu superior (ícone de contraste). Troca verde/vermelho por
  azul/laranja e usa a paleta Okabe-Ito nas barras de categorias e cofrinhos. A escolha fica salva em `paggo_colorblind`.
- **Seletor de meses:** trocado a lista com rolagem por um painel com o ano e os 12 meses em grade,
  no mesmo fundo dos cartões. Meses futuros ficam desabilitados, o mês atual fica destacado e fecha com Esc.
