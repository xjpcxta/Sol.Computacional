import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { EstimateStatus, type Estimate } from '@pricefunc/shared';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlinePaperAirplane,
  HiOutlinePrinter,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { Button, Panel, Skeleton } from '../components/ui';
import { complexityLabels, functionTypeLabels } from '../lib/functionPointLabels';
import { api } from '../lib/api';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function reportErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'Esta estimativa não existe ou pertence a outro usuário.';
  }
  return 'Não foi possível carregar a memória de cálculo desta estimativa.';
}

export function EstimateReportPage() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadEstimate = useCallback(async () => {
    if (!id) {
      setError('Identificador da estimativa ausente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Estimate>(`/estimates/${id}`);
      setEstimate(response.data);
    } catch (requestError) {
      setError(reportErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEstimate();
  }, [loadEstimate]);

  const markAsSent = async () => {
    if (!estimate) return;
    setUpdatingStatus(true);
    try {
      const response = await api.patch<Estimate>(`/estimates/${estimate.id}/status`, {
        status: EstimateStatus.SENT,
      });
      setEstimate(response.data);
    } catch (requestError) {
      setError(reportErrorMessage(requestError));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5" aria-label="Carregando relatório">
        <Skeleton width="240px" height="44px" />
        <Skeleton shape="block" height="260px" />
        <Skeleton shape="block" height="420px" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <Panel className="flex min-h-[520px] flex-col items-center justify-center px-6 py-12 text-center" role="alert">
        <HiOutlineExclamationCircle aria-hidden="true" className="text-error" size={30} />
        <h1 className="mt-5 text-2xl font-medium">Relatório indisponível.</h1>
        <p className="mt-3 max-w-[50ch] text-sm leading-6 text-text-secondary">{error}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={() => void loadEstimate()} icon={<HiOutlineRefresh size={18} />}>Tentar novamente</Button>
          <Link to="/estimates" className="inline-flex min-h-11 items-center gap-2 rounded-button border border-line px-5 py-2.5 text-sm font-medium text-text-primary hover:border-line-strong">
            <HiOutlineArrowLeft aria-hidden="true" size={18} /> Voltar às estimativas
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="pb-12">
      <div className="print-hidden mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/estimates" className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-text-secondary hover:text-text-primary">
          <HiOutlineArrowLeft aria-hidden="true" size={18} /> Voltar à lousa
        </Link>
        <div className="flex flex-wrap gap-3">
          {estimate.status === EstimateStatus.DRAFT ? (
            <Button onClick={() => void markAsSent()} isLoading={updatingStatus} icon={<HiOutlinePaperAirplane size={18} />}>
              Marcar como enviado
            </Button>
          ) : null}
          <Button variant="primary" onClick={() => window.print()} icon={<HiOutlinePrinter size={18} />}>
            Imprimir ou salvar em PDF
          </Button>
        </div>
      </div>

      <article className="estimate-report mx-auto max-w-[1120px] overflow-hidden rounded-panel border border-line-subtle bg-[#121512]">
        <header className="estimate-report-header border-b border-line px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">PriceFunc · Memória de estimativa</p>
              <h1 className="mt-5 max-w-[17ch] font-display text-[clamp(2.35rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.05em]">
                {estimate.title}
              </h1>
              <p className="mt-4 text-lg text-text-secondary">{estimate.clientName}</p>
            </div>
            <div className="sm:text-right">
              <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${estimate.status === EstimateStatus.SENT ? 'border-success/30 bg-success/[0.06] text-success' : 'border-warning/30 bg-warning/[0.06] text-warning'}`}>
                {estimate.status === EstimateStatus.SENT ? 'Enviada' : 'Rascunho'}
              </span>
              <p className="mt-4 font-mono text-xs text-text-tertiary">#{estimate.id.slice(0, 8).toUpperCase()}</p>
              <p className="mt-1 text-xs text-text-tertiary">Criada em {dateFormatter.format(new Date(estimate.createdAt))}</p>
              {estimate.sentAt ? <p className="mt-1 text-xs text-text-tertiary">Enviada em {dateFormatter.format(new Date(estimate.sentAt))}</p> : null}
            </div>
          </div>
        </header>

        <section className="grid border-b border-line-subtle lg:grid-cols-2">
          <div className="border-b border-line-subtle px-6 py-7 sm:px-10 lg:border-b-0 lg:border-r">
            <p className="eyebrow mb-3">Fronteira funcional</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{estimate.scopeBoundary}</p>
          </div>
          <div className="px-6 py-7 sm:px-10">
            <p className="eyebrow mb-3">Premissas da implementação</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{estimate.calculationNotes}</p>
          </div>
        </section>

        <section aria-labelledby="report-scope-heading" className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="eyebrow mb-2">Escopo contado</p>
              <h2 id="report-scope-heading" className="text-2xl font-normal tracking-[-0.035em]">Itens e componentes</h2>
            </div>
            <p className="font-mono text-xs text-text-tertiary">{estimate.items.length} itens · {estimate.totalPf} PF</p>
          </div>

          <div className="divide-y divide-line">
            {estimate.items.map((item, index) => (
              <section key={item.id} className="py-7 break-inside-avoid">
                <div className="grid gap-4 sm:grid-cols-[32px_minmax(0,1fr)_auto]">
                  <span className="font-mono text-[10px] text-text-tertiary">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <span className="rounded-full border border-line-subtle px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-text-tertiary">
                        {item.kind === 'custom' ? 'Personalizada' : 'Arquétipo'}
                      </span>
                    </div>
                    <p className="mt-2 max-w-[70ch] text-sm leading-6 text-text-secondary">{item.description}</p>
                    {item.quantity > 1 ? <p className="mt-2 font-mono text-[10px] text-text-tertiary">Quantidade do bloco: {item.quantity}</p> : null}
                  </div>
                  <p className="data-value font-mono text-xl text-accent">{item.totalPf} PF</p>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-y border-line-subtle text-text-tertiary">
                        <th className="py-3 pr-4 font-medium">Componente descrito</th>
                        <th className="px-4 py-3 font-medium">Tipo</th>
                        <th className="px-4 py-3 font-medium">Complexidade</th>
                        <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                        <th className="px-4 py-3 text-right font-medium">Peso</th>
                        <th className="py-3 pl-4 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.components.map((component) => (
                        <tr key={component.id} className="border-b border-line-subtle align-top last:border-0">
                          <td className="py-4 pr-4">
                            <p className="font-medium text-text-primary">{component.name}</p>
                            <p className="mt-1 max-w-[55ch] leading-5 text-text-secondary">{component.description}</p>
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{functionTypeLabels[component.functionType]}</td>
                          <td className="px-4 py-4 text-text-secondary">{complexityLabels[component.complexity]}</td>
                          <td className="data-value px-4 py-4 text-right font-mono">{component.quantity}</td>
                          <td className="data-value px-4 py-4 text-right font-mono">{component.unitPf}</td>
                          <td className="data-value py-4 pl-4 text-right font-mono text-text-primary">{component.totalPf} PF</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="grid border-y border-line bg-black/15 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)]">
          <div className="border-b border-line px-6 py-8 sm:px-10 lg:border-b-0 lg:border-r">
            <p className="eyebrow mb-3">Fórmula aplicada</p>
            <div className="space-y-3 font-mono text-xs leading-6 text-text-secondary">
              <p>{estimate.totalPf} PF × {numberFormatter.format(estimate.hoursPerPf)} h/PF = {numberFormatter.format(estimate.estimatedHours)} horas</p>
              <p>{numberFormatter.format(estimate.estimatedHours)} h × {currencyFormatter.format(estimate.hourlyRate)}/h = {currencyFormatter.format(estimate.baseCost)}</p>
              <p>{currencyFormatter.format(estimate.baseCost)} × {numberFormatter.format(estimate.riskMargin)}% = {currencyFormatter.format(estimate.riskAmount)} de margem</p>
            </div>
          </div>
          <div className="px-6 py-8 sm:px-10">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-5"><dt className="text-text-secondary">Custo-base</dt><dd className="font-mono">{currencyFormatter.format(estimate.baseCost)}</dd></div>
              <div className="flex justify-between gap-5"><dt className="text-text-secondary">Margem de risco</dt><dd className="font-mono">{currencyFormatter.format(estimate.riskAmount)}</dd></div>
            </dl>
            <div className="mt-6 border-t border-accent/25 pt-5">
              <p className="eyebrow mb-2">Investimento estimado</p>
              <p className="data-value font-mono text-3xl font-medium text-accent">{currencyFormatter.format(estimate.totalPrice)}</p>
            </div>
          </div>
        </section>

        <footer className="px-6 py-8 sm:px-10">
          <p className="eyebrow mb-3">Qualificação metodológica</p>
          <p className="text-xs leading-6 text-text-secondary">
            Esta é uma estimativa alinhada às cinco categorias clássicas da Análise de Pontos de Função do IFPUG e aos pesos por complexidade registrados na memória acima. Ela não substitui uma contagem certificada. A identificação da fronteira, dos processos elementares, dos ALR/FTR, DER/DET e RLR/RET deve ser validada conforme o Counting Practices Manual aplicável e as exigências contratuais do cliente.
          </p>
        </footer>
      </article>
    </div>
  );
}
