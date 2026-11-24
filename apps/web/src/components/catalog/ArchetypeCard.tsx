import { useEffect, useId, useRef, useState } from 'react';
import { TemplateCalculationBasis, type Template } from '@pricefunc/shared';
import { HiOutlineChevronDown, HiOutlineCube, HiOutlinePencil } from 'react-icons/hi';
import { complexityLabels, functionTypeLabels } from '../../lib/functionPointLabels';
import { CategoryBadge, Panel } from '../ui';

interface ArchetypeCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
}

export function ArchetypeCard({ template, onEdit }: ArchetypeCardProps) {
  const isService = template.calculationBasis === TemplateCalculationBasis.SERVICE_HOURS;
  const [memoryOpen, setMemoryOpen] = useState(false);
  const memoryRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const memoryId = useId();

  useEffect(() => {
    if (!memoryOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!memoryRef.current?.contains(event.target as Node)) {
        setMemoryOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMemoryOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [memoryOpen]);

  return (
    <Panel className="flex min-h-[300px] flex-col">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle bg-white/[0.025] text-text-secondary">
              <HiOutlineCube aria-hidden="true" size={19} />
            </span>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(template)}
                aria-label={`Editar ${template.name}`}
                title="Editar arquétipo"
                className="flex h-10 items-center gap-1.5 rounded-button border border-line-subtle px-3 text-xs font-medium text-text-secondary transition-colors hover:border-line-strong hover:text-text-primary"
              >
                <HiOutlinePencil aria-hidden="true" size={15} />
                Editar
              </button>
            ) : null}
          </div>
          <div className="text-right">
            <p className="data-value font-mono text-3xl font-light text-accent">{isService ? template.serviceHours : template.totalPf}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">{isService ? 'horas estimadas' : 'PF não ajustados'}</p>
          </div>
        </div>

        <div className="mt-8">
          <CategoryBadge category={template.category} />
          <h2 className="mt-3 text-xl font-medium tracking-[-0.025em] text-text-primary">
            {template.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">{template.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line-subtle pt-5">
          <span className="font-mono text-[11px] text-text-tertiary">
            {isService ? template.serviceActivities.length : template.components.length} {isService ? 'atividades' : 'componentes'}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary">
            Atualizado {new Intl.DateTimeFormat('pt-BR').format(new Date(template.updatedAt))}
          </span>
        </div>
      </div>

      {/* A memória abre sobreposta aos demais cards para não alterar a altura da grade. */}
      <div ref={memoryRef} className="relative border-t border-line-subtle">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={memoryOpen}
          aria-controls={memoryId}
          onClick={() => setMemoryOpen((open) => !open)}
          className={`flex min-h-12 w-full items-center justify-between rounded-b-panel px-5 text-left text-sm font-medium transition-colors hover:text-text-primary sm:px-6 ${memoryOpen ? 'bg-black/10 text-text-primary' : 'text-text-secondary'}`}
        >
          Ver memória de cálculo
          <HiOutlineChevronDown
            aria-hidden="true"
            className={`transition-transform duration-base ${memoryOpen ? 'rotate-180' : ''}`}
            size={18}
          />
        </button>

        {memoryOpen && (
          <div
            id={memoryId}
            className="absolute -inset-x-px top-full z-10 mt-1.5 max-h-[min(360px,60vh)] overflow-y-auto overscroll-contain rounded-panel border border-line bg-overlay shadow-overlay"
          >
            <ol className="divide-y divide-line-subtle">
              {isService ? template.serviceActivities.map((activity) => (
                <li key={activity.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">{activity.name}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{activity.description}</p>
                    </div>
                    <span className="data-value shrink-0 font-mono text-xs text-accent">{activity.estimatedHours} h</span>
                  </div>
                </li>
              )) : template.components.map((component) => (
                <li key={component.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">{component.name}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{component.description}</p>
                    </div>
                    <span className="data-value shrink-0 font-mono text-xs text-accent">
                      {component.totalPf} PF
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[10px] text-text-tertiary">
                    {component.quantity} × {functionTypeLabels[component.functionType]} · {complexityLabels[component.complexity]} · {component.unitPf} PF/un.
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Panel>
  );
}
