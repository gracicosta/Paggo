import { useState } from 'react';
import { motion } from 'motion/react';
import { LuCheck, LuClock, LuLock, LuPiggyBank, LuPlus, LuTarget } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useMonthFinance } from '../../context/FinanceContext';
import { useGoals } from '../../hooks/useGoals';
import { useFontStep } from '../../hooks/useFontStep';
import { useToast } from '../../hooks/useToast';
import { PREMIUM_PRICE } from '../../data/plans';
import type { NewGoalInput } from '../../data/goalSummary';
import { brl, brlInt } from '../../utils/format';
import { MONTHS_LOWER, fromIsoDate } from '../../utils/dates';
import { fade } from '../../components/animations/fade';
import { SummaryCard } from '../../components/finance/SummaryCard';
import { Pill } from '../../components/finance/Pill';
import { Modal } from '../../components/ui/Modal';
import { UndoToast } from '../Transactions/components/UndoToast';
import { GoalCard } from './components/GoalCard';
import { DoneGoalRow } from './components/DoneGoalRow';
import { PremiumGoalSlot } from './components/PremiumGoalSlot';
import { FreePlanBar } from './components/FreePlanBar';
import { NewGoalPicker } from './components/NewGoalPicker';
import { NewGoalForm } from './components/NewGoalForm';
import { GoalMoveForm, type MoveMode } from './components/GoalMoveForm';
import { GoalPlanCard } from './components/GoalPlanCard';
import { GoalDeleteConfirm } from './components/GoalDeleteConfirm';
import { goalPlan, shortGoalTitle } from './goalPlan';
import txStyles from '../Transactions/Transactions.module.css';
import limStyles from '../Transactions/Limits.module.css';
import styles from './Goals.module.css';

const FADE = 0.3;
const fadeIn = (i: number) => fade(i, FADE);

type Filter = 'andamento' | 'concluidas';

/** Janelas: mexer no cofrinho (celular), criar meta, excluir meta ou aviso do Premium. */
type Dialog =
  | { mode: 'move'; id: number }
  | { mode: 'new'; typeId?: string }
  | { mode: 'delete'; id: number }
  | { mode: 'premium' }
  | null;

/** Abaixo desta largura o cartão "Mexer no cofrinho" some e o depósito abre numa janela (igual à aba Limites). */
const SIDE_CARD_QUERY = '(min-width: 1101px)';

export interface GoalsPageProps {
  /** Mês escolhido no topo ("Novembro 2026"). */
  month: string;
}

/**
 * Aba "Metas": cofrinhos das metas do ano (viagem, reserva, imóvel…), com progresso, prazo, quanto guardar por mês,
 * depositar/retirar, criar e excluir meta, e o "Plano do Paggo". No grátis cabem FREE_GOALS metas em andamento.
 * Os dados vêm do hook useGoals, o mesmo do cartão "Cofrinhos" do Dashboard.
 */
export function GoalsPage({ month }: GoalsPageProps) {
  const { user } = useAuth();
  const goals = useGoals(month);
  const { keys, totals, plan, canCreate, freeLimit } = goals;
  const { balance } = useMonthFinance(month);
  const font = useFontStep();
  const [toast, setToast, closeToast] = useToast<string>(() => 3500);

  const [filter, setFilter] = useState<Filter>('andamento');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<MoveMode>('deposit');
  const [dialog, setDialog] = useState<Dialog>(null);

  const { active, done } = totals;
  // Cartão da direita: a meta escolhida, ou a que está mais atrás, ou a primeira
  const selected = active.find((g) => g.id === selectedId) ?? totals.behind[0] ?? active[0];
  const viewOf = (id: number) => goals.views.find((g) => g.id === id);

  const payday = user?.profile.onboarding?.payday ?? 5;
  const monthInGoals = goals.views.reduce((s, g) => s + g.inMonth, 0);
  const freeBalance = Math.max(0, balance - monthInGoals);
  const premium = plan === 'premium';

  // ---------- Ações ----------
  const sideCard = () => window.matchMedia(SIDE_CARD_QUERY).matches;

  const openMove = (id: number, next: MoveMode) => {
    setSelectedId(id);
    setMode(next);
    if (!sideCard()) setDialog({ mode: 'move', id });
    else document.getElementById('move-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const confirmMove = (id: number, amount: number) => {
    const g = viewOf(id);
    if (!g) return;
    if (mode === 'deposit') {
      goals.deposit(id, amount);
      setToast(g.saved + amount >= g.target ? `Meta ${g.title} completa! Parabéns!` : `${brlInt(amount)} guardados em ${g.title}.`);
    } else {
      goals.withdraw(id, amount);
      setToast(`${brlInt(amount)} retirados de ${g.title}.`);
    }
    setMode('deposit');
    setDialog(null);
  };

  const newGoal = (typeId?: string) => setDialog(canCreate ? { mode: 'new', typeId } : { mode: 'premium' });

  const createGoal = (input: NewGoalInput) => {
    const id = goals.create(input);
    if (id === null) {
      setDialog({ mode: 'premium' });
      return;
    }
    setSelectedId(id);
    setFilter('andamento');
    setDialog(null);
    setToast(`Meta ${input.title} criada. Agora é só guardar um pouco por mês!`);
  };

  const deleteGoal = (id: number) => {
    const g = viewOf(id);
    goals.remove(id);
    setDialog(null);
    if (selectedId === id) setSelectedId(null);
    if (g) setToast(`Meta ${g.title} excluída.`);
  };

  const openPremium = () => setDialog({ mode: 'premium' });

  const moveForm = (inDialog: boolean) =>
    selected && (
      <GoalMoveForm
        key={`${selected.id}-${mode}-${selected.saved}`}
        goal={selected}
        mode={mode}
        onModeChange={setMode}
        freeBalance={freeBalance}
        monthName={keys.name}
        onConfirm={(amount) => confirmMove(selected.id, amount)}
        onCancel={inDialog ? () => setDialog(null) : undefined}
        autoFocus={inDialog}
      />
    );

  const lastDone = done[0];
  const behindFirst = totals.behind[0];

  return (
    <main className={txStyles.page} style={{ fontSize: `${font.fontSizePx}px` }}>
      <motion.section {...fadeIn(0)} className={txStyles.head}>
        <div>
          <h1 className={txStyles.title}>Suas metas</h1>
          <p className={txStyles.subtitle}>Junte dinheiro para o que importa, um pouquinho por mês. O Paggo mostra o caminho.</p>
        </div>
        <div className={txStyles.cta}>
          {selected && (
            <button type="button" className={txStyles.btnSecondary} onClick={() => openMove(selected.id, 'deposit')}>
              <LuPlus size={17} /> Depositar
            </button>
          )}
          <button type="button" className={txStyles.btnPrimary} onClick={() => newGoal()}>
            {canCreate ? <LuTarget size={18} /> : <LuLock size={17} />} Nova meta
          </button>
        </div>
      </motion.section>

      {/* ---------- Resumo ---------- */}
      <section className={txStyles.kpis} aria-label="Resumo das metas">
        <SummaryCard title="Guardado nas metas" icon={LuPiggyBank} hero value={brl(totals.saved)} className={txStyles.kpi} motionProps={fadeIn(1)}>
          <span className={limStyles.meter} aria-hidden="true">
            <span style={{ width: `${Math.min(100, totals.progress * 100)}%` }} />
          </span>
          <Pill tone="hero">
            {Math.round(totals.progress * 100)}% de {brlInt(totals.target)} · {active.length} {active.length === 1 ? 'meta' : 'metas'}
          </Pill>
        </SummaryCard>
        <SummaryCard
          title={`Guardar em ${keys.name}`}
          icon={LuTarget}
          tone="ok"
          value={
            <>
              {brlInt(totals.inMonth)} <small className={styles.kpiOf}>de {brlInt(totals.planned)}</small>
            </>
          }
          className={txStyles.kpi}
          motionProps={fadeIn(2)}
        >
          <Pill tone={totals.inMonth >= totals.planned ? 'ok' : 'warn'}>
            {totals.planned === 0
              ? 'Nenhuma meta com prazo'
              : totals.inMonth >= totals.planned
                ? 'Combinado do mês guardado!'
                : `Faltam ${brlInt(totals.planned - totals.inMonth)}`}
          </Pill>
        </SummaryCard>
        <SummaryCard
          title="Metas no ritmo"
          icon={LuClock}
          tone="warn"
          value={`${totals.onTrack} de ${active.length}`}
          className={txStyles.kpi}
          motionProps={fadeIn(3)}
        >
          {behindFirst ? (
            <Pill tone="warn">
              {shortGoalTitle(behindFirst.title)} está um pouco atrás
              {totals.behind.length > 1 && ` e mais ${totals.behind.length - 1}`}
            </Pill>
          ) : (
            <Pill tone="ok">{active.length ? 'Todas no ritmo' : 'Crie sua primeira meta'}</Pill>
          )}
        </SummaryCard>
        <SummaryCard
          title="Já conquistou"
          icon={LuCheck}
          tone="info"
          value={`${done.length} ${done.length === 1 ? 'meta' : 'metas'}`}
          className={txStyles.kpi}
          motionProps={fadeIn(4)}
        >
          <Pill tone="info">
            {lastDone
              ? `${lastDone.title}${lastDone.completedAt ? ` · em ${MONTHS_LOWER[fromIsoDate(lastDone.completedAt).getMonth()]}` : ''}`
              : 'A primeira vem aí'}
          </Pill>
        </SummaryCard>
      </section>

      <div className={txStyles.grid}>
        <div className={txStyles.side}>
          {/* ---------- Cofrinhos ---------- */}
          <motion.section {...fadeIn(5)} className={`${txStyles.card} ${styles.goals}`} aria-labelledby="goals-title">
            <header className={styles.goalsHead}>
              <h2 id="goals-title">Seus cofrinhos</h2>
              <div className={txStyles.seg} role="radiogroup" aria-label="Mostrar">
                <button
                  type="button"
                  role="radio"
                  aria-checked={filter === 'andamento'}
                  className={filter === 'andamento' ? txStyles.segOn : ''}
                  onClick={() => setFilter('andamento')}
                >
                  Em andamento · {active.length}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={filter === 'concluidas'}
                  className={filter === 'concluidas' ? txStyles.segOn : ''}
                  onClick={() => setFilter('concluidas')}
                >
                  Concluídas · {done.length}
                </button>
              </div>
              <span className={styles.goalsNote}>Cada meta tem o seu próprio cofrinho</span>
            </header>

            {filter === 'andamento' ? (
              <>
                <div className={styles.goalGrid}>
                  {active.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      selected={g.id === selected?.id}
                      onDeposit={(id) => openMove(id, 'deposit')}
                      onWithdraw={(id) => openMove(id, 'withdraw')}
                      onDelete={(id) => setDialog({ mode: 'delete', id })}
                    />
                  ))}
                  {canCreate ? (
                    <button type="button" className={styles.addGoal} onClick={() => newGoal()}>
                      <span className={limStyles.limitIcon} aria-hidden="true">
                        <LuPlus size={22} />
                      </span>
                      <b>Criar nova meta</b>
                      <small>Viagem, reserva, imóvel, carro, estudos...</small>
                    </button>
                  ) : (
                    <PremiumGoalSlot freeLimit={freeLimit} onUpgrade={openPremium} />
                  )}
                </div>
                {!premium && <FreePlanBar used={active.length} limit={freeLimit} onUpgrade={openPremium} />}
                {lastDone && (
                  <ul className={styles.doneList}>
                    <DoneGoalRow goal={lastDone} />
                  </ul>
                )}
              </>
            ) : done.length ? (
              <ul className={styles.doneList}>
                {done.map((g) => (
                  <DoneGoalRow key={g.id} goal={g} />
                ))}
              </ul>
            ) : (
              <p className={`${txStyles.muted} ${styles.empty}`}>
                Nenhuma meta concluída ainda. Quando um cofrinho chegar no valor, ele aparece aqui.
              </p>
            )}
          </motion.section>

          {/* ---------- Nova meta (computador) ---------- */}
          <motion.section {...fadeIn(6)} className={`${txStyles.card} ${styles.newCard}`} aria-labelledby="new-goal-title">
            <header className={txStyles.cardHead}>
              <h2 id="new-goal-title">Nova meta</h2>
              <span className={txStyles.badge}>3 passos</span>
            </header>
            <p className={txStyles.muted}>O que você quer conquistar? Depois é só dizer quanto e até quando.</p>
            <NewGoalPicker onPick={newGoal} />
            {!canCreate && (
              <p className={limStyles.hint}>
                <LuLock size={16} aria-hidden="true" />
                <span>
                  Suas {freeLimit} metas grátis já estão em uso. Conclua uma ou vire <b>Premium</b> para criar mais.
                </span>
              </p>
            )}
          </motion.section>
        </div>

        {/* ---------- Coluna da direita ---------- */}
        <aside className={txStyles.side}>
          {selected && (
            <motion.section id="move-card" {...fadeIn(6)} className={`${txStyles.card} ${styles.moveCard}`} aria-labelledby="move-title">
              <header className={txStyles.cardHead}>
                <h2 id="move-title">Mexer no cofrinho</h2>
                <span className={txStyles.badge}>{shortGoalTitle(selected.title)}</span>
              </header>
              {moveForm(false)}
            </motion.section>
          )}
          {selected && (
            <motion.div {...fadeIn(7)}>
              <GoalPlanCard
                title={shortGoalTitle(selected.title)}
                steps={goalPlan(selected, { payday, monthName: keys.name })}
                premium={premium}
                onChat={() => (premium ? setToast('O chat com o Paggo chega em breve.') : openPremium())}
              />
            </motion.div>
          )}
        </aside>
      </div>

      <div className={txStyles.a11y} role="group" aria-label="Tamanho da letra">
        Tamanho da letra:
        <button type="button" onClick={() => font.changeFont(-1)} disabled={!font.canDecrease} aria-label="Diminuir letra">
          A−
        </button>
        <button type="button" onClick={() => font.changeFont(1)} disabled={!font.canIncrease} aria-label="Aumentar letra">
          A+
        </button>
      </div>

      {/* Celular e tablet: nova meta pelo botão "+" */}
      <button type="button" className={txStyles.fab} onClick={() => newGoal()} aria-label="Nova meta">
        <LuPlus size={28} />
      </button>

      {dialog?.mode === 'move' && selected && (
        <Modal title="Mexer no cofrinho" onClose={() => setDialog(null)}>
          {moveForm(true)}
        </Modal>
      )}

      {dialog?.mode === 'new' && (
        <Modal title="Nova meta" onClose={() => setDialog(null)}>
          <NewGoalForm initialType={dialog.typeId} onSave={createGoal} onCancel={() => setDialog(null)} />
        </Modal>
      )}

      {dialog?.mode === 'delete' &&
        (() => {
          const g = viewOf(dialog.id);
          return g ? <GoalDeleteConfirm goal={g} onConfirm={() => deleteGoal(g.id)} onCancel={() => setDialog(null)} /> : null;
        })()}

      {dialog?.mode === 'premium' && (
        <Modal title="Metas ilimitadas no Premium" size="sm" onClose={() => setDialog(null)}>
          <div className={styles.premiumBox}>
            <p className={txStyles.muted}>
              No plano grátis cabem <b>{freeLimit} metas</b> em andamento ao mesmo tempo. Com o Premium ({PREMIUM_PRICE}/mês)
              você cria quantas quiser e conversa com o Paggo sobre cada uma.
            </p>
            <p className={txStyles.muted}>O pagamento do Premium ainda não está disponível neste protótipo.</p>
            <div className={txStyles.formActions}>
              <button type="button" className={txStyles.btnPrimary} onClick={() => setDialog(null)} data-autofocus>
                Entendi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <UndoToast text={toast} onClose={closeToast} />}
    </main>
  );
}
