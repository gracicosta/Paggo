import { Fragment } from 'react';

/**
 * Texto com negrito marcado por ** **: "Separe **R$ 334** no dia 5" → Separe <b>R$ 334</b> no dia 5.
 * Usado nos planos da IA (onboarding e aba Metas), que são montados como texto simples.
 */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}
