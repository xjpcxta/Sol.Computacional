import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import {
  prepareSplitFlapFrame,
  SPLIT_FLAP_COLUMNS,
  SPLIT_FLAP_FRAMES,
} from './splitFlapMessages';

const ROTATION_INTERVAL_MS = 3_500;
const CHARACTER_STAGGER_MS = 30;
const ROW_STAGGER_MS = 50;

interface DisplayFrame {
  previous: number;
  current: number;
  cycle: number;
}

interface SplitFlapCellProps {
  current: string;
  previous: string;
  columnIndex: number;
  rowIndex: number;
  animate: boolean;
  cycle: number;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function SplitFlapCell({
  current,
  previous,
  columnIndex,
  rowIndex,
  animate,
  cycle,
}: SplitFlapCellProps) {
  const style = {
    '--flap-delay': `${(rowIndex * ROW_STAGGER_MS) + (columnIndex * CHARACTER_STAGGER_MS)}ms`,
  } as CSSProperties;

  return (
    <span className="split-flap-cell" style={style} aria-hidden="true">
      <span className="split-flap-half split-flap-half-top">
        <span className="split-flap-glyph split-flap-glyph-top">{current}</span>
      </span>
      <span className="split-flap-half split-flap-half-bottom">
        <span className="split-flap-glyph split-flap-glyph-bottom">{animate ? previous : current}</span>
      </span>

      {animate ? (
        <>
          <span
            key={`front-${cycle}`}
            className="split-flap-face split-flap-face-front"
          >
            <span className="split-flap-glyph split-flap-glyph-top">{previous}</span>
          </span>
          <span
            key={`back-${cycle}`}
            className="split-flap-face split-flap-face-back"
          >
            <span className="split-flap-glyph split-flap-glyph-bottom">{current}</span>
          </span>
        </>
      ) : null}
    </span>
  );
}

export function SplitFlapDisplay() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState<DisplayFrame>({
    previous: 0,
    current: 0,
    cycle: 0,
  });

  const advance = useCallback(() => {
    setFrame(({ current, cycle }) => ({
      previous: current,
      current: (current + 1) % SPLIT_FLAP_FRAMES.length,
      cycle: cycle + 1,
    }));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    let timeoutId: number;

    const scheduleNextFrame = () => {
      timeoutId = window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          advance();
          return;
        }

        scheduleNextFrame();
      }, ROTATION_INTERVAL_MS);
    };

    scheduleNextFrame();

    return () => window.clearTimeout(timeoutId);
  }, [advance, frame.cycle, prefersReducedMotion]);

  const shouldAnimate = frame.cycle > 0 && !prefersReducedMotion;
  const currentRows = prepareSplitFlapFrame(
    SPLIT_FLAP_FRAMES[frame.current].lines,
  );
  const previousRows = shouldAnimate
    ? prepareSplitFlapFrame(SPLIT_FLAP_FRAMES[frame.previous].lines)
    : currentRows;
  const boardStyle = {
    '--split-flap-columns': SPLIT_FLAP_COLUMNS,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={advance}
      className="split-flap-display"
      aria-label={`Avançar mensagem do display. Mensagem atual: ${SPLIT_FLAP_FRAMES[frame.current].label}`}
    >
      <span className="split-flap-board" style={boardStyle} aria-hidden="true">
        {currentRows.map((row, rowIndex) => (
          <span className="split-flap-row" key={`row-${rowIndex}`}>
            {row.map((character, columnIndex) => {
              const previousCharacter = previousRows[rowIndex]?.[columnIndex] ?? ' ';

              return (
                <SplitFlapCell
                  key={columnIndex}
                  current={character}
                  previous={previousCharacter}
                  columnIndex={columnIndex}
                  rowIndex={rowIndex}
                  animate={shouldAnimate && character !== previousCharacter}
                  cycle={frame.cycle}
                />
              );
            })}
          </span>
        ))}
      </span>
    </button>
  );
}
