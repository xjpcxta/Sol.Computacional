import {
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';
import { Panel } from '../ui';

export interface SentBudgetSummary {
  id: string;
  clientName: string;
  title: string;
  amount: number;
  sentAt: string;
}

interface LatestBudgetsProps {
  budgets: readonly SentBudgetSummary[];
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatSentAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return dateFormatter.format(date).replace('.', '');
}

export function LatestBudgets({ budgets }: LatestBudgetsProps) {
  const latestBudgets = budgets.slice(0, 3);

  return (
    <section
      aria-labelledby="latest-budgets-heading"
      className="flex h-full flex-col"
    >
      <div aria-hidden="true" className="mb-5 hidden xl:block xl:min-h-[96px]" />

      <Panel className="flex min-h-[336px] flex-1 flex-col overflow-hidden">
        <div className="border-b border-line-subtle px-5 py-5">
          <p className="eyebrow mb-2">Propostas</p>
          <h2
            id="latest-budgets-heading"
            className="text-lg font-medium tracking-[-0.025em] text-text-primary"
          >
            Últimos orçamentos enviados
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            O que já foi compartilhado com clientes.
          </p>
        </div>

        {latestBudgets.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-line-subtle px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-button border border-line-subtle text-text-secondary">
                  <HiOutlinePaperAirplane aria-hidden="true" size={17} />
                </span>
                <p className="text-sm font-medium text-text-primary">Envios recentes</p>
              </div>
              <span className="font-mono text-[10px] text-text-tertiary">
                {latestBudgets.length} de {budgets.length}
              </span>
            </div>

            <ul className="divide-y divide-line-subtle">
              {latestBudgets.map((budget) => (
                <li
                  key={budget.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary" title={budget.title}>
                      {budget.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-text-tertiary" title={budget.clientName}>
                      {budget.clientName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="data-value font-mono text-sm font-medium text-text-primary">
                      {currencyFormatter.format(budget.amount)}
                    </p>
                    <time
                      dateTime={budget.sentAt}
                      className="mt-1 block font-mono text-[10px] text-text-tertiary"
                    >
                      {formatSentAt(budget.sentAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-1 flex-col px-5 py-6 sm:px-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-button border border-line-subtle bg-white/[0.025] text-text-secondary">
              <HiOutlineDocumentText aria-hidden="true" size={21} />
            </span>

            <div className="my-auto py-8">
              <h3 className="max-w-[18ch] text-xl font-medium tracking-[-0.025em] text-text-primary">
                Nenhum orçamento enviado
              </h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-6 text-text-secondary">
                Quando uma proposta for compartilhada, cliente, valor e data aparecerão aqui.
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-line-subtle pt-4">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
              <p className="font-mono text-[10px] text-text-tertiary">
                Aguardando o primeiro envio
              </p>
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
