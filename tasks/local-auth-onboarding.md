# Task: Sistema de Login e Onboarding Financeiro Realista

- **ID:** `local-auth-onboarding`
- **Provider:** `none` (Offline)
- **Status:** `done`
- **Created At:** 2026-11-22T15:03:00-03:00
- **Completed At:** 2026-11-22T15:17:00-03:00
- **Story Points:** 13 pts (Principal)

---

## 📋 Descrição
Implementação de tela de autenticação (Login / Cadastro) e fluxo assistente de Onboarding Financeiro em 5 etapas guiadas (Renda real, Contas fixas e assinaturas, Limites de gastos por categoria, Cofrinhos/Metas de economia e Resumo Geral). Integração com gerenciamento de estado local (LocalStorage) e alimentação dinâmica de todos os componentes do Dashboard.

## 🎲 Story Points & Estrutura
- **Subtask 1:** Interface de Autenticação (Login / Cadastro) — **3 pts** [CONCLUÍDO]
- **Subtask 2:** Assistente de Onboarding Financeiro (Wizard em 5 passos) — **5 pts** [CONCLUÍDO]
- **Subtask 3:** Gerenciamento de Estado & Persistência Local (Auth & Finance Context) — **3 pts** [CONCLUÍDO]
- **Subtask 4:** Conexão Dinâmica dos Dados no Dashboard — **2 pts** [CONCLUÍDO]
- **Total:** 13 pts

## 📊 Entregáveis
- `src/types/auth.ts`: Modelos de dados para autenticação e perfil financeiro completo.
- `src/context/AuthContext.tsx`: Provedor de autenticação com persistência em `localStorage`.
- `src/context/FinanceContext.tsx`: Camada de cálculo dinâmico de receitas, despesas e orçamentos.
- `src/pages/Auth/AuthPage.tsx`: Tela de login/cadastro moderna com suporte a demo account.
- `src/components/auth/OnboardingWizard/*`: Assistente financeiro em etapas.
- `src/App.tsx`, `NavBar.tsx`, `Dashboard.tsx`: Integração completa e botão de logout.
