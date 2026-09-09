import type { CostProfile } from '@pricefunc/shared';
import {
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineTemplate,
} from 'react-icons/hi';
import { Panel, Skeleton } from '../ui';

interface MetricOverviewProps {
  templateCount?: number;
  costProfile: CostProfile | null;
  loading: boolean;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

interface SupportingMetricProps {
  icon: typeof HiOutlineClock;
  label: string;
  value?: string;
  context: string;
  loading: boolean;
}

function SupportingMetric({
  icon: Icon,
  label,
  value,
  context,
  loading,
}: SupportingMetricProps) {
  return (
    <div className="grid min-h-[112px] grid-cols-[40px_minmax(0,1fr)] gap-4 border-b border-line-subtle px-5 py-5 last:border-b-0 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle bg-white/[0.025] text-text-secondary">
        <Icon aria-hidden="true" size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        {loading ? (
          <Skeleton width="132px" height="30px" className="mt-2" />
        ) : (
          <p className="data-value mt-1 text-2xl font-medium text-text-primary">{value ?? '—'}</p>
        )}
        <p className="mt-1 text-xs leading-5 text-text-tertiary">{context}</p>
      </div>
    </div>
  );
}

export function MetricOverview({ templateCount, costProfile, loading }: MetricOverviewProps) {
  return (
    <section
      aria-labelledby="metrics-heading"
      aria-busy={loading}
      className="flex h-full flex-col"
    >
      <div className="mb-5 flex min-h-[76px] flex-col justify-between gap-3 sm:flex-row sm:items-end xl:min-h-[96px]">
        <div>
          <p className="eyebrow mb-2">Calibração atual</p>
          <h2 id="metrics-heading" className="font-display text-2xl font-normal tracking-[-0.035em] sm:text-3xl">
            O modelo em uma leitura.
          </h2>
        </div>
        <p className="max-w-[42ch] text-sm leading-6 text-text-secondary sm:text-right">
          Catálogo disponível e parâmetros que orientam o cálculo.
        </p>
      </div>

      <div className="grid min-h-[336px] flex-1 overflow-hidden rounded-panel border border-line-subtle bg-white/[0.018] lg:grid-cols-[1.12fr_0.88fr]">
        <Panel tone="accent" crosshair className="min-h-[336px] rounded-none border-0 border-b border-line-subtle p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="flex h-full flex-col justify-between">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-button border border-accent/25 bg-accent-soft text-accent">
                <HiOutlineTemplate aria-hidden="true" size={21} />
              </span>
              <p className="mt-10 text-sm font-medium text-text-secondary">Arquétipos disponíveis</p>
              {loading ? (
                <Skeleton width="156px" height="72px" className="mt-3" />
              ) : (
                <p className="data-value mt-2 text-[clamp(4.5rem,10vw,7rem)] font-light leading-none text-accent">
                  {templateCount ?? '—'}
                </p>
              )}
              <p className="mt-4 max-w-[38ch] text-sm leading-6 text-text-secondary">
                Blocos de funcionalidade prontos para compor novos escopos.
              </p>
            </div>

            <div aria-hidden="true" className="mt-10 flex h-8 items-end gap-2 border-b border-accent/25">
              {Array.from({ length: 18 }, (_, index) => (
                <span
                  key={index}
                  className={`w-px bg-accent/35 ${index % 5 === 0 ? 'h-6' : index % 2 === 0 ? 'h-4' : 'h-2'}`}
                />
              ))}
            </div>
          </div>
        </Panel>

        <div className="divide-y-0">
          <SupportingMetric
            icon={HiOutlineCurrencyDollar}
            label="Valor por hora"
            value={costProfile ? currencyFormatter.format(costProfile.hourlyRate) : undefined}
            context="Base monetária do perfil de custo."
            loading={loading}
          />
          <SupportingMetric
            icon={HiOutlineClock}
            label="Produtividade média"
            value={costProfile ? `${numberFormatter.format(costProfile.hoursPerPf)} h/PF` : undefined}
            context="Horas previstas por Ponto de Função."
            loading={loading}
          />
          <SupportingMetric
            icon={HiOutlineShieldCheck}
            label="Margem de risco"
            value={costProfile ? `${numberFormatter.format(costProfile.riskMargin)}%` : undefined}
            context="Margem aplicada sobre a estimativa-base."
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
