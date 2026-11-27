import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  LuBan,
  LuBot,
  LuCalendar,
  LuCheck,
  LuCreditCard,
  LuFileText,
  LuKeyRound,
  LuLock,
  LuMail,
  LuScale,
  LuShare2,
  LuSparkles,
  LuTarget,
  LuTrash2,
  LuUser,
} from 'react-icons/lu';
import styles from './LegalPage.module.css';

/**
 * Texto aprovado dos Termos de Uso e da Política de Privacidade
 * (fonte: design/Paggo_Termos_e_Privacidade_texto.html, revisão de 26/11/2026: sem RG, com senha).
 * Os e-mails de contato são fictícios (protótipo do hackathon).
 */

export type LegalDoc = 'termos' | 'privacidade';

export interface LegalSection {
  id: string;
  title: string;
  icon: IconType;
  body: ReactNode;
}

export interface SummaryCard {
  icon: IconType;
  title: string;
  text: string;
  tags: string[];
  /** Cor própria do ícone (a paleta de daltonismo pode trocar). */
  color: string;
}

export const LEGAL_UPDATED_AT = '25 de novembro de 2026';
export const LEGAL_VERSION = '1.0';

export const TERMS: LegalSection[] = [
  {
    id: 'aceite',
    title: 'Aceite destes termos',
    icon: LuCheck,
    body: (
      <p>
        Ao criar sua conta no Paggo, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não
        concordar, é só não usar o app.
      </p>
    ),
  },
  {
    id: 'quem-pode',
    title: 'Quem pode usar',
    icon: LuUser,
    body: (
      <p>
        O Paggo é para <b>maiores de 18 anos</b> com CPF válido. Cada pessoa pode ter uma única conta, e os dados
        informados no cadastro precisam ser verdadeiros.
      </p>
    ),
  },
  {
    id: 'conta',
    title: 'Sua conta e sua senha',
    icon: LuKeyRound,
    body: (
      <p>
        Você é responsável por manter sua senha em segredo. Se perceber algum acesso estranho, troque a senha e fale com a
        gente.
      </p>
    ),
  },
  {
    id: 'planos',
    title: 'Plano grátis e Premium',
    icon: LuCreditCard,
    body: (
      <p>
        O plano grátis tem os recursos principais. O <b>Premium custa R$ 23,90 por mês</b>, libera o plano de ação
        completo com IA e pode ser cancelado quando quiser, sem multa. Você usa até o fim do mês já pago.
      </p>
    ),
  },
  {
    id: 'ia',
    title: 'A IA orienta, você decide',
    icon: LuSparkles,
    body: (
      <div className={`${styles.callout} ${styles.calloutWarn}`}>
        As dicas do Paggo são educativas. Elas <b>não são consultoria financeira</b> nem recomendação de investimento. A
        decisão final é sempre sua.
      </div>
    ),
  },
  {
    id: 'proibido',
    title: 'O que não é permitido',
    icon: LuBan,
    body: (
      <p>
        Usar dados de outra pessoa, tentar invadir o sistema ou usar o app para atividades ilegais. Nesses casos a conta
        pode ser suspensa.
      </p>
    ),
  },
  {
    id: 'mudancas',
    title: 'Mudanças nos termos',
    icon: LuCalendar,
    body: <p>Se mudarmos algo importante, avisamos por e-mail e no app com pelo menos 15 dias de antecedência.</p>,
  },
  {
    id: 'contato',
    title: 'Contato',
    icon: LuMail,
    body: (
      <p>
        Dúvidas? Escreva para <a href="mailto:contato@paggo.com.br">contato@paggo.com.br</a>.
      </p>
    ),
  },
];

const DATA_ROWS: [string, string][] = [
  ['Nome completo', 'Identificar você no app'],
  ['CPF', 'Confirmar sua identidade e evitar contas falsas'],
  ['Data de nascimento', 'Confirmar que você tem 18 anos ou mais'],
  ['Renda mensal', 'Calcular saldo, limites e metas'],
  ['E-mail ou conta Google', 'Login e avisos importantes'],
  [
    'Senha',
    'Entrar na sua conta. Ela é guardada criptografada, então nem a equipe do Paggo consegue ver. Quem entra com o Google não cria senha no Paggo.',
  ],
];

export const PRIVACY: LegalSection[] = [
  {
    id: 'quem-somos',
    title: 'Quem somos',
    icon: LuUser,
    body: (
      <p>
        O Paggo é um app de organização financeira. Somos o <b>controlador</b> dos seus dados, ou seja, quem decide como
        eles são usados e quem responde por eles, conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
      </p>
    ),
  },
  {
    id: 'dados',
    title: 'Quais dados coletamos',
    icon: LuFileText,
    body: (
      <>
        <p>Pedimos só o necessário para criar sua conta e montar seus painéis:</p>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Dado</th>
              <th scope="col">Para que usamos</th>
            </tr>
          </thead>
          <tbody>
            {DATA_ROWS.map(([data, use]) => (
              <tr key={data}>
                <th scope="row">{data}</th>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Também guardamos o que você mesmo cadastra: receitas, despesas, categorias, metas, boletos e assinaturas.</p>
      </>
    ),
  },
  {
    id: 'uso',
    title: 'Para que usamos',
    icon: LuTarget,
    body: (
      <p>
        Usamos seus dados para criar e proteger sua conta, mostrar seus gráficos e metas, gerar seu plano de ação e
        cumprir obrigações legais. <b>Nunca vendemos seus dados</b> e não usamos sua renda para oferecer crédito.
      </p>
    ),
  },
  {
    id: 'ia',
    title: 'A IA não recebe seus dados pessoais',
    icon: LuBot,
    body: (
      <div className={styles.callout}>
        <b>Fique tranquilo:</b> o assistente de IA só recebe números e categorias sem identificação, como “Mercado: R$
        820”. Seu nome, CPF, e-mail e data de nascimento nunca são enviados para a IA.
      </div>
    ),
  },
  {
    id: 'compartilhamento',
    title: 'Com quem compartilhamos',
    icon: LuShare2,
    body: (
      <p>
        Só com serviços que fazem o app funcionar, como hospedagem segura e o login do Google, e sempre com contrato de
        proteção de dados. Autoridades só recebem dados quando a lei exigir.
      </p>
    ),
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    icon: LuScale,
    body: (
      <p>
        Pela LGPD você pode, a qualquer momento: ver quais dados temos, corrigir, baixar uma cópia, pedir a exclusão e
        retirar seu consentimento.
      </p>
    ),
  },
  {
    id: 'excluir',
    title: 'Como excluir sua conta',
    icon: LuTrash2,
    body: (
      <ol className={styles.steps}>
        <li>
          <span>
            Abra <b>Configurações</b> e toque em <b>Minha conta</b>.
          </span>
        </li>
        <li>
          <span>
            Toque em <b>Excluir conta</b> e confirme com sua senha.
          </span>
        </li>
        <li>
          <span>
            Pronto. Apagamos seus dados em até <b>30 dias</b>, exceto o que a lei manda guardar.
          </span>
        </li>
      </ol>
    ),
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    icon: LuLock,
    body: (
      <p>
        Usamos conexão criptografada (HTTPS), senhas protegidas com hash e acesso restrito à equipe. Se algo der errado,
        avisamos você e a ANPD.
      </p>
    ),
  },
  {
    id: 'contato',
    title: 'Fale com a gente',
    icon: LuMail,
    body: (
      <p>
        Encarregado de dados (DPO): <a href="mailto:privacidade@paggo.com.br">privacidade@paggo.com.br</a>. Respondemos
        em até 15 dias.
      </p>
    ),
  },
];

/** Resumo "Em 30 segundos" de cada documento (design opção B). */
export const SUMMARY: Record<LegalDoc, SummaryCard[]> = {
  termos: [
    {
      icon: LuUser,
      title: 'Para maiores de 18',
      text: 'Uma conta por pessoa, com CPF válido e dados verdadeiros.',
      tags: ['18+', 'CPF'],
      color: '#7c3aed',
    },
    {
      icon: LuCreditCard,
      title: 'Grátis ou Premium',
      text: 'O Premium custa R$ 23,90 por mês e você cancela quando quiser, sem multa.',
      tags: ['Sem multa'],
      color: '#0369a1',
    },
    {
      icon: LuSparkles,
      title: 'A IA orienta',
      text: 'As dicas são educativas. Não são consultoria financeira: quem decide é você.',
      tags: ['Educativo'],
      color: '#047857',
    },
    {
      icon: LuBan,
      title: 'Use com respeito',
      text: 'Nada de usar dados de outra pessoa ou tentar invadir o sistema.',
      tags: ['Regras'],
      color: '#be123c',
    },
  ],
  privacidade: [
    {
      icon: LuFileText,
      title: 'O que coletamos',
      text: 'Nome, CPF, nascimento, renda, e-mail e senha. Só o necessário.',
      tags: ['Nome', 'CPF', 'Renda'],
      color: '#7c3aed',
    },
    {
      icon: LuTarget,
      title: 'Para que usamos',
      text: 'Criar sua conta, confirmar 18+ e montar seus gráficos e metas.',
      tags: ['Conta', 'Metas'],
      color: '#0369a1',
    },
    {
      icon: LuBot,
      title: 'A IA não vê você',
      text: 'A IA recebe só valores e categorias, nunca nome ou documentos.',
      tags: ['Anônimo'],
      color: '#047857',
    },
    {
      icon: LuTrash2,
      title: 'Você manda',
      text: 'Baixe, corrija ou apague seus dados quando quiser, em Configurações.',
      tags: ['LGPD art. 18'],
      color: '#be123c',
    },
  ],
};

export const DOCS: Record<
  LegalDoc,
  { label: string; title: string; titleAccent: string; tag: string; intro: string; readTime: string; sections: LegalSection[] }
> = {
  termos: {
    label: 'Termos de Uso',
    title: 'Regras claras,',
    titleAccent: 'sem juridiquês.',
    tag: 'Termos de Uso',
    intro: 'Estas são as regras para usar o Paggo. Primeiro o resumo, depois os detalhes.',
    readTime: '3 min de leitura',
    sections: TERMS,
  },
  privacidade: {
    label: 'Privacidade',
    title: 'Sua privacidade,',
    titleAccent: 'sem juridiquês.',
    tag: 'Política de Privacidade · LGPD',
    intro: 'O que o Paggo guarda sobre você, para que serve e como apagar tudo quando quiser. Primeiro o resumo, depois os detalhes.',
    readTime: '4 min de leitura',
    sections: PRIVACY,
  },
};
