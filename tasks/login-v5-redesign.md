# Task: Nova tela de login (design v5)

- **ID:** `login-v5-redesign`
- **Status:** `done`
- **Data:** 2026-11-23
- **Design de referência:** `design/Paggo_Login_v5_*.png` + `design/Paggo_Logo_espacada_limpa.png` (pasta compartilhada do projeto)

---

## 📋 Resumo
A tela de login antiga (abas "Entrar na Conta" / "Criar Perfil Financeiro") foi removida e substituída
pela nova tela do design v5: painel roxo da marca à esquerda (no celular, no topo) e formulário à direita,
com modo claro/escuro e barra de acessibilidade. Nada fora da tela de login foi alterado: `App.tsx`,
`AuthContext.tsx`, onboarding e dashboard continuam iguais. A nova tela usa as funções que já existiam
no `AuthContext` (`login`, `register`, `loginAsDemo`).

## 🔑 Como entrar (credenciais fictícias de teste)
| Campo  | Valor             |
|--------|-------------------|
| E-mail | `teste@paggo.com` |
| Senha  | `paggo123`        |

Entra com o perfil demonstrativo (Carlos Oliveira) direto no dashboard. Essas credenciais também aparecem
ao clicar em "Esqueci minha senha". Elas ficam no topo de `src/pages/Auth/AuthPage.tsx` (`TEST_CREDENTIALS`).

## 🟢 Login com Google
- Usa o Google Identity Services (pop-up OAuth 2.0), carregado só quando o botão é clicado.
- O Client ID vem da variável de ambiente **`VITE_GOOGLE_CLIENT_ID`**.
- **Sem a variável**, o botão mostra um aviso ("ainda não foi configurado") e o resto da tela funciona normal.
- Depois do login, o nome e o e-mail da conta Google são usados assim: se a conta já existe neste
  navegador, entra; se não, cria o perfil e leva para o onboarding financeiro.

### Como configurar
1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie uma credencial
   **ID do cliente OAuth** do tipo **Aplicativo da Web**.
2. Em **Origens JavaScript autorizadas**, adicione `http://localhost:5173` (e o domínio de produção quando houver).
3. Copie `.env.example` para `.env.local` e preencha `VITE_GOOGLE_CLIENT_ID=<seu client id>`.
4. Reinicie o `npm run dev`.

> Observação: o projeto ainda não tem back-end. Quando o Node.js/PostgreSQL entrar, o ideal é o
> servidor validar o token do Google e guardar o usuário no banco, em vez do `localStorage`.

## ✨ O que a tela tem
- Botão **Entrar com Google**, divisor "ou entre com seu e-mail", campos **E-mail** e **Senha** (com mostrar/ocultar).
- **Lembrar de mim**: guarda o e-mail para preencher na próxima visita (`paggo_remember_email`).
- **Esqueci minha senha**: mostra um aviso com as credenciais de teste (recuperação real ainda não existe).
- **Criar conta grátis**: troca para o formulário de cadastro (nome, e-mail, senha) e segue para o onboarding,
  como a tela antiga fazia.
- **Acessibilidade**: A− / A+ (tamanho do texto), Aa (fonte de leitura facilitada), alto contraste e modo escuro.
  As escolhas ficam salvas em `paggo_login_prefs` e o modo escuro inicial segue o sistema.
- Mensagens de erro em português, `aria-*` nos campos e botões, foco visível e respeito a "reduzir movimento".
- Responsivo: no celular (até 900px) o painel roxo vai para o topo com a barra de acessibilidade, como no design.

## 📁 Arquivos
| Arquivo | Alteração |
|---|---|
| `src/pages/Auth/AuthPage.tsx` | Reescrito: nova tela de login/cadastro |
| `src/pages/Auth/AuthPage.module.css` | Reescrito: estilos do design v5 (claro, escuro, alto contraste, celular) |
| `src/pages/Auth/googleAuth.ts` | Novo: login com Google via `VITE_GOOGLE_CLIENT_ID` |
| `src/assets/images/paggo-logo.png` | Novo: logo v5 (`Paggo_Logo_espacada_limpa.png`) |
| `src/assets/images/login-cofrinho.jpg` | Novo: foto do cofrinho recortada do design |
| `.env.example` | Novo: modelo da variável do Google |
| `tasks/login-v5-redesign.md` | Este registro |

Não foram alterados: `App.tsx`, `AuthContext.tsx`, `index.html`, onboarding, dashboard e demais componentes.

## 🔁 Trocar para a logo v4
Basta substituir `src/assets/images/paggo-logo.png` pelo arquivo `Paggo_Logo_limpa.png` (mesmo nome de destino).

## ✅ Verificação
- `tsc -b` e `eslint` sem erros.
- Testado no navegador (1440×900 e celular 375×812): modo claro/escuro, alto contraste, A+/Aa,
  erro com senha errada, login com `teste@paggo.com` / `paggo123` abrindo o dashboard, e aviso do Google sem Client ID.
