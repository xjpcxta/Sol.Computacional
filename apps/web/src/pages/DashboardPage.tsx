import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CostProfile, Template } from '@pricefunc/shared';
import { HiOutlineRefresh } from 'react-icons/hi';
import {
  LatestBudgets,
  type SentBudgetSummary,
} from '../components/dashboard/LatestBudgets';
import { MetricOverview } from '../components/dashboard/MetricOverview';
import { RecentTemplates } from '../components/dashboard/RecentTemplates';
import { WorkflowShowcase } from '../components/dashboard/WorkflowShowcase';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const sentBudgets: readonly SentBudgetSummary[] = [];

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [costProfile, setCostProfile] = useState<CostProfile | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [costProfileError, setCostProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setTemplatesError(null);
    setCostProfileError(null);

    const [templatesResult, costProfileResult] = await Promise.allSettled([
      api.get<Template[]>('/templates'),
      api.get<CostProfile>('/cost-profile'),
    ]);

    if (templatesResult.status === 'fulfilled') {
      setTemplates(templatesResult.value.data);
    } else {
      setTemplatesError('Não foi possível consultar os arquétipos. Verifique a conexão com a API e tente novamente.');
    }

    if (costProfileResult.status === 'fulfilled') {
      setCostProfile(costProfileResult.value.data);
    } else {
      setCostProfileError('O perfil de custo está temporariamente indisponível. Os valores foram ocultados para evitar uma leitura incorreta.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const currentDate = useMemo(() => {
    const date = new Date();

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);

    return {
      machine: date.toISOString().slice(0, 10),
      human: formattedDate.charAt(0).toLocaleUpperCase('pt-BR') + formattedDate.slice(1),
    };
  }, []);

  return (
    <div className="space-y-12 pb-12 sm:space-y-16">
      <header className="grid gap-6 border-b border-line-subtle pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="eyebrow mb-3">Visão geral / workspace</p>
          <h1 className="max-w-[18ch] truncate font-display text-[clamp(2.75rem,5vw,4.5rem)] font-light leading-[0.98] tracking-[-0.05em]" title={`Olá, ${user?.username || 'usuário'}.`}>
            Olá, {user?.username || 'usuário'}.
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-7 text-text-secondary">
            Confira a base de estimativa antes de transformar um novo escopo em proposta.
          </p>
        </div>

        <div className="flex items-center gap-3 lg:pb-1">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          <time dateTime={currentDate.machine} className="font-mono text-xs text-text-secondary">
            {currentDate.human}
          </time>
        </div>
      </header>

      {costProfileError ? (
        <div role="alert" className="flex flex-col justify-between gap-4 rounded-panel border border-warning/25 bg-warning/[0.045] px-5 py-4 sm:flex-row sm:items-center">
          <p className="max-w-[80ch] text-sm leading-6 text-text-secondary">{costProfileError}</p>
          <Button onClick={() => void fetchData()} icon={<HiOutlineRefresh size={18} />} className="shrink-0 self-start sm:self-auto">
            Recarregar dados
          </Button>
        </div>
      ) : null}

      <div className="grid items-stretch gap-8 xl:grid-cols-[minmax(0,1.72fr)_minmax(320px,0.58fr)] xl:gap-6">
        <MetricOverview
          templateCount={templatesError ? undefined : templates.length}
          costProfile={costProfileError ? null : costProfile}
          loading={loading}
        />
        <LatestBudgets budgets={sentBudgets} />
      </div>

      <RecentTemplates
        templates={templates}
        loading={loading}
        error={templatesError}
        onRetry={() => void fetchData()}
      />

      <WorkflowShowcase />
    </div>
  );
}
