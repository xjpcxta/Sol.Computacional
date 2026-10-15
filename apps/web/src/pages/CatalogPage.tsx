import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Template } from '@pricefunc/shared';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineTemplate,
} from 'react-icons/hi';
import { ArchetypeCard } from '../components/catalog/ArchetypeCard';
import { ArchetypeForm } from '../components/catalog/ArchetypeForm';
import { Button, Panel, Skeleton } from '../components/ui';
import { api } from '../lib/api';

export function CatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Template[]>('/templates');
      setTemplates(response.data);
    } catch {
      setError('Não foi possível carregar o catálogo. Verifique a conexão com a API e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return templates;
    return templates.filter((template) => (
      template.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      || template.description.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
    ));
  }, [query, templates]);

  const handleCreated = (template: Template) => {
    setTemplates((current) => [template, ...current]);
    setFormOpen(false);
    setSuccess(`“${template.name}” entrou no catálogo e já conta no total do dashboard.`);
    window.setTimeout(() => setSuccess(null), 6000);
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="grid gap-6 border-b border-line-subtle pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-3">Catálogo / base de estimativa</p>
          <h1 className="max-w-[16ch] font-display text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-[0.98] tracking-[-0.05em]">
            Arquétipos que explicam a conta.
          </h1>
          <p className="mt-5 max-w-[66ch] text-base leading-7 text-text-secondary">
            Cada bloco registra sua memória detalhada, por Pontos de Função ou por atividades consultivas estimadas em horas.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<HiOutlinePlus size={19} />}
          onClick={() => {
            setFormOpen(true);
            setSuccess(null);
          }}
          disabled={formOpen}
        >
          Novo arquétipo
        </Button>
      </header>

      {success ? (
        <div role="status" className="flex items-center gap-3 rounded-panel border border-success/25 bg-success/[0.055] px-5 py-4 text-sm text-text-secondary">
          <HiOutlineCheckCircle aria-hidden="true" className="shrink-0 text-success" size={20} />
          {success}
        </div>
      ) : null}

      {formOpen ? (
        <ArchetypeForm onCreated={handleCreated} onCancel={() => setFormOpen(false)} />
      ) : null}

      <section aria-labelledby="catalog-list-heading">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2">Biblioteca atual</p>
            <h2 id="catalog-list-heading" className="text-2xl font-normal tracking-[-0.035em]">
              {loading ? 'Consultando registros' : `${templates.length} arquétipos disponíveis`}
            </h2>
          </div>
          <label className="relative block w-full sm:max-w-[320px]">
            <span className="sr-only">Buscar no catálogo</span>
            <HiOutlineSearch aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou descrição"
              className="min-h-11 w-full rounded-input border border-line bg-input pl-10 pr-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary hover:border-line-strong focus:border-accent focus:shadow-focus"
            />
          </label>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3" aria-label="Carregando catálogo">
            {Array.from({ length: 6 }, (_, index) => (
              <Panel key={index} className="p-6"><Skeleton shape="block" height="260px" /></Panel>
            ))}
          </div>
        ) : error ? (
          <Panel className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center" role="alert">
            <HiOutlineExclamationCircle aria-hidden="true" className="text-error" size={28} />
            <h2 className="mt-4 text-xl font-medium">O catálogo não pôde ser carregado.</h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-text-secondary">{error}</p>
            <Button onClick={() => void loadTemplates()} icon={<HiOutlineRefresh size={18} />} className="mt-6">
              Tentar novamente
            </Button>
          </Panel>
        ) : templates.length === 0 ? (
          <Panel className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
            <HiOutlineTemplate aria-hidden="true" className="text-text-tertiary" size={28} />
            <h2 className="mt-4 text-xl font-medium">O catálogo está vazio.</h2>
            <p className="mt-2 max-w-[50ch] text-sm leading-6 text-text-secondary">
              Cadastre o primeiro arquétipo com sua memória de cálculo funcional ou consultiva.
            </p>
            <Button variant="primary" onClick={() => setFormOpen(true)} icon={<HiOutlinePlus size={18} />} className="mt-6">
              Criar primeiro arquétipo
            </Button>
          </Panel>
        ) : filteredTemplates.length === 0 ? (
          <Panel className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <HiOutlineSearch aria-hidden="true" className="text-text-tertiary" size={26} />
            <h2 className="mt-4 text-lg font-medium">Nenhum arquétipo corresponde à busca.</h2>
            <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm text-accent hover:text-accent-hover">
              Limpar busca
            </button>
          </Panel>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <ArchetypeCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
