import { brl } from '../../utils/format';
import { Pill } from './Pill';

interface Props {
  /** Valor deste mês e do mês de comparação. */
  now: number;
  before: number;
  /** Subir é bom (entrou, saldo) ou ruim (saiu)? Define a cor; a seta mostra só a direção. */
  goodWhen: 'up' | 'down';
  /** Mês de comparação, em minúsculas: "outubro". */
  prevName: string;
  /** Explicação da comparação (aparece ao passar o mouse). */
  hint?: string;
  /** Texto depois do "·", ex.: "2 receitas". */
  detail?: string;
  /** Sobre o cartão roxo: selo branco, sem verde/vermelho. */
  onHero?: boolean;
}

/**
 * Selo de comparação com o mês anterior, igual em todas as telas e em todos os meses:
 * sempre a diferença em reais ("▲ R$ 3.050 vs setembro · 2 receitas"). Porcentagem não entra porque,
 * com pouco valor no mês anterior, ela dispara ("3050%") e não ajuda ninguém.
 */
export function DeltaBadge({ now, before, goodWhen, prevName, hint, detail, onHero = false }: Props) {
  const diff = now - before;
  const same = Math.round(Math.abs(diff)) === 0;
  const up = diff > 0;
  const good = same || (goodWhen === 'up' ? up : !up);
  const tail = detail ? ` · ${detail}` : '';
  if (same) {
    return (
      <Pill tone={onHero ? 'hero' : 'ok'} title={hint}>
        <span aria-hidden="true">=</span>
        <span>
          Igual a {prevName}
          {tail}
        </span>
      </Pill>
    );
  }
  return (
    <Pill tone={onHero ? 'hero' : good ? 'ok' : 'bad'} title={hint}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span>
        <span className="sr-only">{up ? 'Subiu' : 'Caiu'} </span>
        {brl(Math.abs(diff), 0)} vs {prevName}
        {tail}
      </span>
    </Pill>
  );
}
