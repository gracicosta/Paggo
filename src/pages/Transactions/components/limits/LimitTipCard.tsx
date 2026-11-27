import { LuArrowLeftRight, LuLightbulb } from 'react-icons/lu';
import { brlInt } from '../../../../utils/format';
import type { LimitTip } from '../../limitUtils';
import styles from '../../Limits.module.css';

export interface LimitTipCardProps {
  tip: LimitTip;
  /** Botão da dica "mover": tira `amount` do limite de `fromId` e põe no de `toId`. */
  onMove: (fromId: string, toId: string, amount: number) => void;
}

/** "Dica do Paggo": uma sugestão em linguagem simples, conforme como os limites estão. */
export function LimitTipCard({ tip, onMove }: LimitTipCardProps) {
  let text: React.ReactNode;
  switch (tip.kind) {
    case 'move':
      text = (
        <>
          <b>{tip.over.label}</b> passou <b>{brlInt(tip.amount)}</b> do combinado. Que tal tirar esses {brlInt(tip.amount)} de{' '}
          <b>{tip.from.label}</b>, que ainda tem <b>{brlInt(tip.from.left)} sobrando</b>? Assim o mês fecha no azul.
        </>
      );
      break;
    case 'over':
      text = (
        <>
          <b>{tip.over.label}</b> passou <b>{brlInt(-tip.over.left)}</b> do combinado e nenhuma outra categoria tem sobra para
          cobrir. Segure os gastos de {tip.over.label.toLowerCase()} até o mês virar.
        </>
      );
      break;
    case 'warn':
      text =
        tip.row.left <= 0.5 ? (
          <>
            O limite de <b>{tip.row.label}</b> deste mês acabou. Se precisar gastar mais, aumente o limite ou tire o valor de
            outra categoria que esteja sobrando.
          </>
        ) : (
        <>
          <b>{tip.row.label}</b> já usou <b>{Math.round(tip.row.used * 100)}%</b> do limite.
          {tip.perDay > 0 ? (
            <>
              {' '}
              Gastando até <b>{brlInt(tip.perDay)} por dia</b>, você chega no fim do mês sem estourar.
            </>
          ) : null}
        </>
      );
      break;
    case 'ok':
      text = <>Todas as categorias estão dentro do combinado. Se sobrar no fim do mês, que tal guardar no cofrinho?</>;
      break;
    default:
      text = <>Comece criando um limite para a categoria em que você mais gasta. O Paggo avisa quando chegar perto.</>;
  }

  return (
    <section className={styles.tip} aria-labelledby="tip-title">
      <h2 id="tip-title">
        <LuLightbulb size={19} aria-hidden="true" /> Dica do Paggo
      </h2>
      <p>{text}</p>
      {tip.kind === 'move' && (
        <button type="button" onClick={() => onMove(tip.from.id, tip.over.id, tip.amount)}>
          <LuArrowLeftRight size={15} /> Mover {brlInt(tip.amount)} de {tip.from.label} para {tip.over.label}
        </button>
      )}
    </section>
  );
}
