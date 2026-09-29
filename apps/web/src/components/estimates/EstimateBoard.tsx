import {
  EstimateItemKind,
  type CostProfile,
  type FunctionPointWeightMatrix,
} from '@pricefunc/shared';
import {
  HiOutlineClipboardList,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi';
import { complexityLabels } from '../../lib/functionPointLabels';
import {
  calculateBoardTotals,
  getBoardComponentPf,
  getBoardItemPf,
  type BoardItem,
} from '../../lib/estimateMath';

interface EstimateBoardProps {
  items: readonly BoardItem[];
  weights: FunctionPointWeightMatrix;
  costProfile: CostProfile;
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function EstimateBoard({
  items,
  weights,
  costProfile,
  onQuantityChange,
  onRemove,
}: EstimateBoardProps) {
  const totals = calculateBoardTotals(items, weights, costProfile);

  return (
    <section aria-labelledby="estimate-board-heading" className="estimate-board overflow-hidden rounded-panel border border-line-subtle bg-[#0d0f0d]/85 shadow-overlay">
      <div className="estimate-board-grid border-b border-line-subtle px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">Lousa da estimativa</p>
            <h2 id="estimate-board-heading" className="text-xl font-medium tracking-[-0.025em]">
              Escopo em composição
            </h2>
          </div>
          <span className="flex h-10 min-w-10 items-center justify-center rounded-button border border-accent/25 bg-accent-soft px-3 font-mono text-sm text-accent">
            {items.length}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="estimate-board-grid flex min-h-[360px] flex-col items-center justify-center px-7 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-button border border-line-subtle text-text-tertiary">
            <HiOutlineClipboardList aria-hidden="true" size={23} />
          </span>
          <h3 className="mt-5 text-lg font-medium">A lousa está limpa.</h3>
          <p className="mt-2 max-w-[38ch] text-sm leading-6 text-text-secondary">
            Aplique uma configuração inicial, escolha arquétipos ou registre uma função específica do cliente.
          </p>
        </div>
      ) : (
        <ol className="max-h-[620px] divide-y divide-line-subtle overflow-y-auto [scrollbar-gutter:stable]">
          {items.map((item, index) => (
            <li key={item.key} className="estimate-board-grid px-5 py-5 sm:px-6">
              <div className="flex items-start gap-4">
                <span className="pt-1 font-mono text-[10px] text-text-tertiary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-text-primary">{item.name}</h3>
                        {item.kind === EstimateItemKind.CUSTOM ? (
                          <span className="rounded-full border border-warning/25 bg-warning/[0.055] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-warning">
                            Personalizada
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 max-w-[58ch] text-xs leading-5 text-text-secondary">{item.description}</p>
                    </div>
                    <p className="data-value font-mono text-lg text-accent">
                      {getBoardItemPf(item, weights)} PF
                    </p>
                  </div>

                  <details className="group/details mt-4">
                    <summary className="cursor-pointer list-none font-mono text-[10px] text-text-tertiary hover:text-text-secondary [&::-webkit-details-marker]:hidden">
                      {item.components.length} {item.components.length === 1 ? 'componente contado' : 'componentes contados'} · ver memória
                    </summary>
                    <ul className="mt-3 space-y-2 border-l border-line-subtle pl-3">
                      {item.components.map((component) => (
                        <li key={component.key} className="text-xs leading-5 text-text-secondary">
                          <span className="text-text-primary">{component.name}</span>
                          {' · '}{component.functionType}/{complexityLabels[component.complexity]}
                          {' · '}{component.quantity * item.quantity} × {component.unitPf ?? weights[component.functionType][component.complexity]} PF
                          {' = '}{getBoardComponentPf(component, item.quantity, weights)} PF
                        </li>
                      ))}
                    </ul>
                  </details>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-3">
                    <div className="flex items-center rounded-button border border-line-subtle bg-black/15">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <HiOutlineMinus aria-hidden="true" size={15} />
                      </button>
                      <output className="data-value min-w-8 text-center font-mono text-xs text-text-primary" aria-label={`Quantidade ${item.quantity}`}>
                        {item.quantity}
                      </output>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.key, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <HiOutlinePlus aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.key)}
                      className="inline-flex min-h-9 items-center gap-2 text-xs text-text-tertiary hover:text-error"
                    >
                      <HiOutlineTrash aria-hidden="true" size={15} />
                      Retirar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="border-t border-line bg-black/20 px-5 py-5 sm:px-6" aria-live="polite">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Tamanho funcional</dt>
            <dd className="data-value font-mono text-text-primary">{numberFormatter.format(totals.totalPf)} PF</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Esforço estimado</dt>
            <dd className="data-value font-mono text-text-primary">{numberFormatter.format(totals.estimatedHours)} h</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Custo-base</dt>
            <dd className="data-value font-mono text-text-primary">{currencyFormatter.format(totals.baseCost)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Margem de risco ({numberFormatter.format(costProfile.riskMargin)}%)</dt>
            <dd className="data-value font-mono text-text-primary">{currencyFormatter.format(totals.riskAmount)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-end justify-between gap-5 border-t border-accent/20 pt-5">
          <div>
            <p className="eyebrow mb-1">Investimento estimado</p>
            <p className="text-xs text-text-tertiary">{numberFormatter.format(costProfile.hoursPerPf)} h/PF · {currencyFormatter.format(costProfile.hourlyRate)}/h</p>
          </div>
          <p className="data-value text-right font-mono text-[clamp(1.45rem,4vw,2rem)] font-medium text-accent">
            {currencyFormatter.format(totals.totalPrice)}
          </p>
        </div>
      </div>
    </section>
  );
}
