import type { Template } from '@pricefunc/shared';
import { HiOutlineChevronDown, HiOutlineCube } from 'react-icons/hi';
import { complexityLabels, functionTypeLabels } from '../../lib/functionPointLabels';
import { CategoryBadge, Panel } from '../ui';

interface ArchetypeCardProps {
  template: Template;
}

export function ArchetypeCard({ template }: ArchetypeCardProps) {
  return (
    <Panel className="group flex min-h-[300px] flex-col overflow-hidden">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle bg-white/[0.025] text-text-secondary">
            <HiOutlineCube aria-hidden="true" size={19} />
          </span>
          <div className="text-right">
            <p className="data-value font-mono text-3xl font-light text-accent">{template.totalPf}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">PF não ajustados</p>
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
            {template.components.length} {template.components.length === 1 ? 'componente' : 'componentes'}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary">
            Atualizado {new Intl.DateTimeFormat('pt-BR').format(new Date(template.updatedAt))}
          </span>
        </div>
      </div>

      <details className="border-t border-line-subtle open:bg-black/10">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:px-6 [&::-webkit-details-marker]:hidden">
          Ver memória de cálculo
          <HiOutlineChevronDown aria-hidden="true" className="transition-transform duration-base group-open:rotate-180" size={18} />
        </summary>
        <ol className="divide-y divide-line-subtle border-t border-line-subtle">
          {template.components.map((component) => (
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
      </details>
    </Panel>
  );
}
