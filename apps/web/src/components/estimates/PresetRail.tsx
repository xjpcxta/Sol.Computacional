import { useCallback, useEffect, useRef, useState } from 'react';
import type { EstimatePreset, EstimatePresetKey } from '@pricefunc/shared';
import { HiOutlineCheck, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

interface PresetRailProps {
  presets: readonly EstimatePreset[];
  activePreset: EstimatePresetKey | null;
  onSelect: (key: EstimatePresetKey) => void;
}

export function PresetRail({ presets, activePreset, onSelect }: PresetRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanGoBack(rail.scrollLeft > 2);
    setCanGoForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateControls();
    const rail = railRef.current;
    if (!rail) return undefined;
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [presets.length, updateControls]);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({
      left: rail.clientWidth * 0.82 * direction,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} disabled={!canGoBack} aria-label="Ver pontos de partida anteriores" className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle text-text-secondary hover:border-line hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30">
          <HiOutlineChevronLeft aria-hidden="true" size={19} />
        </button>
        <button type="button" onClick={() => move(1)} disabled={!canGoForward} aria-label="Ver próximos pontos de partida" className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle text-text-secondary hover:border-line hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30">
          <HiOutlineChevronRight aria-hidden="true" size={19} />
        </button>
      </div>
      <div ref={railRef} onScroll={updateControls} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {presets.map((preset, index) => {
          const selected = activePreset === preset.key;
          return (
            <button key={preset.key} type="button" aria-pressed={selected} onClick={() => onSelect(preset.key)} className={`min-h-[166px] w-[min(82vw,310px)] shrink-0 snap-start rounded-panel border p-5 text-left transition-[border-color,background-color,transform] duration-base hover:-translate-y-0.5 sm:w-[290px] ${selected ? 'border-accent/50 bg-accent-soft' : 'border-line-subtle bg-white/[0.018] hover:border-line-strong hover:bg-white/[0.03]'}`}>
              <div className="flex items-start justify-between gap-4">
                <span className={`font-mono text-[10px] ${selected ? 'text-accent' : 'text-text-tertiary'}`}>{String(index + 1).padStart(2, '0')}</span>
                {selected ? <HiOutlineCheck aria-hidden="true" className="text-accent" size={18} /> : null}
              </div>
              <h3 className="mt-6 text-base font-medium text-text-primary">{preset.name}</h3>
              <p className="mt-2 text-xs leading-5 text-text-secondary">{preset.description}</p>
              <p className="mt-3 font-mono text-[10px] text-text-tertiary">{preset.templateIds.length} {preset.templateIds.length === 1 ? 'arquétipo' : 'arquétipos'}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
