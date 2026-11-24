export interface RedactedProps {
  /** Largura da tarja (qualquer medida CSS). */
  width?: string;
  /** Texto lido por leitores de tela no lugar do conteúdo oculto. */
  label?: string;
  className?: string;
}

/**
 * Tarja que substitui um conteúdo oculto. O valor real não é renderizado,
 * portanto não pode ser selecionado, copiado ou lido pelo inspetor.
 * A cor é forçada na impressão para a tarja aparecer no PDF.
 */
export function Redacted({ width = '5rem', label, className = '' }: RedactedProps) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`inline-block h-[0.9em] max-w-full translate-y-[0.1em] rounded-[3px] bg-text-tertiary opacity-60 [-webkit-print-color-adjust:exact] [print-color-adjust:exact] ${className}`}
        style={{ width }}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}
