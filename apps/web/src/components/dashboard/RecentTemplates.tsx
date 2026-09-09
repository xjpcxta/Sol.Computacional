import type { Template } from '@pricefunc/shared';
import { HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlineTemplate } from 'react-icons/hi';
import { Button, CategoryBadge, Panel, Skeleton } from '../ui';

interface RecentTemplatesProps {
  templates: Template[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="border-b border-line-subtle last:border-0">
      <td className="px-5 py-4 sm:px-6">
        <Skeleton width={index % 2 === 0 ? '220px' : '176px'} height="16px" />
        <Skeleton width="260px" height="12px" className="mt-2" />
      </td>
      <td className="px-5 py-4 sm:px-6"><Skeleton width="96px" height="16px" /></td>
      <td className="px-5 py-4 text-right sm:px-6"><Skeleton width="52px" height="20px" className="ml-auto" /></td>
    </tr>
  ));
}

export function RecentTemplates({
  templates,
  loading,
  error,
  onRetry,
}: RecentTemplatesProps) {
  const isEmpty = !loading && !error && templates.length === 0;

  return (
    <section aria-labelledby="templates-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Catálogo</p>
          <h2 id="templates-heading" className="font-display text-2xl font-normal tracking-[-0.035em] sm:text-3xl">
            Arquétipos recentes
          </h2>
        </div>
        {!loading && !error ? (
          <p className="font-mono text-xs text-text-tertiary">
            {templates.length > 0 ? `${Math.min(templates.length, 5)} exibidos` : 'Catálogo vazio'}
          </p>
        ) : null}
      </div>

      <Panel className="overflow-hidden rounded-panel" aria-busy={loading}>
        {error ? (
          <div role="alert" className="flex min-h-[250px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-button border border-error/25 bg-error/[0.055] text-error">
              <HiOutlineExclamationCircle aria-hidden="true" size={21} />
            </span>
            <h3 className="mt-5 text-lg font-medium">O catálogo não pôde ser carregado.</h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-6 text-text-secondary">{error}</p>
            <Button onClick={onRetry} icon={<HiOutlineRefresh size={18} />} className="mt-6">
              Tentar novamente
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-button border border-line-subtle text-text-tertiary">
              <HiOutlineTemplate aria-hidden="true" size={21} />
            </span>
            <h3 className="mt-4 text-lg font-medium">Nenhum arquétipo disponível.</h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-6 text-text-secondary">
              Atualize o catálogo para verificar se novos blocos já estão disponíveis.
            </p>
            <Button onClick={onRetry} icon={<HiOutlineRefresh size={18} />} className="mt-6">
              Atualizar catálogo
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-gutter:stable]">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead className="bg-black/10">
                <tr className="border-b border-line-subtle text-xs font-medium text-text-secondary">
                  <th scope="col" className="px-5 py-3.5 font-medium sm:px-6">Arquétipo</th>
                  <th scope="col" className="px-5 py-3.5 font-medium sm:px-6">Categoria</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-medium sm:px-6">Pontos de Função</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : (
                  templates.slice(0, 5).map((template) => (
                    <tr key={template.id} className="border-b border-line-subtle transition-colors duration-fast ease-out last:border-0 hover:bg-white/[0.025]">
                      <td className="max-w-[420px] px-5 py-4 sm:px-6">
                        <p className="truncate text-sm font-medium text-text-primary" title={template.name}>{template.name}</p>
                        <p className="mt-1 truncate text-xs text-text-tertiary" title={template.description}>{template.description}</p>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <CategoryBadge category={template.category} />
                      </td>
                      <td className="data-value px-5 py-4 text-right font-mono text-sm font-medium text-text-primary sm:px-6">
                        {template.totalPf} PF
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </section>
  );
}
