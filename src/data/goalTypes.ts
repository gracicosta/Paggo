import type { IconType } from 'react-icons';
import { LuGraduationCap, LuPiggyBank, LuPlus, LuShieldCheck } from 'react-icons/lu';
import { FaCarSide, FaHouseChimney, FaRing } from 'react-icons/fa6';
import { PiAirplaneTiltFill } from 'react-icons/pi';
import type { PiggyBankItemModel } from '../types/auth';

export interface GoalTypeInfo {
  id: string;
  label: string;
  emoji: string;
  /** Valor sugerido para a meta. */
  amount: number;
  /** "você viaja em…", "sua reserva fica pronta em…" */
  verb: string;
  color: string;
  icon: IconType;
}

/** Tipos de meta. Usados no passo 6 do onboarding, na aba Metas e no cartão "Cofrinhos" do Dashboard. */
export const GOAL_TYPES: GoalTypeInfo[] = [
  { id: 'viagem', label: 'Viagem', emoji: '✈️', amount: 4000, verb: 'você viaja em', color: '#7C3AED', icon: PiAirplaneTiltFill },
  { id: 'reserva', label: 'Reserva de emergência', emoji: '🛟', amount: 6000, verb: 'sua reserva fica pronta em', color: '#22C55E', icon: LuShieldCheck },
  { id: 'casa', label: 'Casa própria', emoji: '🏡', amount: 30000, verb: 'você junta a entrada em', color: '#6D28D9', icon: FaHouseChimney },
  { id: 'carro', label: 'Carro', emoji: '🚗', amount: 15000, verb: 'você chega lá em', color: '#F97316', icon: FaCarSide },
  { id: 'estudos', label: 'Estudos', emoji: '🎓', amount: 3000, verb: 'você começa a estudar em', color: '#F59E0B', icon: LuGraduationCap },
  { id: 'casamento', label: 'Casamento', emoji: '💍', amount: 20000, verb: 'você chega lá em', color: '#E11D48', icon: FaRing },
  { id: 'guardar', label: 'Guardar dinheiro', emoji: '🐷', amount: 2000, verb: 'você completa a meta em', color: '#0F766E', icon: LuPiggyBank },
  { id: 'outra', label: 'Outra', emoji: '➕', amount: 1000, verb: 'você chega lá em', color: '#7C3AED', icon: LuPlus },
];

/** Tipos mostrados no atalho "Nova meta" da aba Metas (os outros aparecem dentro do formulário). */
export const QUICK_GOAL_TYPES = ['viagem', 'reserva', 'casa', 'carro', 'estudos', 'outra'];

const OTHER = GOAL_TYPES[GOAL_TYPES.length - 1];

export const goalTypeById = (id: string | undefined) => GOAL_TYPES.find((g) => g.id === id);

/** Tipo de um cofrinho: o salvo em `iconType` ou, em cofrinhos antigos, adivinhado pelo nome. */
export function goalTypeOf(goal: Pick<PiggyBankItemModel, 'iconType' | 'title'>): GoalTypeInfo {
  const saved = goalTypeById(goal.iconType);
  if (saved) return saved;
  const t = goal.title.toLowerCase();
  const guess = (id: string) => goalTypeById(id) ?? OTHER;
  if (t.includes('viagem') || t.includes('férias')) return guess('viagem');
  if (t.includes('reserva') || t.includes('emergência') || t.includes('emergencia')) return guess('reserva');
  if (t.includes('casa') || t.includes('apê') || t.includes('apartamento') || t.includes('imóvel') || t.includes('moradia')) return guess('casa');
  if (t.includes('carro') || t.includes('moto')) return guess('carro');
  if (t.includes('estudo') || t.includes('curso') || t.includes('faculdade')) return guess('estudos');
  if (t.includes('casamento')) return guess('casamento');
  return guess('guardar');
}
