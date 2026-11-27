export interface LoadingScreenProps {
  /** Texto mostrado no centro da tela. */
  message?: string;
}

/** Tela cheia de "carregando", usada enquanto o app descobre quem está logado. */
export function LoadingScreen({ message = 'Carregando Paggo...' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#38bdf8',
        fontSize: '1.1rem',
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}
