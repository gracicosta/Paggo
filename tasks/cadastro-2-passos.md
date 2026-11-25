# Task: Tela de cadastro em 2 passos

- **ID:** `cadastro-2-passos`
- **Status:** `done`
- **Data:** 2026-11-25
- **Design de referência:** `design/cadastro/*.png` + `design/cadastro/html/cadastro.html` (pasta compartilhada do projeto)
- **Documentação completa:** `Paggo_Documentacao_Cadastro.html` (raiz do projeto)

---

## 📋 Resumo
O antigo "Criar conta" (nome, e-mail e senha no mesmo formulário do login) foi substituído por uma tela
própria de cadastro em **2 passos**, com o mesmo visual roxo do login v5:

1. **Sua conta:** Cadastrar com Google **ou** e-mail + senha (8+ caracteres, letra e número, medidor de força) + repetir senha.
2. **Sobre você:** nome completo, CPF (com máscara e dígito verificador), data de nascimento (18+),
   aceite dos Termos de Uso e da Política de Privacidade e **Criar minha conta**.

> 25/11: a pergunta "Quer as letras maiores ou menores?" (com prévia) foi **retirada do cadastro** a pedido da Dev.
> Ela fica só no onboarding. No cadastro continua a barra de acessibilidade (A−, A+, Aa, contraste, escuro).

Sem RG e sem renda: a renda é perguntada no onboarding financeiro, que abre logo depois.
Cada campo tem uma explicação curta embaixo; quando há erro, a explicação vira a mensagem de erro.

## 📁 Arquivos
| Arquivo | Alteração |
|---|---|
| `src/pages/Auth/SignupPage.tsx` | **Novo**: tela de cadastro em 2 passos |
| `src/pages/Auth/SignupPage.module.css` | **Novo**: estilos do cadastro (etapas, medidor, dicas, termos, celular) |
| `src/pages/Auth/signupValidation.ts` | **Novo**: regras de senha, nome, CPF e data de nascimento |
| `src/pages/Auth/authPrefs.ts` | **Novo**: preferências de acessibilidade compartilhadas (saíram do AuthPage) |
| `src/pages/Auth/AuthWidgets.tsx` | **Novo**: barra de acessibilidade e ícone do Google compartilhados |
| `src/pages/Auth/AuthPage.tsx` | Login ficou só com o login; "Criar conta grátis" abre o `SignupPage`. Google sem conta → cadastro no passo 2 |
| `src/context/AuthContext.tsx` | `register` aceita CPF, nascimento, aceite e origem; novos `isEmailRegistered` e `isCpfRegistered` |
| `src/types/auth.ts` | Novo tipo `SignupDetails` e campos opcionais em `AuthUser` |

Não alterados: `AuthPage.module.css`, `App.tsx`, onboarding e dashboard.
Obs.: `OnboardingWizard/StepAccount.tsx` e `passwordRules.ts` são sobras de uma versão anterior e não são usados por nada.

## ✅ Verificação
- `tsc -b`, `eslint` e `vite build` sem erros.
- Testado no navegador (1440×900 e celular 390×844), claro e escuro, alto contraste e Aa:
  erros de cada campo, e-mail já cadastrado, CPF inválido, menor de 18, termos sem aceite,
  aviso do Google sem Client ID, conta criada abrindo o onboarding, e login de teste ainda funcionando.
