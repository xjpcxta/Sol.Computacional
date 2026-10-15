import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  EstimateItemKind,
  EstimateAssistantIntent,
  EstimateStatus,
  TemplateCalculationBasis,
  type CreateEstimateRequest,
  type EffectiveCostProfile,
  type Estimate,
  type EstimateConfiguration,
  type EstimatePresetKey,
  type EstimateSummary,
  type Template,
} from '@pricefunc/shared';
import {
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineDocumentReport,
  HiOutlineExclamationCircle,
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { EstimateAssistantDrawer } from '../components/estimates/EstimateAssistantDrawer';
import { CustomFunctionForm } from '../components/estimates/CustomFunctionForm';
import { EstimateBoard } from '../components/estimates/EstimateBoard';
import { PresetRail } from '../components/estimates/PresetRail';
import { presetChangeNeedsConfirmation, togglePreset } from '../components/estimates/presetSelection';
import { Button, CategoryBadge, Panel, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useEstimateAssistant, type EstimateAssistantAction } from '../hooks/useEstimateAssistant';
import { buildEstimateAssistantContext } from '../lib/estimateAssistantContext';
import { getAssistantEligibility } from '../lib/estimateAssistantEligibility';
import {
  applyPresetToBoard,
  templateToBoardItem,
  type BoardItem,
} from '../lib/estimateMath';

const inputClass = 'min-h-11 w-full rounded-input border border-line bg-input px-3.5 text-sm text-text-primary outline-none hover:border-line-strong focus:border-accent focus:shadow-focus placeholder:text-text-tertiary';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

type BoardConfirmation =
  | { type: 'preset'; key: EstimatePresetKey }
  | { type: 'clear' }
  | { type: 'premises'; content: string };

function readApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível salvar a estimativa. Revise os dados e tente novamente.';
}

export function EstimatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [costProfile, setCostProfile] = useState<EffectiveCostProfile | null>(null);
  const [configuration, setConfiguration] = useState<EstimateConfiguration | null>(null);
  const [recentEstimates, setRecentEstimates] = useState<EstimateSummary[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [activePreset, setActivePreset] = useState<EstimatePresetKey | null>(null);
  const [confirmation, setConfirmation] = useState<BoardConfirmation | null>(null);
  const [presetStatus, setPresetStatus] = useState('');
  const confirmationTriggerRef = useRef<HTMLElement | null>(null);
  const confirmationDialogRef = useRef<HTMLDivElement>(null);
  const assistantTriggerRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const scopeInputRef = useRef<HTMLTextAreaElement>(null);
  const calculationNotesRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [scopeBoundary, setScopeBoundary] = useState('');
  const [calculationNotes, setCalculationNotes] = useState(
    'Estimativa preliminar baseada no catálogo atual, sujeita à validação funcional detalhada com o cliente.',
  );
  const [saving, setSaving] = useState<EstimateStatus | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const assistantContext = useMemo(() => buildEstimateAssistantContext({
    title,
    scopeBoundary,
    calculationNotes,
    items,
    templates,
  }), [calculationNotes, items, scopeBoundary, templates, title]);
  const assistantEligibility = useMemo(() => getAssistantEligibility({
    title,
    scopeBoundary,
    boardItemCount: items.length,
  }), [items.length, scopeBoundary, title]);
  const assistant = useEstimateAssistant(assistantContext);
  const assistantDisabledReason = assistant.configurationLoading
    ? 'Verificando disponibilidade do assistente…'
    : !assistant.enabled
      ? 'Configure o assistente de IA no backend para usar esta análise.'
      : assistantEligibility.assistantDisabledReason;
  const boardAnalysisDisabledReason = assistantDisabledReason
    ?? assistantEligibility.boardDisabledReason;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setRecentError(null);
    const [templatesResult, profileResult, configurationResult, recentResult] = await Promise.allSettled([
      api.get<Template[]>('/templates'),
      api.get<EffectiveCostProfile>('/cost-profile'),
      api.get<EstimateConfiguration>('/estimates/configuration'),
      api.get<EstimateSummary[]>('/estimates?limit=6'),
    ]);

    if (
      templatesResult.status === 'rejected'
      || profileResult.status === 'rejected'
      || configurationResult.status === 'rejected'
    ) {
      setLoadError('A lousa precisa do catálogo, do perfil de custo e das regras de cálculo. Um desses dados está indisponível.');
    } else {
      setTemplates(templatesResult.value.data);
      setCostProfile(profileResult.value.data);
      setConfiguration(configurationResult.value.data);
    }

    if (recentResult.status === 'fulfilled') {
      setRecentEstimates(recentResult.value.data);
    } else {
      setRecentError('Não foi possível consultar o histórico agora. Tente novamente para confirmar os orçamentos já salvos.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
    window.requestAnimationFrame(() => confirmationTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!confirmation) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeConfirmation();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeConfirmation, confirmation]);

  const trapConfirmationFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      confirmationDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const first = controls.at(0);
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const selectedTemplateIds = useMemo(() => new Set(
    items.map((item) => item.templateId).filter((id): id is string => Boolean(id)),
  ), [items]);

  const commitPreset = (key: EstimatePresetKey) => {
    if (!configuration) return;
    const preset = configuration.presets.find((candidate) => candidate.key === key);
    if (!preset) return;

    try {
      const nextPreset = togglePreset(activePreset, key);
      if (!nextPreset) {
        setItems([]);
        setActivePreset(null);
        setPresetStatus('Ponto de partida e lousa removidos.');
        return;
      }
      const nextItems = applyPresetToBoard([], preset.templateIds, templates);
      setItems(nextItems);
      setActivePreset(nextPreset);
      setPresetStatus('Ponto de partida atualizado; a lousa anterior foi substituída.');
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Esta configuração inicial está incompleta.');
    }
  };

  const requestPreset = (key: EstimatePresetKey) => {
    if (presetChangeNeedsConfirmation(items.length)) {
      confirmationTriggerRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setConfirmation({ type: 'preset', key });
      return;
    }
    commitPreset(key);
  };

  const requestBoardClear = () => {
    confirmationTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setConfirmation({ type: 'clear' });
  };

  const confirmBoardChange = () => {
    if (!confirmation) return;
    if (confirmation.type === 'preset') {
      commitPreset(confirmation.key);
    } else if (confirmation.type === 'premises') {
      setCalculationNotes(confirmation.content);
    } else {
      setItems([]);
      setActivePreset(null);
      setPresetStatus('Lousa e ponto de partida removidos.');
      setSaveError(null);
    }
    closeConfirmation();
  };

  const rememberAssistantTrigger = () => {
    assistantTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  };

  const openAssistant = () => {
    rememberAssistantTrigger();
    assistant.open();
  };

  const closeAssistant = () => {
    assistant.close();
    window.requestAnimationFrame(() => assistantTriggerRef.current?.focus());
  };

  const startAssistantAction = (action: EstimateAssistantAction) => {
    rememberAssistantTrigger();
    assistant.open();
    if (!assistant.enabled || !assistantEligibility.canUseAssistant) return;
    void assistant.sendAction(action);
  };

  const focusAssistantRequirement = () => {
    assistant.close();
    window.requestAnimationFrame(() => {
      if (assistantEligibility.missingField === 'title') {
        titleInputRef.current?.focus();
      } else {
        scopeInputRef.current?.focus();
      }
    });
  };

  const requestPremisesApply = (content: string) => {
    assistant.close();
    if (!calculationNotes.trim()) {
      setCalculationNotes(content);
      window.requestAnimationFrame(() => calculationNotesRef.current?.focus());
      return;
    }
    confirmationTriggerRef.current = calculationNotesRef.current;
    setConfirmation({ type: 'premises', content });
  };

  const addTemplate = (template: Template) => {
    setItems((current) => {
      const existing = current.find((item) => item.templateId === template.id);
      if (existing) {
        return current.map((item) => (
          item.key === existing.key ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item
        ));
      }
      return [...current, templateToBoardItem(template)];
    });
    setActivePreset(null);
    setSaveError(null);
  };

  const saveEstimate = async (status: EstimateStatus) => {
    setSaveError(null);
    if (title.trim().length < 3 || clientName.trim().length < 2) {
      setSaveError('Informe o nome da estimativa e o cliente.');
      return;
    }
    if (scopeBoundary.trim().length < 30) {
      setSaveError('Descreva em pelo menos 30 caracteres o que está dentro e fora da fronteira desta contagem.');
      return;
    }
    if (calculationNotes.trim().length < 20) {
      setSaveError('Registre as premissas específicas desta implementação.');
      return;
    }
    if (items.length === 0) {
      setSaveError('Coloque pelo menos um item na lousa antes de salvar.');
      return;
    }

    const payload: CreateEstimateRequest = {
      title: title.trim(),
      clientName: clientName.trim(),
      scopeBoundary: scopeBoundary.trim(),
      calculationNotes: calculationNotes.trim(),
      status,
      ...(activePreset ? { presetKey: activePreset } : {}),
      items: items.map((item) => {
        if (item.kind === EstimateItemKind.ARCHETYPE) {
          return {
            kind: item.kind,
            quantity: item.quantity,
            templateId: item.templateId,
          };
        }

        return {
          kind: item.kind,
          quantity: item.quantity,
          name: item.name,
          description: item.description,
          components: item.components.map((component) => ({
            name: component.name,
            description: component.description,
            functionType: component.functionType,
            complexity: component.complexity,
            quantity: component.quantity,
          })),
        };
      }),
    };

    setSaving(status);
    try {
      const response = await api.post<Estimate>('/estimates', payload);
      navigate(`/estimates/${response.data.id}/report`);
    } catch (error) {
      setSaveError(readApiError(error));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-7" aria-label="Preparando módulo de estimativas">
        <Skeleton width="70%" height="60px" />
        <div className="grid gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} shape="block" height="150px" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton shape="block" height="620px" />
          <Skeleton shape="block" height="620px" />
        </div>
      </div>
    );
  }

  if (loadError || !costProfile || !configuration) {
    return (
      <Panel className="flex min-h-[520px] flex-col items-center justify-center px-6 py-12 text-center" role="alert">
        <HiOutlineExclamationCircle aria-hidden="true" className="text-error" size={30} />
        <h1 className="mt-5 text-2xl font-medium">A lousa não pôde ser preparada.</h1>
        <p className="mt-3 max-w-[58ch] text-sm leading-6 text-text-secondary">{loadError}</p>
        <Button onClick={() => void loadData()} icon={<HiOutlineRefresh size={18} />} className="mt-7">
          Tentar novamente
        </Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col gap-6 border-b border-line-subtle pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-3">Estimativas / conversa com o cliente</p>
          <h1 className="max-w-[17ch] font-display text-[clamp(2.6rem,5vw,4.5rem)] font-light leading-[0.98] tracking-[-0.05em]">
            Monte o escopo na mesma mesa.
          </h1>
          <p className="mt-5 max-w-[68ch] text-base leading-7 text-text-secondary">
            Comece por uma configuração conhecida, ajuste os blocos e registre o que só existe nesta implementação.
          </p>
        </div>
        <Button
          className="print-hidden shrink-0"
          icon={<HiOutlineSparkles size={17} />}
          onClick={openAssistant}
        >
          Abrir assistente
        </Button>
      </header>

      <section aria-labelledby="presets-heading">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">Pontos de partida</p>
            <h2 id="presets-heading" className="text-2xl font-normal tracking-[-0.035em]">Configurações iniciais</h2>
          </div>
          <p className="hidden max-w-[38ch] text-right text-xs leading-5 text-text-tertiary md:block">
            Elas aceleram a conversa; nenhum preset substitui a validação do escopo.
          </p>
        </div>
        <PresetRail presets={configuration.presets} activePreset={activePreset} onSelect={requestPreset} />
        <p className="sr-only" aria-live="polite">{presetStatus}</p>
      </section>

      {confirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConfirmation(); }}>
          <div ref={confirmationDialogRef} role="dialog" aria-modal="true" aria-labelledby="preset-confirm-title" aria-describedby="preset-confirm-description" onKeyDown={trapConfirmationFocus} className="w-full max-w-md rounded-panel border border-line bg-overlay p-6 shadow-overlay">
            <p className="eyebrow mb-2">Confirmar alteração</p>
            <h2 id="preset-confirm-title" className="text-xl font-medium">
              {confirmation.type === 'premises'
                ? 'Substituir as premissas atuais?'
                : confirmation.type === 'clear' || activePreset === confirmation.key
                ? 'Limpar a lousa atual?'
                : 'Substituir a lousa atual?'}
            </h2>
            <p id="preset-confirm-description" className="mt-3 text-sm leading-6 text-text-secondary">
              {confirmation.type === 'premises'
                ? 'O texto sugerido pela IA substituirá o conteúdo atual. A estimativa continuará sem ser salva até sua confirmação final.'
                : confirmation.type === 'clear' || activePreset === confirmation.key
                ? 'O ponto de partida será desmarcado e todos os itens da lousa serão removidos.'
                : 'Todos os itens atuais, inclusive funcionalidades personalizadas, serão substituídos pelo novo ponto de partida.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={closeConfirmation}>Cancelar</Button>
              <Button variant="primary" autoFocus onClick={confirmBoardChange}>
                {confirmation.type === 'premises'
                  ? 'Substituir premissas'
                  : confirmation.type === 'clear' || activePreset === confirmation.key
                    ? 'Limpar lousa'
                    : 'Substituir lousa'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <section aria-labelledby="project-data-heading" className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <p className="eyebrow mb-2">Identificação</p>
          <h2 id="project-data-heading" className="text-lg font-medium">Projeto e cliente</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-text-secondary">
              Nome da estimativa
              <input ref={titleInputRef} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ex.: Portal B2B — Fase 1" className={`${inputClass} mt-2`} />
            </label>
            <label className="text-xs font-medium text-text-secondary">
              Cliente
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} maxLength={120} placeholder="Nome da empresa ou área" className={`${inputClass} mt-2`} />
            </label>
          </div>
          <label className="mt-4 block text-xs font-medium text-text-secondary">
            Fronteira e escopo funcional
            <textarea
              ref={scopeInputRef}
              value={scopeBoundary}
              onChange={(event) => setScopeBoundary(event.target.value)}
              maxLength={2000}
              placeholder="Defina a aplicação contada, seus usuários funcionais, o que entra e o que fica fora desta estimativa."
              className={`${inputClass} mt-2 min-h-[132px] resize-y py-3 leading-6`}
            />
            <span className="mt-1.5 block text-right font-mono text-[10px] text-text-tertiary">{scopeBoundary.trim().length}/2000 · mínimo 30 para salvar · 120 para IA</span>
          </label>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">Premissas</p>
              <h2 className="text-lg font-medium">Como esta conta deve ser lida</h2>
            </div>
            <Button
              className="print-hidden"
              icon={<HiOutlineSparkles size={16} />}
              disabled={Boolean(assistantDisabledReason)}
              title={assistantDisabledReason}
              onClick={() => startAssistantAction({
                intent: EstimateAssistantIntent.PREMISES_DRAFT,
                visibleMessage: 'Ajude a redigir as premissas desta estimativa.',
              })}
            >
              Ajudar com IA
            </Button>
          </div>
          <textarea
            ref={calculationNotesRef}
            aria-label="Premissas específicas da estimativa"
            value={calculationNotes}
            onChange={(event) => setCalculationNotes(event.target.value)}
            maxLength={3000}
            className={`${inputClass} mt-5 min-h-[212px] resize-y py-3 leading-6`}
          />
          <p className="mt-3 text-xs leading-5 text-text-tertiary">
            O relatório também mostrará os pesos, a produtividade, o valor/hora e a margem usados no momento do salvamento.
          </p>
        </Panel>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.78fr)_minmax(520px,1.22fr)]">
        <div className="space-y-6">
          <Panel className="overflow-hidden">
            <div className="border-b border-line-subtle px-5 py-5">
              <p className="eyebrow mb-2">Catálogo</p>
              <h2 className="text-base font-medium">Adicionar arquétipos</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Clique para levar um bloco à lousa. Novos cliques aumentam a quantidade.</p>
            </div>
            {templates.length === 0 ? (
              <div className="p-5 text-sm text-text-secondary">
                O catálogo está vazio. <Link to="/catalog" className="text-accent hover:text-accent-hover">Cadastre um arquétipo.</Link>
              </div>
            ) : (
              <ul className="max-h-[460px] divide-y divide-line-subtle overflow-y-auto [scrollbar-gutter:stable]">
                {templates.map((template) => {
                  const selectedItem = items.find((item) => item.templateId === template.id);
                  const selected = selectedTemplateIds.has(template.id);
                  return (
                    <li key={template.id}>
                      <button
                        type="button"
                        onClick={() => addTemplate(template)}
                        aria-label={`Adicionar ${template.name} à estimativa. Quantidade atual ${selectedItem?.quantity ?? 0}.`}
                        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${selected ? 'bg-accent-soft' : 'hover:bg-white/[0.025]'}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-button border font-mono text-sm ${selected ? 'border-accent/35 text-accent' : 'border-line-subtle text-text-tertiary'}`}>
                          {selected ? <HiOutlineCheck aria-hidden="true" size={17} /> : <HiOutlinePlus aria-hidden="true" size={17} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text-primary">{template.name}</span>
                          <span className="mt-1 block"><CategoryBadge category={template.category} className="text-xs" /></span>
                        </span>
                        <span className="data-value shrink-0 font-mono text-xs text-text-secondary">
                          {template.calculationBasis === TemplateCalculationBasis.SERVICE_HOURS
                            ? `${template.serviceHours.toLocaleString('pt-BR')} h`
                            : `${template.totalPf.toLocaleString('pt-BR')} PF`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <CustomFunctionForm
            weights={configuration.weights}
            analysisDisabledReason={assistantDisabledReason}
            onAnalyze={(draft) => startAssistantAction({
              intent: EstimateAssistantIntent.CUSTOM_FUNCTION_REVIEW,
              visibleMessage: `Analise a funcionalidade personalizada “${draft.name || 'sem nome'}”.`,
              customFunction: draft,
            })}
            onAdd={(item) => {
              setItems((current) => [...current, item]);
              setSaveError(null);
            }}
          />
        </div>

        <div className="xl:sticky xl:top-6">
          <EstimateBoard
            items={items}
            weights={configuration.weights}
            costProfile={costProfile}
            onQuantityChange={(key, quantity) => setItems((current) => current.map((item) => (
              item.key === key ? { ...item, quantity } : item
            )))}
            onRemove={(key) => {
              setItems((current) => current.filter((item) => item.key !== key));
              setActivePreset(null);
            }}
            onClear={requestBoardClear}
            onAnalyze={() => startAssistantAction({
              intent: EstimateAssistantIntent.BOARD_REVIEW,
              visibleMessage: 'Analise a lousa atual e identifique possíveis lacunas.',
            })}
            analysisDisabledReason={boardAnalysisDisabledReason}
          />

          {saveError ? (
            <p role="alert" className="mt-4 rounded-input border border-error/25 bg-error/[0.055] px-4 py-3 text-sm leading-6 text-error">
              {saveError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              icon={<HiOutlineSave size={18} />}
              onClick={() => void saveEstimate(EstimateStatus.DRAFT)}
              isLoading={saving === EstimateStatus.DRAFT}
              disabled={saving !== null}
              fullWidth
            >
              Salvar rascunho
            </Button>
            <Button
              variant="primary"
              icon={<HiOutlinePaperAirplane size={18} />}
              onClick={() => void saveEstimate(EstimateStatus.SENT)}
              isLoading={saving === EstimateStatus.SENT}
              disabled={saving !== null}
              fullWidth
            >
              Salvar como enviado
            </Button>
          </div>
        </div>
      </div>

      <section aria-labelledby="recent-estimates-heading" className="border-t border-line-subtle pt-10">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-2">Histórico</p>
            <h2 id="recent-estimates-heading" className="text-2xl font-normal tracking-[-0.035em]">Estimativas recentes</h2>
          </div>
          <span className="font-mono text-xs text-text-tertiary">{recentEstimates.length} exibidas</span>
        </div>
        {recentError ? (
          <Panel role="alert" className="flex flex-col items-start gap-4 px-6 py-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <span>{recentError}</span>
            <Button onClick={() => void loadData()} icon={<HiOutlineRefresh size={17} />}>
              Tentar novamente
            </Button>
          </Panel>
        ) : recentEstimates.length === 0 ? (
          <Panel className="px-6 py-8 text-sm text-text-secondary">Nenhuma estimativa salva ainda.</Panel>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recentEstimates.map((estimate) => (
              <Link
                key={estimate.id}
                to={`/estimates/${estimate.id}/report`}
                className="group flex items-center gap-4 rounded-panel border border-line-subtle bg-white/[0.018] px-5 py-4 hover:border-line-strong hover:bg-white/[0.03]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-line-subtle text-text-secondary">
                  <HiOutlineDocumentReport aria-hidden="true" size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">{estimate.title}</span>
                  <span className="mt-1 block truncate text-xs text-text-tertiary">
                    {estimate.clientName} · {dateFormatter.format(new Date(estimate.createdAt)).replace('.', '')} · {estimate.status === EstimateStatus.SENT ? 'Enviada' : 'Rascunho'}
                  </span>
                </span>
                <HiOutlineArrowRight aria-hidden="true" className="text-text-tertiary transition-transform group-hover:translate-x-1 group-hover:text-accent" size={18} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <EstimateAssistantDrawer
        open={assistant.isOpen}
        enabled={assistant.enabled}
        configurationLoading={assistant.configurationLoading}
        messages={assistant.messages}
        isSending={assistant.isSending}
        error={assistant.error}
        eligibilityReason={assistantEligibility.assistantDisabledReason}
        onClose={closeAssistant}
        onSend={assistant.sendChat}
        onRetry={assistant.retry}
        onCancel={assistant.cancel}
        onApplyPremises={requestPremisesApply}
        onFocusRequirement={focusAssistantRequirement}
      />
    </div>
  );
}
