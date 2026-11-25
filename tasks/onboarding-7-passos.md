# Task: Onboarding em 7 passos

- **ID:** `onboarding-7-passos`
- **Status:** `done`
- **Data:** 2026-11-25
- **Design de referência:** `design/onboarding/*.png` + `design/onboarding/html/onboarding.html`
- **Documentação completa:** `Paggo_Documentacao_Onboarding.html` (pasta `Paggo_designs/documentacao-onboarding`)

---

## 📋 Resumo
O assistente antigo (`src/components/auth/OnboardingWizard/*`, 5 passos, visual azul) foi **apagado** e
substituído por uma tela nova em `src/pages/Onboarding/`, com o visual roxo do login v5 / cadastro.
Abre sozinha logo depois do cadastro (`App.tsx`: enquanto `user.isConfigured` for `false`).

| Passo | Nome | Obrigatório? |
|---|---|---|
| 1 | Boas-vindas | — |
| 2 | Acessibilidade (tema, cores para daltonismo, tamanho da letra com prévia) | Pular |
| 3 | Renda mensal (valor, de onde vem, dia em que cai) | **Obrigatório** |
| 4 | Contas fixas + assinaturas (3 no grátis, convite Premium R$ 23,90/mês) | Pular |
| 5 | Limites por categoria (3 no grátis, sugestão pela renda, barra do mês) | Pular |
| 6 | Primeira meta (tipo, nome, valor, prazo, R$ por mês) | Pular |
| 7 | Plano da IA (3 ações) + prévia do painel → **Abrir meu painel** | — |

25/11 (ajuste da Dev): o onboarding não tem a barra de ícones do topo (A−, A+, Aa, contraste, escuro),
porque a pessoa escolhe no passo 2; e não tem escolha de tipo de letra (vai para a tela de Configurações).
A data da meta usa um calendário próprio (`MonthPicker`), no lugar do calendário do navegador.

Sem back-end: o plano da IA é calculado no navegador (`buildAiPlan` em `onboardingData.ts`).
As respostas ficam num rascunho (`paggo_onboarding_draft_<id>`): recarregar a página não perde nada.

## 📁 Arquivos
| Arquivo | Alteração |
|---|---|
| `src/pages/Onboarding/OnboardingPage.tsx` | **Novo**: tela, navegação, Pular, rascunho, salvar perfil |
| `src/pages/Onboarding/OnboardingUi.tsx` | **Novo**: peças comuns (ícone, ✓, título, janela Premium) |
| `src/pages/Onboarding/onboardingData.ts` | **Novo**: catálogos, regras do plano grátis, contas, plano da IA, conversão para o painel |
| `src/pages/Onboarding/Onboarding.module.css` | **Novo**: estilos (desktop, celular, escuro, alto contraste) |
| `src/pages/Onboarding/steps/Step*.tsx` | **Novo**: um arquivo por passo (7) |
| `src/pages/Onboarding/MonthPicker.tsx` | **Novo**: calendário de mês/ano no visual roxo (passo 6) |
| `src/pages/Auth/authPrefs.ts` | Preferências ganham `palette` (+ `CHART_PALETTES`, `chartColors`, `savePrefs`) |
| `src/types/auth.ts` | `OnboardingAnswers` e `AiPlanAction`; perfil ganha `onboarding?` |
| `src/App.tsx` | Abre `OnboardingPage` no lugar do `OnboardingWizard` |
| `src/components/auth/OnboardingWizard/*` | **Apagado** (9 arquivos, inclusive `StepAccount.tsx` e `passwordRules.ts`) |
