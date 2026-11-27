import { motion } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { IconType } from 'react-icons';
import { LuCrown, LuLightbulb, LuPlus, LuReceipt, LuShieldCheck, LuSparkles, LuTarget, LuWallet } from 'react-icons/lu';
import { GoArrowRight } from 'react-icons/go';
import { FaAmazon, FaHouseChimney, FaQuestion } from 'react-icons/fa6';
import { PiAirplaneTiltFill, PiStudentBold, PiStudentFill } from 'react-icons/pi';
import { IoWaterOutline } from 'react-icons/io5';
import { TbWorld } from 'react-icons/tb';
import { SiNetflix, SiSpotify } from 'react-icons/si';
import { useAuth } from '../../context/AuthContext';
import { useFinance, useMonthFinance } from '../../context/FinanceContext';
import { ALL_CATEGORIES } from '../../data/transactionCategories';
import { CHART_MONTHS, PREMIUM_PRICE, userPlan } from '../../data/plans';
import type { FixedBillItem, PiggyBankItemModel } from '../../types/auth';
import { brl, pct, signedBrl } from '../../utils/format';
import { Pill } from '../../components/finance/Pill';
import { BalanceDelta, ExpenseCard, IncomeCard } from '../../components/finance/MonthCards';
import { fade } from '../../components/animations/fade';
import { seriesColor } from '../../utils/palette';
import type { PaletteId } from '../../types/prefs';
import styles from './Dashboard.module.css';

/** Meta de economia usada no bloco "Taxa de economia" (parte da renda que deveria sobrar). */
const SAVINGS_TARGET = 0.3;
/** Valor semanal sugerido no insight da IA. */
const WEEKLY_SAVING = 150;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Ícone da categoria (o mesmo da tela de Transações). */
const categoryIcon = (id: string): IconType => ALL_CATEGORIES.find((c) => c.id === id)?.icon ?? FaQuestion;

function goalIcon(title: string): IconType {
  const t = title.toLowerCase();
  if (t.includes('viagem') || t.includes('férias')) return PiAirplaneTiltFill;
  if (t.includes('casa') || t.includes('moradia')) return FaHouseChimney;
  if (t.includes('reserva') || t.includes('emergência') || t.includes('emergencia')) return LuShieldCheck;
  return PiStudentFill;
}

function billIcon(title: string): { icon: IconType; color: string; tone: string } {
  const t = title.toLowerCase();
  if (t.includes('faculdade') || t.includes('estudo') || t.includes('escola')) return { icon: PiStudentBold, color: '#dc2626', tone: 'red' };
  if (t.includes('internet') || t.includes('fibra') || t.includes('wifi')) return { icon: TbWorld, color: '#2563eb', tone: 'blue' };
  if (t.includes('luz') || t.includes('energia') || t.includes('enel')) return { icon: LuLightbulb, color: '#eab308', tone: 'yellow' };
  if (t.includes('água') || t.includes('agua') || t.includes('saneamento')) return { icon: IoWaterOutline, color: '#14b8a6', tone: 'teal' };
  return { icon: LuReceipt, color: '#8b5cf6', tone: 'purple' };
}

const SUB_ICONS: Record<string, { icon: IconType; color: string }> = {
  netflix: { icon: SiNetflix, color: '#e50914' },
  spotify: { icon: SiSpotify, color: '#1db954' },
  amazon: { icon: FaAmazon, color: '#ff9900' },
};

const BILL_ORDER: Record<FixedBillItem['status'], number> = { Vencido: 0, 'Vence hoje': 1, Pendente: 2 };

function billStatusText(bill: FixedBillItem) {
  if (bill.status === 'Vencido') return { text: `Vencido · dia ${String(bill.dueDay).padStart(2, '0')}`, cls: styles.textBad };
  if (bill.status === 'Vence hoje') return { text: 'Vence hoje', cls: styles.textWarn };
  return { text: `Vence dia ${String(bill.dueDay).padStart(2, '0')}`, cls: '' };
}

const GOAL_COLORS = ['#7c3aed', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899'];

/**
 * Página principal. As cores dos gráficos seguem a paleta escolhida no onboarding
 * (passo 2: padrão, vermelho e verde, azul e amarelo, alto contraste).
 */
export function Dashboard({
  month,
  palette = 'padrao',
  dark = false,
  onNewTransaction,
}: {
  month: string;
  palette?: PaletteId;
  dark?: boolean;
  /** "Nova transação" abre a tela de Transações. */
  onNewTransaction?: () => void;
}) {
  const [ringStart, ringEnd] =
    palette === 'padrao' ? ['#7c3aed', '#e879f9'] : [seriesColor(palette, dark, 0, ''), seriesColor(palette, dark, 0, '')];
  const { user } = useAuth();
  const { piggyBanks, fixedBills, subscriptions } = useFinance();
  // Gráfico de evolução: últimos 3 meses no plano grátis, o ano todo no Premium
  const plan = userPlan(user);
  const chartMonths = CHART_MONTHS[plan];
  // Entradas, saídas, saldo, limites e gráfico vêm das transações (as mesmas da tela de Transações)
  const summary = useMonthFinance(month, chartMonths);
  const { balance: currentBalance, savingsRate, categoryBudgets, series } = summary;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Visitante';

  // Evolução do saldo nos últimos meses, terminando no mês escolhido no topo
  const chartData = series.map((m) => ({ mes: m.label, saldo: m.saldo }));

  const topCategories = [...categoryBudgets]
    .sort((a, b) => b.spent / (b.limit || 1) - a.spent / (a.limit || 1))
    .slice(0, 5);

  const bills = [...fixedBills].sort((a, b) => BILL_ORDER[a.status] - BILL_ORDER[b.status] || a.dueDay - b.dueDay).slice(0, 4);
  const subsTotal = subscriptions.reduce((acc, s) => acc + (s.price || 0), 0);

  // Insight: a meta mais próxima de terminar com o valor semanal sugerido
  const openGoals = piggyBanks.filter((g) => g.goalAmount > g.savedAmount);
  const focusGoal: PiggyBankItemModel | undefined = [...openGoals].sort(
    (a, b) => a.goalAmount - a.savedAmount - (b.goalAmount - b.savedAmount),
  )[0];
  const weeksToGoal = focusGoal ? Math.ceil((focusGoal.goalAmount - focusGoal.savedAmount) / WEEKLY_SAVING) : 0;

  const monthName = month.split(' ')[0].toLowerCase();

  return (
    <main className={styles.main}>
      <motion.section {...fade(0)} className={styles.hello}>
        <div>
          <h1 className={styles.title}>
            {greeting()}, {firstName}
          </h1>
          <p className={styles.subtitle}>Sistema inteligente de análise financeira · {monthName}, num relance.</p>
        </div>
        <div className={styles.cta}>
          <button type="button" className={styles.btnSecondary} onClick={onNewTransaction}>
            <LuPlus size={17} /> Nova transação
          </button>
          <button type="button" className={styles.btnPrimary}>
            <LuSparkles size={17} /> Pedir plano à IA
          </button>
        </div>
      </motion.section>

      <section className={styles.bento}>
        {/* Saldo + evolução */}
        <motion.article {...fade(1)} className={styles.balance}>
          <span className={styles.balanceLabel}>
            <LuWallet size={17} /> Saldo do mês
          </span>
          <strong className={styles.balanceValue}>{signedBrl(currentBalance)}</strong>
          <div className={styles.chips}>
            <BalanceDelta summary={summary} />
            <Pill tone="hero">Sobrou {pct(savingsRate)} da renda</Pill>
            {plan === 'free' && (
              <Pill tone="hero" title={`No Premium (${PREMIUM_PRICE}/mês) o gráfico mostra os últimos 12 meses`}>
                <LuCrown size={13} aria-hidden="true" /> Ano todo no Premium
              </Pill>
            )}
          </div>
          <div className={styles.balanceChart}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="paggoBalance" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 12 }}
                  // 12 meses no celular não cabem: o Recharts esconde alguns rótulos para não encavalar
                  interval={chartData.length > 6 ? 'preserveStartEnd' : 0}
                  minTickGap={12}
                  padding={{ left: 14, right: 14 }}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeDasharray: '4 4' }}
                  formatter={(v) => [brl(Number(v)), 'Saldo']}
                  contentStyle={{ borderRadius: 12, border: 'none', background: '#17122b', color: '#fff', fontSize: 13 }}
                  labelStyle={{ color: '#c4b5fd', fontWeight: 700 }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="saldo" stroke="#fff" strokeWidth={3} fill="url(#paggoBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        {/* Entrou e Saiu: os mesmos cartões da tela de Transações */}
        <IncomeCard summary={summary} className={styles.kpi} motionProps={fade(2)} />
        <ExpenseCard summary={summary} className={styles.kpi} motionProps={fade(3)} />

        {/* Taxa de economia */}
        <motion.article {...fade(4)} className={`${styles.card} ${styles.savings}`}>
          <div className={styles.ring}>
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <defs>
                <linearGradient id="paggoRing">
                  <stop offset="0" stopColor={ringStart} />
                  <stop offset="1" stopColor={ringEnd} />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--track)" strokeWidth="3.6" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="url(#paggoRing)"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, savingsRate * 100)} 100`}
              />
            </svg>
            <b>{pct(savingsRate)}</b>
          </div>
          <div>
            <span className={styles.savingsLabel}>
              <LuTarget size={16} /> Taxa de economia
            </span>
            <p className={styles.savingsText}>
              Meta: <b>{pct(SAVINGS_TARGET)}</b>.{' '}
              {savingsRate >= SAVINGS_TARGET ? (
                <>
                  Você está <b className={styles.textOk}>acima da meta</b>.
                </>
              ) : (
                <>
                  Faltam <b className={styles.textWarn}>{pct(SAVINGS_TARGET - savingsRate)}</b> para chegar lá.
                </>
              )}
            </p>
          </div>
        </motion.article>

        {/* Insight da IA */}
        <motion.article {...fade(5)} className={`${styles.card} ${styles.insight}`}>
          <span className={styles.insightTag}>
            <LuSparkles size={15} /> INSIGHT DA IA
          </span>
          {focusGoal ? (
            <p>
              Se guardar <b>{brl(WEEKLY_SAVING, 0)}</b> por semana, o cofrinho <b>{focusGoal.title}</b> fica completo em{' '}
              <b>{weeksToGoal} {weeksToGoal === 1 ? 'semana' : 'semanas'}</b>.
            </p>
          ) : (
            <p>Todos os seus cofrinhos estão completos. Que tal criar uma nova meta?</p>
          )}
          <button type="button" className={styles.insightBtn}>
            Criar lembrete
          </button>
        </motion.article>

        {/* Limites por categoria */}
        <motion.article {...fade(6)} className={`${styles.card} ${styles.listCard}`}>
          <header className={styles.cardHead}>
            <h3>Limites por categoria</h3>
            <button type="button" className={styles.link}>
              Ver todos <GoArrowRight size={14} />
            </button>
          </header>
          {topCategories.map((c, i) => {
            const color = seriesColor(palette, dark, i, c.color);
            const Icon = categoryIcon(c.id);
            const used = c.limit ? c.spent / c.limit : 0;
            return (
              <div key={c.id} className={styles.cat}>
                <div className={styles.catHead}>
                  <span>
                    <Icon size={15} color={color} /> {c.name}
                  </span>
                  <small>{pct(used)}</small>
                </div>
                <div className={styles.bar} title={`${brl(c.spent)} de ${brl(c.limit)}`}>
                  <span style={{ width: `${Math.min(100, used * 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </motion.article>

        {/* Cofrinhos */}
        <motion.article {...fade(7)} className={`${styles.card} ${styles.listCard}`}>
          <header className={styles.cardHead}>
            <h3>Cofrinhos</h3>
            <button type="button" className={styles.link}>
              <LuPlus size={14} /> Nova meta
            </button>
          </header>
          {piggyBanks.slice(0, 3).map((g, i) => {
            const Icon = goalIcon(g.title);
            const color = seriesColor(palette, dark, i, g.progressColor || GOAL_COLORS[i % GOAL_COLORS.length]);
            const progress = g.goalAmount ? g.savedAmount / g.goalAmount : 0;
            return (
              <div key={g.id} className={styles.row}>
                <span className={styles.rowIcon} style={{ background: `${color}1f` }}>
                  <Icon size={19} color={color} />
                </span>
                <div className={styles.rowText}>
                  {g.title}
                  <small>
                    {brl(g.savedAmount, 0)} de {g.goalAmount.toLocaleString('pt-BR')}
                  </small>
                </div>
                <span className={styles.rowValue} style={{ color }}>
                  {pct(progress)}
                </span>
              </div>
            );
          })}
          {piggyBanks.length < 4 && (
            <div className={`${styles.row} ${styles.newRow}`}>
              <span className={`${styles.rowIcon} ${styles.toneSoft}`}>
                <LuPlus size={17} color="#7c3aed" />
              </span>
              <div className={`${styles.rowText} ${styles.muted}`}>
                Criar novo cofrinho
                <small>Ex.: carro, curso, casamento</small>
              </div>
            </div>
          )}
        </motion.article>

        {/* Boletos */}
        <motion.article {...fade(8)} className={`${styles.card} ${styles.listCard}`}>
          <header className={styles.cardHead}>
            <h3>Boletos a vencer</h3>
            <button type="button" className={styles.link}>
              Ver todos <GoArrowRight size={14} />
            </button>
          </header>
          {bills.length === 0 && <p className={styles.empty}>Nenhum boleto cadastrado.</p>}
          {bills.map((b) => {
            const { icon: Icon, color } = billIcon(b.title);
            const status = billStatusText(b);
            return (
              <div key={b.id} className={styles.row}>
                <span className={styles.rowIcon} style={{ background: `${color}1f` }}>
                  <Icon size={18} color={color} />
                </span>
                <div className={styles.rowText}>
                  {b.title}
                  <small className={status.cls}>{status.text}</small>
                </div>
                <span className={styles.rowValue}>{brl(b.value)}</span>
              </div>
            );
          })}
        </motion.article>

        {/* Assinaturas */}
        <motion.article {...fade(9)} className={`${styles.card} ${styles.listCard}`}>
          <header className={styles.cardHead}>
            <h3>Assinaturas</h3>
            <span className={styles.linkStatic}>{brl(subsTotal)}/mês</span>
          </header>
          <div className={styles.subs}>
            {subscriptions.slice(0, 3).map((s) => {
              const meta = SUB_ICONS[s.service] || { icon: LuSparkles, color: s.color || '#7c3aed' };
              const Icon = meta.icon;
              return (
                <div key={s.id} className={styles.sub}>
                  <span className={styles.subLogo}>
                    <Icon size={20} color={meta.color} />
                  </span>
                  <b>{s.name.split(' ')[0]}</b>
                  <small>{brl(s.price)}</small>
                </div>
              );
            })}
          </div>
          <div className={styles.row}>
            <span className={styles.rowIcon} style={{ background: '#eab3081f' }}>
              <LuSparkles size={17} color="#eab308" />
            </span>
            <div className={`${styles.rowText} ${styles.tip}`}>
              Suas assinaturas somam {brl(subsTotal * 12, 0)} por ano. Revise as que você não usa.
            </div>
          </div>
        </motion.article>
      </section>
    </main>
  );
}
